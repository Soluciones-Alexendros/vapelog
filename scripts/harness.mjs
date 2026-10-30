#!/usr/bin/env node
/**
 * Fachada de validación reutilizable (agente, persona, CI).
 * Perfiles: local | full | deployed | operator
 *
 * Cada tramo: passed | failed | blocked | not_applicable + causa.
 * Exit 1 si hay failed; exit 2 si hay blocked en un perfil que lo exige.
 * `make validate` ≠ CI completa: el perfil local lo deja explícito.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @typedef {'passed' | 'failed' | 'blocked' | 'not_applicable'} Status
 * @typedef {{ id: string, status: Status, cause: string, evidence?: string }} Result
 */

/**
 * @param {string} id
 * @param {string} command
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Result}
 */
function runStep(id, command, args, env = process.env) {
  const r = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env,
    shell: false,
  });
  const evidence = `${command} ${args.join(" ")} → exit ${r.status ?? "null"}`;
  if (r.status === 0) {
    return { id, status: "passed", cause: "ok", evidence };
  }
  const tail = `${r.stderr || ""}${r.stdout || ""}`.trim().slice(-500);
  return {
    id,
    status: "failed",
    cause: tail || `comando falló con código ${r.status}`,
    evidence,
  };
}

/**
 * @param {string} profile
 * @returns {Result[]}
 */
export function runHarness(profile) {
  /** @type {Result[]} */
  const results = [];

  if (profile === "operator") {
    return [
      {
        id: "ruleset",
        status: "not_applicable",
        cause: "Reservado al operador: confirmar required check release-ready y método de merge",
      },
      {
        id: "rollback",
        status: "not_applicable",
        cause: "Reservado al operador: Instant Rollback o git revert + test:postdeploy",
      },
      {
        id: "aceptacion-humana",
        status: "not_applicable",
        cause: "Reservado al operador: firmar docs/cierre/expediente-aceptacion.md",
      },
      {
        id: "preview-rate-limit",
        status: "not_applicable",
        cause: "Reservado al operador: re-run preview-e2e cuando Vercel acepte deploys",
      },
    ];
  }

  if (profile === "local" || profile === "full" || profile === "deployed") {
    results.push({
      id: "scope-note",
      status: "passed",
      cause:
        profile === "local"
          ? "Perfil local = make validate (lint+coverage+build+smoke); no equivale a toda la CI"
          : `Perfil ${profile}`,
    });
  }

  if (profile === "local" || profile === "full") {
    results.push(runStep("lint", "make", ["lint"]));
    results.push(runStep("test", "make", ["test"]));
    results.push(runStep("build", "make", ["build"]));
    results.push(runStep("smoke", "make", ["smoke"]));
  }

  if (profile === "full") {
    results.push(runStep("supply-chain", "pnpm", ["run", "check:supply-chain"]));
    results.push(runStep("a11y", "pnpm", ["run", "a11y"]));
    results.push(runStep("e2e", "pnpm", ["run", "test:e2e"]));
    if (!process.env.DATABASE_URL) {
      results.push({
        id: "sql-integration",
        status: "blocked",
        cause: "DATABASE_URL ausente; el job sql-integration de CI sí lo provee",
      });
    } else {
      results.push(
        runStep("sql-integration", "pnpm", ["run", "test:sql"], {
          ...process.env,
          SQL_INTEGRATION: "1",
        }),
      );
    }
  }

  if (profile === "deployed") {
    if (!process.env.POSTDEPLOY_URL || !process.env.EXPECTED_COMMIT) {
      results.push({
        id: "postdeploy",
        status: "blocked",
        cause: "Requiere POSTDEPLOY_URL y EXPECTED_COMMIT",
      });
    } else {
      results.push(runStep("postdeploy", "pnpm", ["run", "test:postdeploy"]));
    }
  }

  if (!["local", "full", "deployed", "operator"].includes(profile)) {
    results.push({
      id: "profile",
      status: "failed",
      cause: `perfil desconocido: ${profile} (local|full|deployed|operator)`,
    });
  }

  return results;
}

/**
 * @param {Result[]} results
 * @param {string} profile
 */
export function exitCodeFor(results, profile) {
  if (results.some((r) => r.status === "failed")) return 1;
  if (
    (profile === "full" || profile === "deployed") &&
    results.some((r) => r.status === "blocked")
  ) {
    return 2;
  }
  return 0;
}

function main() {
  const profile = process.argv[2] || "local";
  const results = runHarness(profile);
  for (const r of results) {
    console.log(
      JSON.stringify({
        profile,
        id: r.id,
        status: r.status,
        cause: r.cause,
        evidence: r.evidence ?? null,
      }),
    );
  }
  const code = exitCodeFor(results, profile);
  console.log(JSON.stringify({ profile, summary: { exit: code, count: results.length } }));
  process.exit(code);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("harness.mjs") || process.argv[1].endsWith("/harness.mjs"));

if (isMain) main();
