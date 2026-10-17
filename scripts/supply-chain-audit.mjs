#!/usr/bin/env node
// Evalúa rangos vulnerables conocidos contra un texto de lockfile (VAL-005-01).
// No instala las versiones afectadas; solo analiza el texto.
import { readFileSync } from "node:fs";

/**
 * Advisory GHSA-qx66-fv34-fjm8 (TanStack Start XSS en respuestas de server functions).
 * Rangos oficiales consultados en la API de advisories de GitHub.
 */
export const GHSA_QX66_RANGES = [
  {
    id: "GHSA-qx66-fv34-fjm8",
    package: "@tanstack/start-server-core",
    vulnerableFrom: "1.143.12",
    vulnerableToExclusive: "1.169.39",
    patched: "1.169.39",
  },
  {
    id: "GHSA-qx66-fv34-fjm8",
    package: "@tanstack/react-start",
    vulnerableFrom: "1.143.12",
    vulnerableToExclusive: "1.168.60",
    patched: "1.168.60",
  },
];

/**
 * Comparación semver simple (major.minor.patch); sufijos se ignoran.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function cmpSemver(a, b) {
  const pa = String(a)
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);
  const pb = String(b)
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * @param {string} version
 * @param {{ vulnerableFrom: string, vulnerableToExclusive: string }} range
 */
export function isInVulnerableRange(version, range) {
  return (
    cmpSemver(version, range.vulnerableFrom) >= 0 &&
    cmpSemver(version, range.vulnerableToExclusive) < 0
  );
}

/**
 * Extrae versiones resueltas de un paquete en un lockfile pnpm (texto).
 * @param {string} lockfileText
 * @param {string} packageName
 * @returns {string[]}
 */
export function resolvedVersions(lockfileText, packageName) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versions = new Set();
  const keyRe = new RegExp(`['"]?${escaped}@([^'"\\s:]+)`, "g");
  let m;
  while ((m = keyRe.exec(lockfileText))) {
    const v = m[1].split("(")[0];
    if (/^\d+\.\d+/.test(v)) versions.add(v);
  }
  const importersRe = new RegExp(
    `${escaped}:\\s*\\n\\s+specifier:[^\\n]+\\n\\s+version:\\s*([^\\n]+)`,
    "g",
  );
  while ((m = importersRe.exec(lockfileText))) {
    const v = m[1].trim().split("(")[0];
    if (/^\d+\.\d+/.test(v)) versions.add(v);
  }
  return [...versions];
}

/**
 * @param {string} lockfileText
 * @param {typeof GHSA_QX66_RANGES} [ranges]
 * @returns {{ ok: boolean, hits: Array<{ package: string, version: string, id: string }> }}
 */
export function evaluateLockfileAdvisories(lockfileText, ranges = GHSA_QX66_RANGES) {
  const hits = [];
  for (const range of ranges) {
    for (const version of resolvedVersions(lockfileText, range.package)) {
      if (isInVulnerableRange(version, range)) {
        hits.push({ package: range.package, version, id: range.id });
      }
    }
  }
  return { ok: hits.length === 0, hits };
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("supply-chain-audit.mjs") ||
    process.argv[1].endsWith("/supply-chain-audit.mjs"));

if (isMain) {
  const path = process.argv[2] || "pnpm-lock.yaml";
  const text = readFileSync(path, "utf8");
  const { ok, hits } = evaluateLockfileAdvisories(text);
  if (!ok) {
    console.error("supply-chain-audit: rangos vulnerables detectados");
    for (const h of hits) console.error(`  - ${h.id} ${h.package}@${h.version}`);
    process.exit(1);
  }
  console.log("supply-chain-audit: sin rangos GHSA-qx66 en el lockfile");
}
