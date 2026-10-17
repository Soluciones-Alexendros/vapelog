#!/usr/bin/env node
// Escribe public/build-manifest.json con identidad del artefacto (sin secretos).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function gitCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function readCatalogVersions() {
  const types = readFileSync(join(ROOT, "src/data/types.ts"), "utf8");
  const schema = types.match(/SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1];
  const catalog = types.match(/CATALOG_REVISION\s*=\s*"([^"]+)"/)?.[1];
  if (!schema || !catalog) {
    throw new Error("no se pudieron leer SCHEMA_VERSION / CATALOG_REVISION de types.ts");
  }
  return { schemaVersion: schema, catalogRevision: catalog };
}

export function buildManifest(overrides = {}) {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const lock = readFileSync(join(ROOT, "pnpm-lock.yaml"));
  const lockfileSha256 = createHash("sha256").update(lock).digest("hex");
  const { schemaVersion, catalogRevision } = readCatalogVersions();
  const buildId =
    process.env.GITHUB_RUN_ID || process.env.VERCEL_DEPLOYMENT_ID || process.env.BUILD_ID || null;

  return {
    commit: gitCommit(),
    version: pkg.version,
    schemaVersion,
    catalogRevision,
    lockfileSha256,
    buildId,
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function main() {
  const manifest = buildManifest();
  const out = join(ROOT, "public/build-manifest.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`write-build-manifest: ${out}`);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("write-build-manifest.mjs") ||
    process.argv[1].endsWith("/write-build-manifest.mjs"));

if (isMain) main();
