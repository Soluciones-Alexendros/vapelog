#!/usr/bin/env node
/**
 * Espera un deployment Preview de Vercel listo para el SHA dado y escribe la URL.
 * La URL se descubre por la API de deployments de GitHub; el acceso al Preview
 * protegido usa `VERCEL_AUTOMATION_BYPASS_SECRET` cuando está definido.
 *
 * Política:
 * - Solo environment=Preview del SHA pedido (sin fallback a producción).
 * - redirect: manual; 3xx al canónico de producción o a SSO → fallo con código.
 * - Un 3xx al mismo host se sigue una vez; bucle equivalente → fallo.
 * - GET /build-manifest.json debe coincidir con el SHA.
 * - Rate limit / 401 / 403 → exit 1 inmediato.
 *
 * Uso: node scripts/wait-preview-url.mjs <sha> [timeoutSec]
 * Env: GITHUB_REPOSITORY (owner/repo), GH_TOKEN o GITHUB_TOKEN,
 *      VERCEL_AUTOMATION_BYPASS_SECRET (opcional; solo si hay protección)
 */
import { writeFileSync } from "node:fs";

export const PRODUCTION_HOST = "vapelog-alexendros.vercel.app";
const DEFAULT_PROBE_TIMEOUT_MS = 15_000;

/**
 * Cabeceras de Automation Bypass (Deployment Protection / SSO).
 *
 * `setCookie` añade `x-vercel-set-bypass-cookie`, que hace que Vercel responda
 * un 307 para dejar la cookie. En el probe se desactiva: no hay navegador que la
 * necesite y el redirect confundiría la comprobación de estado.
 *
 * @param {Record<string, string | undefined>} [env]
 * @param {{ setCookie?: boolean }} [options]
 */
export function protectionBypassHeaders(env = process.env, { setCookie = true } = {}) {
  const secret = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret || !String(secret).trim()) return {};
  /** @type {Record<string, string>} */
  const headers = { "x-vercel-protection-bypass": String(secret).trim() };
  if (setCookie) headers["x-vercel-set-bypass-cookie"] = "true";
  return headers;
}

/**
 * @param {string} host
 */
export function isVercelSsoHost(host) {
  const h = String(host ?? "").toLowerCase();
  return h === "vercel.com" || h.endsWith(".vercel.com");
}

/**
 * @param {string} url
 */
export function stripUrlForLog(url) {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "[url-inválida]";
  }
}

/**
 * @param {Array<{ state?: string, environment?: string, description?: string, environment_url?: string, target_url?: string, created_at?: string }>} statuses
 * @returns {string | null}
 */
export function pickPreviewUrl(statuses) {
  const success = statuses
    .filter((s) => s.state === "success")
    .slice()
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));

  for (const s of success) {
    const env = String(s.environment ?? "");
    if (!/^preview$/i.test(env) && !/preview/i.test(env)) continue;
    const url = s.environment_url || s.target_url;
    if (!url) continue;
    try {
      const host = new URL(url).host;
      if (host === PRODUCTION_HOST) continue;
      return url.replace(/\/$/, "");
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * @param {string} url
 * @param {string} expectedSha
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
/**
 * GET sin seguir redirects, con timeout propio.
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Response>}
 */
async function fetchManual(url, init, timeoutMs, fetchImpl) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function probePreviewReady(url, expectedSha, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  // Sin `x-vercel-set-bypass-cookie`: el probe solo necesita el bypass, y esa
  // cabecera devuelve un 307 de set-cookie que abortaría la comprobación.
  const bypassHeaders =
    opts.bypassHeaders ?? protectionBypassHeaders(process.env, { setCookie: false });
  // Distingue «no hay secreto configurado» de «el secreto no vale»: el mensaje
  // del primero es una tarea de configuración, el del segundo una rotación.
  const hasBypass = Object.keys(bypassHeaders).length > 0;
  const accessCode = hasBypass ? "BYPASS_INVALID" : "NO_BYPASS_SECRET";
  const accessHint = hasBypass
    ? "El secreto no es válido o fue rotado: actualiza VERCEL_AUTOMATION_BYPASS_SECRET (environment Preview)."
    : "Define VERCEL_AUTOMATION_BYPASS_SECRET en el environment Preview con el valor de " +
      "Vercel → Deployment Protection → Protection Bypass for Automation.";
  const requestInit = {
    method: "GET",
    redirect: /** @type {RequestRedirect} */ ("manual"),
    headers: bypassHeaders,
  };

  let currentUrl = url;
  let probe = await fetchManual(currentUrl, requestInit, timeoutMs, fetchImpl);

  // Un 3xx al mismo host se sigue una sola vez (normalización de Vercel).
  // Cualquier otro destino se clasifica abajo como error fatal.
  if (probe.status >= 300 && probe.status < 400) {
    const location = probe.headers.get("location") ?? "";
    /** @type {URL | null} */
    const parsed = (() => {
      try {
        return new URL(location, currentUrl);
      } catch {
        return null;
      }
    })();
    if (parsed && parsed.host === new URL(currentUrl).host) {
      currentUrl = parsed.toString();
      probe = await fetchManual(currentUrl, requestInit, timeoutMs, fetchImpl);
    }
  }

  if (probe.status === 401 || probe.status === 403) {
    throw Object.assign(
      new Error(
        `[${accessCode}] Preview responde ${probe.status} (Deployment Protection). ${accessHint}`,
      ),
      { fatal: true, code: accessCode },
    );
  }
  if (probe.status >= 300 && probe.status < 400) {
    const location = probe.headers.get("location") ?? "";
    let host;
    try {
      host = new URL(location, currentUrl).host;
    } catch {
      host = location;
    }
    if (isVercelSsoHost(host)) {
      throw Object.assign(
        new Error(`[${accessCode}] Preview redirige a SSO Vercel (${host}). ${accessHint}`),
        { fatal: true, code: accessCode },
      );
    }
    if (host === PRODUCTION_HOST || (host && host !== new URL(currentUrl).host)) {
      throw Object.assign(new Error(`Preview redirige a host no Preview (${host || location}).`), {
        fatal: true,
      });
    }
    throw Object.assign(
      new Error(`Preview redirect ${probe.status} en bucle al mismo host (${currentUrl}).`),
      { fatal: true },
    );
  }
  if (!probe.ok) {
    throw new Error(`Preview HTTP ${probe.status}`);
  }

  const manifestRes = await fetchManual(
    `${currentUrl.replace(/\/$/, "")}/build-manifest.json`,
    requestInit,
    timeoutMs,
    fetchImpl,
  );

  if (manifestRes.status >= 300 && manifestRes.status < 400) {
    throw Object.assign(new Error("build-manifest.json redirige; no se sigue."), {
      fatal: true,
    });
  }
  if (!manifestRes.ok) {
    throw Object.assign(new Error(`build-manifest.json HTTP ${manifestRes.status}`), {
      fatal: manifestRes.status === 404,
    });
  }
  const manifest = await manifestRes.json();
  if (manifest.commit !== expectedSha) {
    throw Object.assign(
      new Error(`manifiesto commit=${manifest.commit} ≠ esperado ${expectedSha}`),
      { fatal: true },
    );
  }
  return url;
}

/**
 * @param {{ check_runs?: Array<{ name?: string, conclusion?: string, output?: { title?: string, summary?: string }, details_url?: string }> }} checks
 * @param {{ statuses?: Array<{ context?: string, description?: string, target_url?: string }> }} combined
 */
export function detectVercelRateLimit(checks, combined) {
  const runs = Array.isArray(checks.check_runs) ? checks.check_runs : [];
  for (const run of runs) {
    const name = String(run.name ?? "");
    if (!/^Vercel$/i.test(name) && !/vercel/i.test(name)) continue;
    const blob = `${run.output?.title ?? ""} ${run.output?.summary ?? ""} ${run.details_url ?? ""}`;
    if (/rate.?limit/i.test(blob) || /upgradeToPro=build-rate-limit/i.test(blob)) {
      return true;
    }
  }
  for (const s of Array.isArray(combined.statuses) ? combined.statuses : []) {
    const blob = `${s.context ?? ""} ${s.description ?? ""} ${s.target_url ?? ""}`;
    if (/vercel/i.test(blob) && /rate.?limit/i.test(blob)) return true;
  }
  return false;
}

/**
 * Errores transitorios de la API de GitHub (reintentar, no exit 1 inmediato).
 * @param {unknown} err
 */
export function isTransientGithubError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /GitHub (408|425|429|5\d\d)\b/.test(msg) ||
    /fetch failed|ECONNRESET|ETIMEDOUT|AbortError/i.test(msg)
  );
}

async function mainCli() {
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

  /**
   * @param {string} path
   */
  async function gh(path) {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub ${res.status} ${path}: ${body.slice(0, 200)}`);
    }
    return res.json();
  }

  const deadline = Date.now() + timeoutSec * 1000;
  let attempt = 0;
  let backoff = 5_000;

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const checks = await gh(
        `/repos/${repo}/commits/${encodeURIComponent(sha)}/check-runs?per_page=40`,
      );
      const combined = await gh(`/repos/${repo}/commits/${encodeURIComponent(sha)}/status`);
      if (detectVercelRateLimit(checks, combined)) {
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

      for (const d of list) {
        const statuses = await gh(`/repos/${repo}/deployments/${d.id}/statuses`);
        const url = pickPreviewUrl(Array.isArray(statuses) ? statuses : []);
        if (!url) continue;
        try {
          await probePreviewReady(url, sha);
          console.log(stripUrlForLog(url));
          writeFileSync("preview-url.txt", `${url}\n`);
          process.exit(0);
        } catch (err) {
          const fatal = err && typeof err === "object" && "fatal" in err && err.fatal;
          console.error(`Intento ${attempt}: ${err instanceof Error ? err.message : err}`);
          if (fatal) process.exit(1);
        }
      }
    } catch (err) {
      if (isTransientGithubError(err)) {
        console.error(
          `Intento ${attempt}: API GitHub transitoria; reintento en ${Math.round(backoff / 1000)}s — ${err instanceof Error ? err.message : err}`,
        );
        await sleep(backoff);
        backoff = Math.min(backoff + 5_000, 30_000);
        continue;
      }
      throw err;
    }

    console.error(
      `Intento ${attempt}: Preview aún no listo; reintento en ${Math.round(backoff / 1000)}s`,
    );
    await sleep(backoff);
    backoff = Math.min(backoff + 5_000, 30_000);
  }

  console.error(`Timeout ${timeoutSec}s esperando Preview para ${sha}`);
  process.exit(1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("wait-preview-url.mjs") ||
    process.argv[1].endsWith("/wait-preview-url.mjs"));

if (isMain) {
  await mainCli();
}
