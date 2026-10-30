#!/usr/bin/env node
/**
 * Comprueba identidad pública postdeploy (manifiesto vs SHA esperado).
 * Uso: POSTDEPLOY_URL=https://… EXPECTED_COMMIT=sha node scripts/postdeploy-check.mjs
 *
 * No sigue redirecciones automáticamente: un 3xx hacia el canónico de
 * producción (u otro host) es fallo. Timeout por petición configurable.
 */
import { validateManifestStructure } from "./check-manifest.mjs";

export const PRODUCTION_HOST = "vapelog-alexendros.vercel.app";

/**
 * @param {string} url
 */
export function safeUrlForLog(url) {
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
 * @param {{
 *   base: string,
 *   expected: string,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 * }} opts
 * @returns {Promise<{ ok: true, commit: string, version: string, catalogRevision: string, url: string }>}
 */
export async function checkPostdeploy(opts) {
  const base = opts.base.replace(/\/$/, "");
  const expected = opts.expected;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const manifestUrl = `${base}/build-manifest.json`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  /** @type {Response} */
  let response;
  try {
    response = await fetchImpl(manifestUrl, {
      redirect: "manual",
      method: "GET",
      signal: ac.signal,
    });
  } catch (err) {
    throw new Error(
      `postdeploy: fetch falló (${safeUrlForLog(manifestUrl)}): ${err instanceof Error ? err.message : err}`,
      { cause: err },
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") ?? "";
    let host;
    try {
      host = new URL(location, base).host;
    } catch {
      host = location;
    }
    if (host === PRODUCTION_HOST || (host && host !== new URL(base).host)) {
      throw new Error(
        `postdeploy: redirect ${response.status} a host no Preview (${host || location})`,
      );
    }
    throw new Error(`postdeploy: redirect inesperado ${response.status} → ${location}`);
  }

  if (!response.ok) {
    throw new Error(`Manifiesto no disponible: ${response.status} ${safeUrlForLog(manifestUrl)}`);
  }

  const manifest = await response.json();
  const structure = validateManifestStructure(manifest);
  if (!structure.ok) {
    throw new Error(
      `postdeploy: manifiesto estructuralmente inválido: ${structure.mismatches.join("; ")}`,
    );
  }

  if (manifest.commit !== expected) {
    throw new Error(`SHA desplegado ${manifest.commit} ≠ esperado ${expected}`);
  }

  return {
    ok: true,
    url: safeUrlForLog(manifestUrl),
    commit: manifest.commit,
    version: manifest.version,
    catalogRevision: manifest.catalogRevision,
  };
}

async function main() {
  const base = process.env.POSTDEPLOY_URL?.replace(/\/$/, "");
  const expected = process.env.EXPECTED_COMMIT;
  if (!base || !expected) {
    console.error("Requiere POSTDEPLOY_URL y EXPECTED_COMMIT");
    process.exit(2);
  }
  try {
    const result = await checkPostdeploy({
      base,
      expected,
      timeoutMs: Number(process.env.POSTDEPLOY_TIMEOUT_MS ?? 15_000),
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("postdeploy-check.mjs") ||
    process.argv[1].endsWith("/postdeploy-check.mjs"));

if (isMain) {
  await main();
}
