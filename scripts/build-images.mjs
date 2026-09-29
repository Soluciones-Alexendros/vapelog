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
 * Los originales viven en assets/catalog (fuera del bundle público) y nunca se
 * borran. Es idempotente: una variante solo se regenera si falta o es más
 * antigua que el original.
 *
 * Además emite src/data/images.gen.ts con el manifiesto tipado.
 *
 * Uso:
 *   node scripts/build-images.mjs [--force]
 */

import sharp from "sharp";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "assets", "catalog");
const CATALOG_DIR = path.join(ROOT, "public", "catalog");
const GEN_FILE = path.join(ROOT, "src", "data", "images.gen.ts");

const WIDTHS = [480, 960, 1440];
const WEBP_QUALITY = 72;
const WEBP_EFFORT = 4;
const AVIF_QUALITY = 50;
const AVIF_EFFORT = 3;
const AVIF_MAX_SINGLE_MS = 3000;
const AVIF_BUDGET_MS = 20000;
const BUDGET_BYTES = 4 * 1024 * 1024;
const IMAGE_RE = /\.(jpe?g|png)$/i;
const FORCE = process.argv.includes("--force");

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function statOrNull(target) {
  try {
    return await stat(target);
  } catch {
    return null;
  }
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

async function main() {
  const files = (await readdir(SOURCE_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && IMAGE_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  /** @type {Record<string, { width: number; height: number; variants: { width: number; src: string; bytes: number }[] }>} */
  const manifest = {};

  let originalBytes = 0;
  let variantBytes = 0;
  let variantCount = 0;
  let written = 0;
  let reused = 0;
  let avifEnabled = true;
  let avifCount = 0;
  let avifMs = 0;
  let avifNote = null;

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const srcStat = await stat(srcPath);
    originalBytes += srcStat.size;

    const meta = await sharp(srcPath).metadata();
    const base = path.parse(file).name;
    const widths = WIDTHS.filter((width) => width <= meta.width);
    if (widths.length === 0 && meta.width) widths.push(meta.width);

    /** @type {{ width: number; src: string; bytes: number }[]} */
    const variants = [];

    for (const width of widths) {
      const outPath = path.join(CATALOG_DIR, `${base}-${width}.webp`);
      const publicSrc = `/catalog/${base}-${width}.webp`;
      const existing = FORCE ? null : await statOrNull(outPath);
      const fresh = existing && existing.size > 0 && existing.mtimeMs >= srcStat.mtimeMs;

      let bytes;
      if (fresh) {
        bytes = existing.size;
        reused += 1;
      } else {
        const buf = await sharp(srcPath)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
          .toBuffer();
        await writeFile(outPath, buf);
        bytes = buf.length;
        written += 1;
      }

      variants.push({ width, src: publicSrc, bytes });
      variantBytes += bytes;
      variantCount += 1;
    }

    if (avifEnabled && widths.length > 0) {
      const width = widths[widths.length - 1];
      const outPath = path.join(CATALOG_DIR, `${base}-${width}.avif`);
      const publicSrc = `/catalog/${base}-${width}.avif`;
      const existing = FORCE ? null : await statOrNull(outPath);
      const fresh = existing && existing.size > 0 && existing.mtimeMs >= srcStat.mtimeMs;

      if (fresh) {
        variants.push({ width, src: publicSrc, bytes: existing.size });
        variantBytes += existing.size;
        variantCount += 1;
        reused += 1;
        avifCount += 1;
      } else {
        try {
          const started = Date.now();
          const buf = await sharp(srcPath)
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

          if (elapsed > AVIF_MAX_SINGLE_MS || avifMs > AVIF_BUDGET_MS) {
            avifEnabled = false;
            avifNote = `detenido por lentitud (${elapsed} ms; acumulado ${avifMs} ms)`;
          }
        } catch (error) {
          avifEnabled = false;
          avifNote = `detenido por error (${error.message})`;
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

  await writeFile(GEN_FILE, `${header}\n\n${typeDef} ${JSON.stringify(manifest, null, 2)};\n`);

  const catalogBytes = await walkBytes(CATALOG_DIR);

  const avifStatus =
    avifCount === 0
      ? "no generado"
      : avifEnabled
        ? `activo (${avifCount} ficheros${avifMs > 0 ? `, ${avifMs} ms` : ""})`
        : `parcial (${avifCount} ficheros); ${avifNote}`;

  console.log(`originales: ${files.length} (${mb(originalBytes)})`);
  console.log(
    `variantes: ${variantCount} (webp ${variantCount - avifCount}, avif ${avifCount}; ${written} escritas, ${reused} reutilizadas)`,
  );
  console.log(`bytes de variantes: ${variantBytes} (${mb(variantBytes)})`);
  console.log(`public/catalog tras generar: ${catalogBytes} (${mb(catalogBytes)})`);
  console.log(`AVIF: ${avifStatus}`);
  console.log(
    `objetivo ≤ 4 MB solo variantes: ${variantBytes <= BUDGET_BYTES ? "ALCANZABLE" : "NO alcanzable"} (${mb(variantBytes)})`,
  );
  console.log(`manifiesto: ${path.relative(ROOT, GEN_FILE)}`);
}

main().catch((error) => {
  console.error(`build-images: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
