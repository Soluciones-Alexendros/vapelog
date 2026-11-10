import assert from "node:assert/strict";
import test from "node:test";
import { bypassStatus } from "./check-preview-bypass.mjs";

test("bypassStatus: con secreto el job continúa", () => {
  const s = bypassStatus({ VERCEL_AUTOMATION_BYPASS_SECRET: "abc123" });
  assert.equal(s.state, "ok");
  assert.equal(s.code, "BYPASS_PRESENT");
});

test("bypassStatus: secreto en blanco cuenta como ausente y exige configuración", () => {
  const s = bypassStatus({
    VERCEL_AUTOMATION_BYPASS_SECRET: "   ",
    VERCEL_PREVIEW_BYPASS_ENABLED: "true",
  });
  assert.equal(s.state, "error");
  assert.equal(s.code, "NO_BYPASS_SECRET");
  assert.match(s.message, /--env Preview/);
});

test("bypassStatus: fork sin secreto se omite sin fingir cobertura", () => {
  const s = bypassStatus({ PREVIEW_IS_FORK: "true", VERCEL_PREVIEW_BYPASS_ENABLED: "true" });
  assert.equal(s.state, "skipped");
  assert.equal(s.code, "FORK_WITHOUT_SECRET");
});

test("bypassStatus: sin secreto y sin obligación se omite con aviso", () => {
  const s = bypassStatus({});
  assert.equal(s.state, "skipped");
  assert.equal(s.code, "BYPASS_DISABLED");
  assert.match(s.message, /vap-22-preview-merge/);
});

test("bypassStatus: el flag solo se activa con 'true' exacto", () => {
  for (const flag of ["1", "yes", "TRUE ", "false", ""]) {
    const s = bypassStatus({ VERCEL_PREVIEW_BYPASS_ENABLED: flag });
    assert.equal(s.state, "skipped", `flag=${JSON.stringify(flag)}`);
  }
});
