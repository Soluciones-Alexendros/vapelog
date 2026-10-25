#!/usr/bin/env node
/**
 * Espera un deployment Preview de Vercel listo para el SHA dado y escribe la URL.
 * Usa la API de deployments de GitHub (sin secretos de Vercel).
 *
 * Uso: node scripts/wait-preview-url.mjs <sha> [timeoutSec]
 * Env: GITHUB_REPOSITORY (owner/repo), GH_TOKEN o GITHUB_TOKEN
 */
import { writeFileSync } from "node:fs";

const sha = process.argv[2];
const timeoutSec = Number(process.argv[3] ?? 900);
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!sha || !repo || !token) {
  console.error(
    "Uso: GITHUB_REPOSITORY=o/r GH_TOKEN=… node scripts/wait-preview-url.mjs <sha> [timeoutSec]",
  );
  process.exit(2);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function pickPreviewUrl(statuses) {
  for (const s of statuses) {
    if (s.state !== "success") continue;
    const env = String(s.environment ?? "").toLowerCase();
    const desc = String(s.description ?? "").toLowerCase();
    const url = s.environment_url || s.target_url;
    if (!url) continue;
    if (env.includes("preview") || desc.includes("preview") || /vercel\.app/i.test(url)) {
      return url.replace(/\/$/, "");
    }
  }
  for (const s of statuses) {
    if (s.state === "success" && (s.environment_url || s.target_url)) {
      const url = s.environment_url || s.target_url;
      if (/vercel\.app/i.test(url)) return url.replace(/\/$/, "");
    }
  }
  return null;
}

/** Detecta el check/status de Vercel en rate limit para no quemar el timeout. */
async function vercelRateLimited() {
  const checks = await gh(
    `/repos/${repo}/commits/${encodeURIComponent(sha)}/check-runs?per_page=40`,
  );
  const runs = Array.isArray(checks.check_runs) ? checks.check_runs : [];
  for (const run of runs) {
    const name = String(run.name ?? "");
    if (!/^Vercel$/i.test(name) && !/vercel/i.test(name)) continue;
    const blob = `${run.output?.title ?? ""} ${run.output?.summary ?? ""} ${run.details_url ?? ""}`;
    if (/rate.?limit/i.test(blob) || /upgradeToPro=build-rate-limit/i.test(blob)) {
      return true;
    }
    if (run.conclusion === "failure" && /rate.?limit/i.test(String(run.details_url ?? ""))) {
      return true;
    }
  }
  const combined = await gh(`/repos/${repo}/commits/${encodeURIComponent(sha)}/status`);
  for (const s of Array.isArray(combined.statuses) ? combined.statuses : []) {
    const blob = `${s.context ?? ""} ${s.description ?? ""} ${s.target_url ?? ""}`;
    if (/vercel/i.test(blob) && /rate.?limit/i.test(blob)) return true;
  }
  return false;
}

const deadline = Date.now() + timeoutSec * 1000;
let attempt = 0;
let backoff = 5_000;

while (Date.now() < deadline) {
  attempt += 1;
  if (await vercelRateLimited()) {
    console.error(
      "Vercel Preview en rate limit (p. ej. upgradeToPro=build-rate-limit). " +
        "No hay deployment que esperar; re-run cuando el límite caduque.",
    );
    process.exit(1);
  }
  const deployments = await gh(
    `/repos/${repo}/deployments?sha=${encodeURIComponent(sha)}&per_page=20&environment=Preview`,
  );
  const list = Array.isArray(deployments) ? deployments : [];
  // Fallback: cualquier deployment del SHA si no hay environment=Preview
  const candidates =
    list.length > 0
      ? list
      : await gh(`/repos/${repo}/deployments?sha=${encodeURIComponent(sha)}&per_page=20`);

  for (const d of candidates) {
    const statuses = await gh(`/repos/${repo}/deployments/${d.id}/statuses`);
    const url = pickPreviewUrl(Array.isArray(statuses) ? statuses : []);
    if (url) {
      // Comprueba HTTP 200 antes de declarar listo.
      try {
        const probe = await fetch(url, { method: "GET", redirect: "follow" });
        if (probe.status === 401 || probe.status === 403) {
          console.error(`Preview responde ${probe.status} (protección Vercel).`);
          process.exit(1);
        }
        if (probe.ok) {
          console.log(url);
          writeFileSync("preview-url.txt", `${url}\n`);
          process.exit(0);
        }
      } catch (err) {
        console.error(
          `Intento ${attempt}: probe falló: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  console.error(
    `Intento ${attempt}: Preview aún no listo; reintento en ${Math.round(backoff / 1000)}s`,
  );
  await sleep(backoff);
  backoff = Math.min(backoff + 5_000, 30_000);
}

console.error(`Timeout ${timeoutSec}s esperando Preview para ${sha}`);
process.exit(1);
