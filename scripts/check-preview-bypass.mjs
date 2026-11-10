#!/usr/bin/env node
/**
 * Decide si `preview-e2e` puede ejecutar Playwright contra un Preview protegido
 * por Deployment Protection (SSO de Vercel).
 *
 * Contrato:
 * - `ok`      → hay `VERCEL_AUTOMATION_BYPASS_SECRET`; el job continúa.
 * - `skipped` → sin secreto y sin obligación (PR de fork, o flag apagado).
 *               El job termina en verde, avisa y NO finge cobertura de Preview.
 * - `error`   → sin secreto con `VERCEL_PREVIEW_BYPASS_ENABLED=true` en un PR
 *               del propio repo: fallo de configuración, no skip silencioso.
 *
 * Env: VERCEL_AUTOMATION_BYPASS_SECRET, VERCEL_PREVIEW_BYPASS_ENABLED,
 *      PREVIEW_IS_FORK, GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";

const DOC = "docs/runbooks/vap-22-preview-merge-y-aceptacion-u-ops.md";

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ state: "ok" | "skipped" | "error", code: string, message: string }}
 */
export function bypassStatus(env = process.env) {
  const secret = String(env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "").trim();
  const required = String(env.VERCEL_PREVIEW_BYPASS_ENABLED ?? "").trim() === "true";
  const isFork = String(env.PREVIEW_IS_FORK ?? "").trim() === "true";

  if (secret) {
    return {
      state: "ok",
      code: "BYPASS_PRESENT",
      message: "Automation Bypass presente; preview-e2e ejecuta Playwright contra el Preview.",
    };
  }

  // Vercel no crea Preview para forks (gitForkProtection), así que no hay nada
  // que verificar ni secreto que inyectar.
  if (isFork) {
    return {
      state: "skipped",
      code: "FORK_WITHOUT_SECRET",
      message: "PR de fork: sin Preview de Vercel y sin secreto; preview-e2e se omite.",
    };
  }

  if (required) {
    return {
      state: "error",
      code: "NO_BYPASS_SECRET",
      message:
        "Falta VERCEL_AUTOMATION_BYPASS_SECRET en el environment Preview. " +
        "Créalo en Vercel → Settings → Deployment Protection → Protection Bypass for Automation " +
        "y guárdalo con `gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --env Preview`. " +
        `Ver ${DOC}.`,
    };
  }

  return {
    state: "skipped",
    code: "BYPASS_DISABLED",
    message:
      "Sin VERCEL_AUTOMATION_BYPASS_SECRET y VERCEL_PREVIEW_BYPASS_ENABLED≠true: " +
      `preview-e2e se omite. Ver ${DOC}.`,
  };
}

function mainCli() {
  const status = bypassStatus();
  const output = process.env.GITHUB_OUTPUT;

  if (status.state === "ok") {
    console.log(status.message);
  } else if (status.state === "skipped") {
    console.log(`::warning title=preview-e2e omitido::${status.message}`);
  } else {
    console.log(`::error title=preview-e2e sin bypass::${status.message}`);
  }

  if (output) {
    appendFileSync(output, `state=${status.state}\ncode=${status.code}\n`);
  }

  process.exit(status.state === "error" ? 1 : 0);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("check-preview-bypass.mjs") ||
    process.argv[1].endsWith("/check-preview-bypass.mjs"));

if (isMain) mainCli();
