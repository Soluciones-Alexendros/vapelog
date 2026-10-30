import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkPostdeploy, PRODUCTION_HOST } from "./postdeploy-check.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "postdeploy-check.mjs");

const goodManifest = {
  commit: "abc123deadbeef",
  version: "0.13.0",
  schemaVersion: "1.4.0",
  catalogRevision: "2026-10-17.entidades-fisicas",
  lockfileSha256: "ff".repeat(32),
};

/**
 * @param {{ status: number, body?: object, headers?: Record<string, string> }} spec
 */
function mockFetch(spec) {
  /** @type {typeof fetch} */
  return async () =>
    /** @type {Response} */ ({
      ok: spec.status >= 200 && spec.status < 300,
      status: spec.status,
      headers: {
        get: (name) => spec.headers?.[name.toLowerCase()] ?? null,
      },
      json: async () => spec.body,
    });
}

test("postdeploy OK con SHA coincidente", async () => {
  const result = await checkPostdeploy({
    base: "https://preview.example.test",
    expected: goodManifest.commit,
    fetchImpl: mockFetch({ status: 200, body: goodManifest }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.commit, goodManifest.commit);
});

test("postdeploy falla con SHA antiguo aunque HTTP 200", async () => {
  await assert.rejects(
    () =>
      checkPostdeploy({
        base: "https://preview.example.test",
        expected: goodManifest.commit,
        fetchImpl: mockFetch({ status: 200, body: { ...goodManifest, commit: "oldsha000" } }),
      }),
    /SHA desplegado oldsha000 ≠ esperado/,
  );
});

test("postdeploy falla ante redirect al canónico de producción", async () => {
  await assert.rejects(
    () =>
      checkPostdeploy({
        base: "https://preview.example.test",
        expected: goodManifest.commit,
        fetchImpl: mockFetch({
          status: 308,
          headers: { location: `https://${PRODUCTION_HOST}/build-manifest.json` },
        }),
      }),
    /redirect 308 a host no Preview/,
  );
});

test("postdeploy CLI exit 2 sin variables", () => {
  const r = spawnSync(process.execPath, [SCRIPT], {
    encoding: "utf8",
    env: { ...process.env, POSTDEPLOY_URL: "", EXPECTED_COMMIT: "" },
    cwd: ROOT,
  });
  assert.equal(r.status, 2);
});
