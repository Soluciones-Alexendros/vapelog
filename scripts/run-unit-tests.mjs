#!/usr/bin/env node
/**
 * Ejecuta unitarios node:test con descubrimiento recursivo (U8-A).
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { childTestEnv, discoverUnitTestFiles, repoRoot } from "./unit-test-contract.mjs";

const root = repoRoot();
const files = discoverUnitTestFiles(root);

if (files.length === 0) {
  console.error("unit-test-contract: no se encontraron archivos de prueba");
  process.exit(2);
}

const args = ["--test", ...files.map((rel) => join(root, rel))];
const result = spawnSync(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: childTestEnv(),
});

process.exit(result.status ?? 1);
