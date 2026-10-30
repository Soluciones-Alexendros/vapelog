#!/usr/bin/env node
// Agregador del gate de publicación: solo pasa si el JSON trae exactamente
// las dependencias obligatorias y cada una está en `success`.
// skipped / cancelled / failure (u otro) fallan el gate.
// Conjunto vacío, arrays o claves de más/menos → gate rojo.
import { readFileSync } from "node:fs";

/**
 * Lista única del contrato. El job `release-ready` de ci.yml debe declarar
 * el mismo `needs`; el test de paridad lo comprueba.
 * @type {readonly string[]}
 */
export const REQUIRED_JOBS = Object.freeze([
  "quality",
  "test",
  "build",
  "smoke",
  "browser",
  "fx-e2e",
  "supply-chain",
  "sql-integration",
]);

/**
 * @param {unknown} needs
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function evaluateReleaseReady(needs) {
  const failures = [];
  if (needs == null || typeof needs !== "object" || Array.isArray(needs)) {
    return { ok: false, failures: ["needs ausente o inválido"] };
  }

  /** @type {Record<string, { result?: string } | null | undefined>} */
  const record = needs;
  const keys = Object.keys(record);

  if (keys.length === 0) {
    failures.push("needs vacío: faltan dependencias obligatorias");
  }

  for (const name of REQUIRED_JOBS) {
    if (!(name in record)) {
      failures.push(`${name}: ausente`);
      continue;
    }
    const result = record[name]?.result;
    if (result !== "success") {
      failures.push(`${name}: ${result ?? "undefined"}`);
    }
  }

  for (const name of keys) {
    if (!REQUIRED_JOBS.includes(name)) {
      failures.push(`${name}: no está en el contrato`);
    }
  }

  return { ok: failures.length === 0, failures };
}

/**
 * Extrae el array `needs` del job `release-ready` en ci.yml (texto).
 * @param {string} yaml
 * @returns {string[] | null}
 */
export function parseReleaseReadyNeedsFromCi(yaml) {
  const lines = yaml.split(/\r?\n/);
  let inJob = false;
  for (const line of lines) {
    if (/^ {2}release-ready:\s*$/.test(line)) {
      inJob = true;
      continue;
    }
    if (inJob && /^ {2}[A-Za-z0-9_-]+:\s*$/.test(line)) {
      break;
    }
    if (!inJob) continue;
    const m = line.match(/^\s+needs:\s*\[([^\]]*)\]\s*$/);
    if (m) {
      return m[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return null;
}

function main() {
  const arg = process.argv[2];
  // CI escribe needs en un fichero y pasa la ruta; "-" o sin arg → stdin.
  let raw;
  try {
    raw = !arg || arg === "-" ? readFileSync(0, "utf8") : readFileSync(arg, "utf8");
  } catch (err) {
    console.error(
      `release-ready: no se pudo leer entrada: ${err instanceof Error ? err.message : err}`,
    );
    process.exit(2);
  }
  let needs;
  try {
    needs = JSON.parse(raw);
  } catch (err) {
    console.error(`release-ready: JSON inválido: ${err instanceof Error ? err.message : err}`);
    process.exit(2);
  }
  const { ok, failures } = evaluateReleaseReady(needs);
  if (!ok) {
    console.error("release-ready: gate rojo");
    for (const line of failures) console.error(`  - ${line}`);
    process.exit(1);
  }
  console.log("release-ready: OK");
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("release-ready.mjs") || process.argv[1].endsWith("/release-ready.mjs"));

if (isMain) main();
