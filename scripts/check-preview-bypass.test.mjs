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

test("CLI: escribe GITHUB_OUTPUT y sale 0 cuando hay secreto", async () => {
  const { execFile } = await import("node:child_process");
  const { mkdtempSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { promisify } = await import("node:util");

  const out = join(mkdtempSync(join(tmpdir(), "bypass-out-")), "github-output");
  const run = promisify(execFile);
  const { stdout } = await run(process.execPath, ["scripts/check-preview-bypass.mjs"], {
    env: { ...process.env, VERCEL_AUTOMATION_BYPASS_SECRET: "tok", GITHUB_OUTPUT: out },
  });
  assert.match(stdout, /Automation Bypass presente/);
  assert.match(readFileSync(out, "utf8"), /^state=ok$/m);
  assert.match(readFileSync(out, "utf8"), /^code=BYPASS_PRESENT$/m);
});

test("CLI: sale 1 con ::error cuando falta el secreto y es exigible", async () => {
  const { execFile } = await import("node:child_process");
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const out = join(mkdtempSync(join(tmpdir(), "bypass-out-")), "github-output");
  const child = execFile(process.execPath, ["scripts/check-preview-bypass.mjs"], {
    env: {
      ...process.env,
      VERCEL_AUTOMATION_BYPASS_SECRET: "",
      VERCEL_PREVIEW_BYPASS_ENABLED: "true",
      GITHUB_OUTPUT: out,
    },
  });
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 1);
});
