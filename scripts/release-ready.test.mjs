import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReleaseReady } from "./release-ready.mjs";

const deps = {
  quality: { result: "success" },
  test: { result: "success" },
  build: { result: "success" },
  smoke: { result: "success" },
  browser: { result: "success" },
  "fx-e2e": { result: "success" },
  "supply-chain": { result: "success" },
};

test("VAL-003-01 fallo controlado (rama desechable)", () => {
  assert.equal(true, false, "fallo intencional para evidencia negativa del gate");
});

test("pasa solo si todas las dependencias están en success", () => {
  const { ok, failures } = evaluateReleaseReady(deps);
  assert.equal(ok, true);
  assert.deepEqual(failures, []);
});

test("falla si test está en failure", () => {
  const { ok, failures } = evaluateReleaseReady({
    ...deps,
    test: { result: "failure" },
  });
  assert.equal(ok, false);
  assert.ok(failures.some((f) => f.startsWith("test:")));
});

test("falla si un job está skipped (p. ej. quality falló antes)", () => {
  const { ok, failures } = evaluateReleaseReady({
    ...deps,
    test: { result: "skipped" },
  });
  assert.equal(ok, false);
  assert.ok(failures.some((f) => f.includes("skipped")));
});

test("falla si un job está cancelled", () => {
  const { ok, failures } = evaluateReleaseReady({
    ...deps,
    browser: { result: "cancelled" },
  });
  assert.equal(ok, false);
  assert.ok(failures.some((f) => f.includes("cancelled")));
});

test("falla con needs vacío o inválido", () => {
  assert.equal(evaluateReleaseReady(null).ok, false);
  assert.equal(evaluateReleaseReady(undefined).ok, false);
  assert.equal(evaluateReleaseReady({}).ok, true);
});
