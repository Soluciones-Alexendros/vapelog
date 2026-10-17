#!/usr/bin/env node
// Agregador puro del gate de publicación: solo pasa si cada dependencia
// está en `success`. skipped / cancelled / failure (u otro) fallan el gate.
import { readFileSync } from "node:fs";

/**
 * @param {Record<string, { result?: string } | null | undefined>} needs
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function evaluateReleaseReady(needs) {
  const failures = [];
  if (!needs || typeof needs !== "object") {
    return { ok: false, failures: ["needs ausente o inválido"] };
  }
  for (const [name, job] of Object.entries(needs)) {
    const result = job?.result;
    if (result !== "success") {
      failures.push(`${name}: ${result ?? "undefined"}`);
    }
  }
  return { ok: failures.length === 0, failures };
}

function main() {
  const arg = process.argv[2];
  const raw = arg && arg !== "-" ? arg : readFileSync(0, "utf8");
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
