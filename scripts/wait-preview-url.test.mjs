import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCTION_HOST,
  detectVercelRateLimit,
  isTransientGithubError,
  pickPreviewUrl,
  probePreviewReady,
} from "./wait-preview-url.mjs";

test("pickPreviewUrl ignora producción y entornos no Preview", () => {
  assert.equal(
    pickPreviewUrl([
      {
        state: "success",
        environment: "Production",
        environment_url: `https://${PRODUCTION_HOST}`,
        created_at: "2026-10-30T10:00:00Z",
      },
      {
        state: "success",
        environment: "Preview",
        environment_url: "https://vapelog-git-feat-xxx.vercel.app",
        created_at: "2026-10-30T11:00:00Z",
      },
    ]),
    "https://vapelog-git-feat-xxx.vercel.app",
  );
  assert.equal(
    pickPreviewUrl([
      {
        state: "success",
        environment: "Production",
        environment_url: `https://${PRODUCTION_HOST}`,
      },
    ]),
    null,
  );
});

test("probePreviewReady exige manifesto del SHA", async () => {
  /** @type {typeof fetch} */
  const fetchImpl = async (input) => {
    const url = String(input);
    if (url.endsWith("/build-manifest.json")) {
      return /** @type {Response} */ ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ commit: "sha-correcto" }),
      });
    }
    return /** @type {Response} */ ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({}),
    });
  };
  await probePreviewReady("https://preview.example.test", "sha-correcto", { fetchImpl });
  await assert.rejects(
    () => probePreviewReady("https://preview.example.test", "otro", { fetchImpl }),
    /manifiesto commit/,
  );
});

test("probePreviewReady falla ante redirect al canónico", async () => {
  /** @type {typeof fetch} */
  const fetchImpl = async () =>
    /** @type {Response} */ ({
      ok: false,
      status: 308,
      headers: {
        get: (n) => (n.toLowerCase() === "location" ? `https://${PRODUCTION_HOST}/` : null),
      },
      json: async () => ({}),
    });
  await assert.rejects(
    () => probePreviewReady("https://preview.example.test", "sha", { fetchImpl }),
    /redirige a host no Preview/,
  );
});

test("detectVercelRateLimit", () => {
  assert.equal(
    detectVercelRateLimit(
      {
        check_runs: [
          {
            name: "Vercel",
            output: { title: "Deployment rate limited — upgradeToPro=build-rate-limit" },
          },
        ],
      },
      { statuses: [] },
    ),
    true,
  );
  assert.equal(detectVercelRateLimit({ check_runs: [] }, { statuses: [] }), false);
});

test("isTransientGithubError reconoce 5xx y red", () => {
  assert.equal(isTransientGithubError(new Error("GitHub 500 /repos/x/status: ")), true);
  assert.equal(isTransientGithubError(new Error("GitHub 429 /repos/x/status: ")), true);
  assert.equal(isTransientGithubError(new Error("GitHub 404 /repos/x/status: ")), false);
  assert.equal(isTransientGithubError(new Error("fetch failed")), true);
});
