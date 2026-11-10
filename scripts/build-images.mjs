#!/usr/bin/env node
/**
 * scripts/build-images.mjs — pipeline de imágenes del catálogo (fase F6).
 *
 * Para cada imagen original (jpg/jpeg/png) de assets/catalog genera variantes
 * WebP en los anchos 480/960/1440 sin ampliar (solo se emiten los anchos que
 * caben en el original; si el original es menor que el primer ancho se emite
 * una variante a su ancho nativo) con calidad 72. Como extensión opcional
 * intenta AVIF en el ancho mayor de cada imagen únicamente si el entorno
 * responde rápido; si tarda demasiado o falla, se detiene y se queda en WebP.
 *
 * Límites AVIF en modo local (best-effort, no bloquean el build):
 *   AVIF_MAX_SINGLE_MS — una sola codificación AVIF que supere este tiempo
 *   desactiva AVIF para el resto del lote.
 *   AVIF_BUDGET_MS — tiempo acumulado AVIF; superarlo también detiene AVIF.
 *
 * Modo canónico (`--canonical`): la frescura de cada variante depende de la
 * huella SHA-256 del original y de la configuración de generación (anchos,
 * calidades, esfuerzo), no del mtime del disco. Mismos originales y misma
 * configuración → mismo inventario y manifiesto. AVIF se omite en canónico para
 * no atar el manifiesto a la CPU del entorno. El presupuesto de ~4 MB en
 * variantes se mide y se registra en consola; no es gate bloqueante sin
 * baseline medido en CI.
 *
 * Los originales viven en assets/catalog (fuera del bundle público) y nunca se
 * borran. En modo local, sin `--force`, una variante solo se regenera si falta
 * o es más antigua que el original (mtime).
 *
 * Además emite src/data/images.gen.ts con el manifiesto tipado y elimina
 * variantes obsoletas en el directorio de salida que ya no tienen original.
 *
 * Uso:
 *   node scripts/build-images.mjs [--force] [--canonical]
 */

import { createHash } from "node:crypto";
import sharp from "sharp";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "assets", "catalog");
const CATALOG_DIR = path.join(ROOT, "public", "catalog");
const GEN_FILE = path.join(ROOT, "src", "data", "images.gen.ts");

export const WIDTHS = [480, 960, 1440];
export const WEBP_QUALITY = 72;
export const WEBP_EFFORT = 4;
export const AVIF_QUALITY = 50;
export const AVIF_EFFORT = 3;
export const AVIF_MAX_SINGLE_MS = 3000;
export const AVIF_BUDGET_MS = 20000;
export const BUDGET_BYTES = 4 * 1024 * 1024;
export const IMAGE_RE = /\.(jpe?g|png)$/i;
export const FINGERPRINTS_BASENAME = ".vapelog-catalog-images.json";
export const VARIANT_OUTPUT_RE = /^(.+)-(\d+)\.(webp|avif)$/i;

/** @type {Record<string, number | number[]>} */
export const IMAGE_BUILD_CONFIG = {
  widths: WIDTHS,
  webpQuality: WEBP_QUALITY,
  webpEffort: WEBP_EFFORT,
  avifQuality: AVIF_QUALITY,
  avifEffort: AVIF_EFFORT,
};

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/**
 * @param {string[]} argv
 */
export function parseBuildImagesArgs(argv) {
  return {
    force: argv.includes("--force"),
    canonical: argv.includes("--canonical"),
  };
}

export function buildConfigFingerprint() {
  const payload = JSON.stringify(IMAGE_BUILD_CONFIG);
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * @param {string[]} fileNames
 * @returns {{ base: string; files: string[] }[]}
 */
export function findBaseNameCollisions(fileNames) {
  /** @type {Map<string, string[]>} */
  const byBase = new Map();
  for (const file of fileNames) {
    const base = path.parse(file).name;
    const list = byBase.get(base) ?? [];
    list.push(file);
    byBase.set(base, list);
  }
  return [...byBase.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([base, files]) => ({ base, files: [...files].sort() }));
}

async function statOrNull(target) {
  try {
    return await stat(target);
  } catch {
    return null;
  }
}

/**
 * @param {string} filePath
 */
async function sha256File(filePath) {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function walkBytes(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await walkBytes(abs);
    else total += (await stat(abs)).size;
  }
  return total;
}

/**
 * @param {string} catalogDir
 * @param {Set<string>} expectedNames
 */
export async function pruneObsoleteVariants(catalogDir, expectedNames) {
  const dirStat = await statOrNull(catalogDir);
  if (!dirStat?.isDirectory()) return { removed: [] };

  const removed = [];
  for (const entry of await readdir(catalogDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!VARIANT_OUTPUT_RE.test(entry.name)) continue;
    if (expectedNames.has(entry.name)) continue;
    await unlink(path.join(catalogDir, entry.name));
    removed.push(entry.name);
  }
  return { removed: removed.sort() };
}

/**
 * @param {Awaited<ReturnType<typeof stat>> | null} existing
 * @param {Awaited<ReturnType<typeof stat>>} srcStat
 */
export function variantFreshByMtime(existing, srcStat) {
  return Boolean(existing && existing.size > 0 && existing.mtimeMs >= srcStat.mtimeMs);
}

/**
 * @param {Awaited<ReturnType<typeof stat>> | null} existing
 * @param {{ sourceSha256?: string; configSha256?: string } | undefined} entry
 * @param {string} sourceSha
 * @param {string} configSha
 */
export function variantFreshByFingerprint(existing, entry, sourceSha, configSha) {
  return Boolean(
    existing &&
    existing.size > 0 &&
    entry?.sourceSha256 === sourceSha &&
    entry?.configSha256 === configSha,
  );
}

/**
 * @param {{
 *   root?: string;
 *   sourceDir?: string;
 *   catalogDir?: string;
 *   genFile?: string;
 *   force?: boolean;
 *   canonical?: boolean;
 *   sharpImpl?: typeof sharp;
 *   logger?: Pick<Console, "log">;
 * }} [options]
 */
export async function buildCatalogImages(options = {}) {
  const root = options.root ?? ROOT;
  const sourceDir = options.sourceDir ?? path.join(root, "assets", "catalog");
  const catalogDir = options.catalogDir ?? path.join(root, "public", "catalog");
  const genFile = options.genFile ?? path.join(root, "src", "data", "images.gen.ts");
  const force = options.force ?? false;
  const canonical = options.canonical ?? false;
  const sharpImpl = options.sharpImpl ?? sharp;
  const logger = options.logger ?? console;

  const sourceDirStat = await statOrNull(sourceDir);
  if (!sourceDirStat?.isDirectory()) {
    const error = new Error(`build-images: directorio de origen ausente: ${sourceDir}`);
    error.code = "MISSING_SOURCE_DIR";
    throw error;
  }

  await mkdir(catalogDir, { recursive: true });
  await mkdir(path.dirname(genFile), { recursive: true });

  const files = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && IMAGE_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const collisions = findBaseNameCollisions(files);
  if (collisions.length > 0) {
    const detail = collisions.map((c) => `${c.base} ← ${c.files.join(", ")}`).join("; ");
    const error = new Error(`build-images: colisión de nombre base en originales: ${detail}`);
    error.code = "BASE_NAME_COLLISION";
    error.collisions = collisions;
    throw error;
  }

  const configSha = buildConfigFingerprint();
  const fingerprintsPath = path.join(catalogDir, FINGERPRINTS_BASENAME);
  /** @type {{ configSha256?: string; variants?: Record<string, { source: string; sourceSha256: string; configSha256: string; width: number; format: string }> }} */
  let fingerprintStore = { configSha256: configSha, variants: {} };
  if (!force) {
    try {
      const raw = await readFile(fingerprintsPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        fingerprintStore = {
          configSha256: parsed.configSha256 ?? configSha,
          variants: parsed.variants && typeof parsed.variants === "object" ? parsed.variants : {},
        };
      }
    } catch {
      // sin sidecar previo
    }
  } else {
    fingerprintStore = { configSha256: configSha, variants: {} };
  }

  /** @type {Record<string, { width: number; height: number; variants: { width: number; src: string; bytes: number }[] }>} */
  const manifest = {};

  let originalBytes = 0;
  let variantBytes = 0;
  let variantCount = 0;
  let written = 0;
  let reused = 0;
  let avifEnabled = !canonical;
  let avifCount = 0;
  let avifMs = 0;
  /** @type {string | null} */
  let avifNote = canonical ? "omiso en modo canónico (reproducibilidad)" : null;

  /** @type {Set<string>} */
  const expectedOutputs = new Set();
  /** @type {Record<string, { source: string; sourceSha256: string; configSha256: string; width: number; format: string }>} */
  const nextFingerprintVariants = {};

  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    const srcStat = await stat(srcPath);
    originalBytes += srcStat.size;
    const sourceSha = await sha256File(srcPath);

    const meta = await sharpImpl(srcPath).metadata();
    const base = path.parse(file).name;
    const widths = WIDTHS.filter((width) => width <= (meta.width ?? 0));
    if (widths.length === 0 && meta.width) widths.push(meta.width);

    /** @type {{ width: number; src: string; bytes: number }[]} */
    const variants = [];

    for (const width of widths) {
      const fileName = `${base}-${width}.webp`;
      expectedOutputs.add(fileName);
      const outPath = path.join(catalogDir, fileName);
      const publicSrc = `/catalog/${fileName}`;
      const existing = force ? null : await statOrNull(outPath);
      const sidecar = fingerprintStore.variants?.[fileName];
      const fresh = canonical
        ? variantFreshByFingerprint(existing, sidecar, sourceSha, configSha)
        : variantFreshByMtime(existing, srcStat);

      let bytes;
      if (fresh && existing) {
        bytes = existing.size;
        reused += 1;
      } else {
        const buf = await sharpImpl(srcPath)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
          .toBuffer();
        await writeFile(outPath, buf);
        bytes = buf.length;
        written += 1;
      }

      nextFingerprintVariants[fileName] = {
        source: file,
        sourceSha256: sourceSha,
        configSha256: configSha,
        width,
        format: "webp",
      };

      variants.push({ width, src: publicSrc, bytes });
      variantBytes += bytes;
      variantCount += 1;
    }

    if (avifEnabled && widths.length > 0) {
      const width = widths[widths.length - 1];
      const fileName = `${base}-${width}.avif`;
      expectedOutputs.add(fileName);
      const outPath = path.join(catalogDir, fileName);
      const publicSrc = `/catalog/${fileName}`;
      const existing = force ? null : await statOrNull(outPath);
      const sidecar = fingerprintStore.variants?.[fileName];
      const fresh = canonical
        ? variantFreshByFingerprint(existing, sidecar, sourceSha, configSha)
        : variantFreshByMtime(existing, srcStat);

      if (fresh && existing) {
        variants.push({ width, src: publicSrc, bytes: existing.size });
        variantBytes += existing.size;
        variantCount += 1;
        reused += 1;
        avifCount += 1;
        nextFingerprintVariants[fileName] = {
          source: file,
          sourceSha256: sourceSha,
          configSha256: configSha,
          width,
          format: "avif",
        };
      } else {
        try {
          const started = Date.now();
          const buf = await sharpImpl(srcPath)
            .resize({ width, withoutEnlargement: true })
            .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
            .toBuffer();
          const elapsed = Date.now() - started;
          avifMs += elapsed;

          await writeFile(outPath, buf);
          variants.push({ width, src: publicSrc, bytes: buf.length });
          variantBytes += buf.length;
          variantCount += 1;
          written += 1;
          avifCount += 1;
          nextFingerprintVariants[fileName] = {
            source: file,
            sourceSha256: sourceSha,
            configSha256: configSha,
            width,
            format: "avif",
          };

          if (elapsed > AVIF_MAX_SINGLE_MS || avifMs > AVIF_BUDGET_MS) {
            avifEnabled = false;
            avifNote = `detenido por lentitud (${elapsed} ms; acumulado ${avifMs} ms)`;
          }
        } catch (error) {
          avifEnabled = false;
          avifNote = `detenido por error (${error instanceof Error ? error.message : String(error)})`;
        }
      }
    }

    variants.sort((a, b) => a.width - b.width || a.src.localeCompare(b.src));
    manifest[file] = {
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      variants,
    };
  }

  const prune = await pruneObsoleteVariants(catalogDir, expectedOutputs);

  await writeFile(
    fingerprintsPath,
    `${JSON.stringify({ configSha256: configSha, variants: nextFingerprintVariants }, null, 2)}\n`,
  );

  const header = [
    "/**",
    " * generado por scripts/build-images.mjs — no editar a mano",
    " *",
    " * Manifiesto de imágenes del catálogo Vapelog. La clave es el nombre del",
    " * fichero original en assets/catalog; width/height son sus dimensiones y",
    " * variants las variantes generadas (WebP y, en el ancho mayor, AVIF cuando",
    " * el entorno es rápido) con su ruta pública y tamaño en bytes.",
    " */",
  ].join("\n");

  const typeDef = [
    "export const catalogImageManifest: Record<",
    "  string,",
    "  {",
    "    width: number;",
    "    height: number;",
    "    variants: { width: number; src: string; bytes: number }[];",
    "  }",
    "> =",
  ].join("\n");

  const manifestBody = `${header}\n\n${typeDef} ${JSON.stringify(manifest, null, 2)};\n`;
  await writeFile(genFile, manifestBody);

  const catalogBytes = await walkBytes(catalogDir);

  const avifStatus = canonical
    ? "omiso (modo canónico)"
    : avifCount === 0
      ? "no generado"
      : avifEnabled
        ? `activo (${avifCount} ficheros${avifMs > 0 ? `, ${avifMs} ms` : ""})`
        : `parcial (${avifCount} ficheros); ${avifNote}`;

  const withinBudget = variantBytes <= BUDGET_BYTES;

  logger.log(`originales: ${files.length} (${mb(originalBytes)})`);
  logger.log(
    `variantes: ${variantCount} (webp ${variantCount - avifCount}, avif ${avifCount}; ${written} escritas, ${reused} reutilizadas)`,
  );
  logger.log(`bytes de variantes: ${variantBytes} (${mb(variantBytes)})`);
  logger.log(`public/catalog tras generar: ${catalogBytes} (${mb(catalogBytes)})`);
  logger.log(`AVIF: ${avifStatus}`);
  logger.log(
    `objetivo ≤ 4 MB solo variantes: ${withinBudget ? "ALCANZABLE" : "NO alcanzable"} (${mb(variantBytes)}; informativo, sin gate)`,
  );
  logger.log(`manifiesto: ${path.relative(root, genFile)}`);
  if (prune.removed.length > 0) {
    logger.log(`obsoletas eliminadas: ${prune.removed.length}`);
  }

  return {
    manifest,
    manifestBody,
    configSha256: configSha,
    mode: canonical ? "canonical" : "local",
    stats: {
      originals: files.length,
      variantCount,
      variantBytes,
      written,
      reused,
      avifCount,
      withinBudget,
      budgetBytes: BUDGET_BYTES,
      budgetBlocking: false,
      pruned: prune.removed,
    },
  };
}

async function main() {
  const { force, canonical } = parseBuildImagesArgs(process.argv);
  await buildCatalogImages({
    force,
    canonical,
    sourceDir: SOURCE_DIR,
    catalogDir: CATALOG_DIR,
    genFile: GEN_FILE,
  });
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("build-images.mjs") || process.argv[1].endsWith("/build-images.mjs"));

if (isDirect) {
  main().catch((error) => {
    console.error(`build-images: ${error.stack ?? error.message}`);
    process.exitCode = 1;
  });
}
