#!/usr/bin/env node
/**
 * Contrato U8: descubrimiento de unitarios y universo de cobertura (src/data + scripts).
 * Node 22+: usa fs.globSync (documentado en la guía de testing).
 */
import { globSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

/** @returns {string} */
export function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

/** Convención node:test recursiva (ver UNIT_TEST_GLOBS). */
export const UNIT_TEST_GLOBS = Object.freeze(["src/data/**/*.test.ts", "scripts/**/*.test.mjs"]);

/** Módulos medibles en el gate de cobertura (sin encoger el universo). */
export const COVERAGE_INCLUDE_GLOBS = Object.freeze(["src/data/**/*.ts", "scripts/**/*.mjs"]);

/**
 * Exclusiones explícitas con motivo en comentario:
 * - *.test.* — archivos de prueba
 * - *.gen.ts — generados (p. ej. images.gen.ts)
 */
export const COVERAGE_EXCLUDE_GLOBS = Object.freeze([
  "**/*.test.ts",
  "**/*.test.mjs",
  "**/*.gen.ts",
]);

/** Umbral contractual de líneas (CI y Makefile). */
export const COVERAGE_LINE_THRESHOLD = 70;

/**
 * Evita que procesos hijos hereden NODE_TEST_CONTEXT (Node 22 omite ficheros).
 * @param {NodeJS.ProcessEnv} [base]
 */
export function childTestEnv(base = process.env) {
  const env = { ...base };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

/**
 * @param {string} relativePath posix, desde la raíz del repo
 */
export function isCoverageExcluded(relativePath) {
  const norm = posix.normalize(relativePath.replaceAll("\\", "/"));
  return norm.endsWith(".test.ts") || norm.endsWith(".test.mjs") || norm.endsWith(".gen.ts");
}

/**
 * @param {string} relativePath
 */
export function isInCoverageUniverse(relativePath) {
  const norm = posix.normalize(relativePath.replaceAll("\\", "/"));
  if (isCoverageExcluded(norm)) return false;
  if (norm.startsWith("src/data/") && norm.endsWith(".ts")) return true;
  if (norm.startsWith("scripts/") && norm.endsWith(".mjs")) return true;
  return false;
}

/**
 * @param {string} [root]
 * @returns {string[]}
 */
export function discoverUnitTestFiles(root = repoRoot()) {
  const found = new Set();
  for (const pattern of UNIT_TEST_GLOBS) {
    for (const rel of globSync(pattern, { cwd: root })) {
      found.add(posix.normalize(rel.replaceAll("\\", "/")));
    }
  }
  return [...found].sort();
}

/**
 * Inventario de fuentes que entran en el universo de cobertura.
 * @param {string} [root]
 * @returns {string[]}
 */
export function listCoverageUniverseFiles(root = repoRoot()) {
  const found = new Set();
  for (const pattern of COVERAGE_INCLUDE_GLOBS) {
    for (const rel of globSync(pattern, { cwd: root })) {
      const norm = posix.normalize(rel.replaceAll("\\", "/"));
      if (isCoverageExcluded(norm)) continue;
      found.add(norm);
    }
  }
  return [...found].sort();
}

/**
 * Normaliza rutas de registro LCOV (SF:) a relativas posix.
 * @param {string} sf
 * @param {string} [root]
 */
export function normalizeLcovPath(sf, root = repoRoot()) {
  let p = sf.replaceAll("\\", "/");
  const rootNorm = root.replaceAll("\\", "/").replace(/\/$/, "");
  if (p.startsWith(rootNorm + "/")) {
    p = p.slice(rootNorm.length + 1);
  } else if (p.startsWith(rootNorm)) {
    p = p.slice(rootNorm.length).replace(/^\//, "");
  }
  return posix.normalize(p);
}
