import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  utimesSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  BUDGET_BYTES,
  buildCatalogImages,
  buildConfigFingerprint,
  findBaseNameCollisions,
  parseBuildImagesArgs,
  pruneObsoleteVariants,
  variantFreshByFingerprint,
  variantFreshByMtime,
} from "./build-images.mjs";

const MINI_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * @param {{ width?: number; sources?: { name: string; body: Buffer }[]; orphanVariants?: string[] }} opts
 */
function makeImageWorkspace({ width = 600, sources, orphanVariants = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "build-images-"));
  const sourceDir = join(root, "assets", "catalog");
  const catalogDir = join(root, "out", "catalog");
  const genFile = join(root, "src", "data", "images.gen.ts");
  mkdirSync(sourceDir, { recursive: true });
  mkdirSync(catalogDir, { recursive: true });
  mkdirSync(join(root, "src", "data"), { recursive: true });

  const defaultSources = sources ?? [{ name: "sample.png", body: MINI_PNG }];
  for (const { name, body } of defaultSources) {
    writeFileSync(join(sourceDir, name), body);
  }

  for (const orphan of orphanVariants) {
    writeFileSync(join(catalogDir, orphan), Buffer.from([0x00]));
  }

  return { root, sourceDir, catalogDir, genFile, width };
}

async function writeSizedPng(sourceDir, name, width, background = "#336699") {
  const buf = await sharp({
    create: { width, height: Math.max(1, Math.round(width / 2)), channels: 3, background },
  })
    .png()
    .toBuffer();
  writeFileSync(join(sourceDir, name), buf);
}

test("parseBuildImagesArgs reconoce --force y --canonical", () => {
  assert.deepEqual(parseBuildImagesArgs(["node", "build-images.mjs"]), {
    force: false,
    canonical: false,
  });
  assert.deepEqual(parseBuildImagesArgs(["node", "x", "--force", "--canonical"]), {
    force: true,
    canonical: true,
  });
});

test("findBaseNameCollisions detecta foo.jpg y foo.png", () => {
  const hits = findBaseNameCollisions(["a.png", "foo.jpg", "foo.png", "b.jpeg"]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].base, "foo");
  assert.deepEqual(hits[0].files, ["foo.jpg", "foo.png"]);
});

test("variantFreshByMtime y variantFreshByFingerprint", () => {
  const srcStat = { mtimeMs: 1000, size: 10 };
  assert.equal(variantFreshByMtime({ size: 5, mtimeMs: 1500 }, srcStat), true);
  assert.equal(variantFreshByMtime({ size: 5, mtimeMs: 500 }, srcStat), false);
  const configSha = buildConfigFingerprint();
  assert.equal(
    variantFreshByFingerprint(
      { size: 1 },
      { sourceSha256: "abc", configSha256: configSha },
      "abc",
      configSha,
    ),
    true,
  );
  assert.equal(
    variantFreshByFingerprint(
      { size: 1 },
      { sourceSha256: "old", configSha256: configSha },
      "abc",
      configSha,
    ),
    false,
  );
});

test("buildCatalogImages: directorio de origen ausente", async () => {
  const root = mkdtempSync(join(tmpdir(), "build-images-missing-"));
  await assert.rejects(
    () =>
      buildCatalogImages({
        root,
        sourceDir: join(root, "no-catalog"),
        catalogDir: join(root, "out"),
        genFile: join(root, "images.gen.ts"),
        logger: { log() {} },
      }),
    (err) => {
      assert.equal(err.code, "MISSING_SOURCE_DIR");
      return true;
    },
  );
  rmSync(root, { recursive: true, force: true });
});

test("buildCatalogImages: colisión de nombre base", async () => {
  const { root, sourceDir, catalogDir, genFile } = makeImageWorkspace({
    sources: [
      { name: "dup.jpg", body: MINI_PNG },
      { name: "dup.png", body: MINI_PNG },
    ],
  });
  await assert.rejects(
    () => buildCatalogImages({ root, sourceDir, catalogDir, genFile, logger: { log() {} } }),
    (err) => {
      assert.equal(err.code, "BASE_NAME_COLLISION");
      return true;
    },
  );
  rmSync(root, { recursive: true, force: true });
});

test("buildCatalogImages: elimina variante obsoleta sin original", async () => {
  const { root, sourceDir, catalogDir, genFile } = makeImageWorkspace({
    orphanVariants: ["gone-480.webp", "gone-960.avif"],
  });
  await writeSizedPng(sourceDir, "keep.png", 520);
  const result = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });
  assert.deepEqual(result.stats.pruned, ["gone-480.webp", "gone-960.avif"]);
  assert.equal(existsSync(join(catalogDir, "gone-480.webp")), false);
  assert.equal(existsSync(join(catalogDir, "gone-960.avif")), false);
  rmSync(root, { recursive: true, force: true });
});

test("pruneObsoleteVariants deja intactas las esperadas", async () => {
  const root = mkdtempSync(join(tmpdir(), "build-images-prune-"));
  const catalogDir = join(root, "catalog");
  mkdirSync(catalogDir, { recursive: true });
  writeFileSync(join(catalogDir, "keep-480.webp"), Buffer.alloc(3));
  writeFileSync(join(catalogDir, "stale-1440.webp"), Buffer.alloc(3));
  const { removed } = await pruneObsoleteVariants(catalogDir, new Set(["keep-480.webp"]));
  assert.deepEqual(removed, ["stale-1440.webp"]);
  rmSync(root, { recursive: true, force: true });
});

test("modo canónico: mismas entradas producen el mismo manifiesto", async () => {
  const { root, sourceDir, catalogDir, genFile } = makeImageWorkspace();
  await writeSizedPng(sourceDir, "sample.png", 520);

  const a = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });
  const b = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });

  assert.equal(a.manifestBody, b.manifestBody);
  assert.deepEqual(a.manifest, b.manifest);
  assert.equal(a.stats.variantCount, b.stats.variantCount);
  assert.equal(b.stats.reused, a.stats.variantCount);
  rmSync(root, { recursive: true, force: true });
});

test("modo canónico: huella vence al mtime (contenido cambiado regenera)", async () => {
  const { root, sourceDir, catalogDir, genFile } = makeImageWorkspace();
  await writeSizedPng(sourceDir, "sample.png", 520);

  const first = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });
  const webpPath = join(catalogDir, "sample-480.webp");
  const oldBytes = readFileSync(webpPath);
  const past = new Date(0);
  utimesSync(webpPath, past, past);
  assert.equal(first.stats.written > 0, true);

  await writeSizedPng(sourceDir, "sample.png", 640, "#e04b2b");

  const second = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });
  const newBytes = readFileSync(webpPath);
  assert.ok(second.stats.written > 0, "debe regenerar tras cambiar el contenido del original");
  assert.notEqual(Buffer.compare(oldBytes, newBytes), 0);
  rmSync(root, { recursive: true, force: true });
});

test("presupuesto 4 MB se registra sin ser gate bloqueante", async () => {
  const { root, sourceDir, catalogDir, genFile } = makeImageWorkspace();
  await writeSizedPng(sourceDir, "sample.png", 520);

  const result = await buildCatalogImages({
    root,
    sourceDir,
    catalogDir,
    genFile,
    canonical: true,
    logger: { log() {} },
  });

  assert.equal(result.stats.budgetBlocking, false);
  assert.equal(result.stats.budgetBytes, BUDGET_BYTES);
  assert.equal(typeof result.stats.withinBudget, "boolean");
  rmSync(root, { recursive: true, force: true });
});
