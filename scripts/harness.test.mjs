import assert from "node:assert/strict";
import test from "node:test";
import { exitCodeFor, runHarness } from "./harness.mjs";

test("operator solo emite not_applicable", () => {
  const results = runHarness("operator");
  assert.ok(results.length >= 3);
  assert.ok(results.every((r) => r.status === "not_applicable"));
  assert.equal(exitCodeFor(results, "operator"), 0);
});

test("deployed sin URL queda blocked y exit 2", () => {
  const prevUrl = process.env.POSTDEPLOY_URL;
  const prevSha = process.env.EXPECTED_COMMIT;
  delete process.env.POSTDEPLOY_URL;
  delete process.env.EXPECTED_COMMIT;
  try {
    const results = runHarness("deployed");
    assert.ok(results.some((r) => r.id === "postdeploy" && r.status === "blocked"));
    assert.equal(exitCodeFor(results, "deployed"), 2);
  } finally {
    if (prevUrl !== undefined) process.env.POSTDEPLOY_URL = prevUrl;
    if (prevSha !== undefined) process.env.EXPECTED_COMMIT = prevSha;
  }
});

test("perfil desconocido falla", () => {
  const results = runHarness("nope");
  assert.ok(results.some((r) => r.status === "failed"));
  assert.equal(exitCodeFor(results, "nope"), 1);
});
