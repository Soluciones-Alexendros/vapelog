#!/usr/bin/env node
// Compara un manifiesto con SHA, versión y hash de lockfile esperados.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {object} manifest
 * @param {{ commit?: string, version?: string, lockfileSha256?: string }} expected
 * @returns {{ ok: boolean, mismatches: string[] }}
 */
export function checkManifest(manifest, expected) {
  const mismatches = [];
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, mismatches: ["manifiesto ausente o inválido"] };
  }
  for (const key of ["commit", "version", "lockfileSha256"]) {
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
  const commit =
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.EXPECTED_COMMIT ||
    null;
  return {
    version: pkg.version,
    lockfileSha256,
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
