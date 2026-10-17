#!/usr/bin/env node
/**
 * Comprueba identidad pública postdeploy (manifiesto vs SHA esperado).
 * Uso: POSTDEPLOY_URL=https://… EXPECTED_COMMIT=sha node scripts/postdeploy-check.mjs
 */
import assert from "node:assert/strict";

const base = process.env.POSTDEPLOY_URL?.replace(/\/$/, "");
const expected = process.env.EXPECTED_COMMIT;

if (!base || !expected) {
  console.error("Requiere POSTDEPLOY_URL y EXPECTED_COMMIT");
  process.exit(2);
}

const manifestUrl = `${base}/build-manifest.json`;
const response = await fetch(manifestUrl, { redirect: "follow" });
if (!response.ok) {
  console.error(`Manifiesto no disponible: ${response.status} ${manifestUrl}`);
  process.exit(1);
}

const manifest = await response.json();
assert.equal(manifest.commit, expected, `SHA desplegado ${manifest.commit} ≠ esperado ${expected}`);
console.log(
  JSON.stringify(
    {
      ok: true,
      url: manifestUrl,
      commit: manifest.commit,
      version: manifest.version,
      catalogRevision: manifest.catalogRevision,
    },
    null,
    2,
  ),
);
