#!/usr/bin/env node
// Compara un manifiesto con SHA, versión, esquema, revisión y hash de lockfile.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {readonly string[]} */
export const MANIFEST_REQUIRED_KEYS = Object.freeze([
  "commit",
  "version",
  "schemaVersion",
  "catalogRevision",
  "lockfileSha256",
]);

/**
 * @param {unknown} manifest
 * @returns {{ ok: boolean, mismatches: string[] }}
 */
export function validateManifestStructure(manifest) {
  const mismatches = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, mismatches: ["manifiesto ausente o inválido"] };
  }
  /** @type {Record<string, unknown>} */
  const record = manifest;
  for (const key of MANIFEST_REQUIRED_KEYS) {
    if (record[key] == null || record[key] === "") {
      mismatches.push(`${key}: ausente`);
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

/**
 * @param {object} manifest
 * @param {{
 *   commit?: string,
 *   version?: string,
 *   lockfileSha256?: string,
 *   schemaVersion?: string,
 *   catalogRevision?: string,
 * }} expected
 * @returns {{ ok: boolean, mismatches: string[] }}
 */
export function checkManifest(manifest, expected) {
  const structure = validateManifestStructure(manifest);
  if (!structure.ok) return structure;

  const mismatches = [];
  for (const key of ["commit", "version", "lockfileSha256", "schemaVersion", "catalogRevision"]) {
    if (expected[key] != null && manifest[key] !== expected[key]) {
      mismatches.push(`${key}: esperado ${expected[key]}, obtenido ${manifest[key]}`);
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

export function expectedFromRepo(root = ROOT) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const lock = readFileSync(join(root, "pnpm-lock.yaml"));
  const lockfileSha256 = createHash("sha256").update(lock).digest("hex");
  const types = readFileSync(join(root, "src/data/types.ts"), "utf8");
  const schemaVersion = types.match(/SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1];
  const catalogRevision = types.match(/CATALOG_REVISION\s*=\s*"([^"]+)"/)?.[1];
  const commit =
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.EXPECTED_COMMIT ||
    null;
  return {
    version: pkg.version,
    lockfileSha256,
    ...(schemaVersion ? { schemaVersion } : {}),
    ...(catalogRevision ? { catalogRevision } : {}),
    ...(commit ? { commit } : {}),
  };
}

function main() {
  const path = process.argv[2] || join(ROOT, "public/build-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(
      `check-manifest: no se pudo leer ${path}: ${err instanceof Error ? err.message : err}`,
    );
    process.exit(2);
  }
  const expected = expectedFromRepo();
  const { ok, mismatches } = checkManifest(manifest, expected);
  if (!ok) {
    console.error("check-manifest: discrepancia");
    for (const line of mismatches) console.error(`  - ${line}`);
    process.exit(1);
  }
  console.log("check-manifest: OK");
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("check-manifest.mjs") ||
    process.argv[1].endsWith("/check-manifest.mjs"));

if (isMain) main();
