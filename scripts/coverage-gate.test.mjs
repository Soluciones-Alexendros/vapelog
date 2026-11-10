import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildCoverageNodeArgs, runCoverageGate, validateLcovArtifact } from "./coverage-gate.mjs";
import { childTestEnv } from "./unit-test-contract.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("validateLcovArtifact rechaza informe ausente", () => {
  const r = validateLcovArtifact(join(tmpdir(), `lcov-missing-${Date.now()}.info`));
  assert.equal(r.ok, false);
  assert.match(r.reason, /no encontrado/);
});

test("validateLcovArtifact rechaza informe vacío", () => {
  const dir = mkdtempSync(join(tmpdir(), "lcov-empty-"));
  try {
    const path = join(dir, "lcov.info");
    writeFileSync(path, "   \n");
    const r = validateLcovArtifact(path);
    assert.equal(r.ok, false);
    assert.match(r.reason, /vacío|SF:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("subtest anidado fallido hace fallar el comando node --test", () => {
  const dir = mkdtempSync(join(tmpdir(), "nested-fail-"));
  try {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    const testFile = join(dir, "scripts", "nested-fail.test.mjs");
    writeFileSync(
      testFile,
      `import test from "node:test";
import assert from "node:assert/strict";
test("outer", async (t) => {
  await t.test("inner", () => {
    assert.equal(1, 2);
  });
});
`,
    );
    const r = spawnSync(process.execPath, ["--test", testFile], {
      cwd: dir,
      encoding: "utf8",
      env: childTestEnv(),
    });
    assert.notEqual(r.status, 0, "se esperaba exit distinto de cero");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("cobertura bajo umbral hace fallar el gate (runner inyectado)", () => {
  const dir = mkdtempSync(join(tmpdir(), "low-cov-"));
  try {
    const lcovPath = join(dir, "coverage", "lcov.info");
    mkdirSync(join(dir, "coverage"), { recursive: true });
    const args = buildCoverageNodeArgs(["src/data/measures.test.ts"], {
      root: ROOT,
      lineThreshold: 99,
      lcovPath,
    });
    const r = spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: "utf8",
      env: childTestEnv(),
    });
    assert.notEqual(r.status, 0, `se esperaba fallo por umbral; exit=${r.status}\n${r.stderr}`);
    const artifact = validateLcovArtifact(lcovPath);
    assert.equal(artifact.ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("informe LCOV ausente tras ejecución exitosa falla el gate", () => {
  const dir = mkdtempSync(join(tmpdir(), "gate-missing-lcov-"));
  try {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(
      join(dir, "scripts", "ok.test.mjs"),
      `import test from "node:test";
test("pasa", () => {});
`,
    );
    const lcovPath = join(dir, "coverage", "no-write.info");
    const spawn = () => ({
      status: 0,
      stdout: "",
      stderr: "",
    });
    const { status } = runCoverageGate({
      root: dir,
      lcovPath,
      spawn,
    });
    assert.equal(status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runCoverageGate escribe LCOV no vacío en un mini workspace", () => {
  const dir = mkdtempSync(join(tmpdir(), "gate-ok-"));
  try {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "tiny.mjs"), "export const x = () => 1;\n");
    writeFileSync(
      join(dir, "scripts", "tiny.test.mjs"),
      `import test from "node:test";
import { x } from "./tiny.mjs";
test("usa x", () => { if (x() !== 1) throw new Error(); });
`,
    );
    const lcovPath = join(dir, "coverage", "lcov.info");
    mkdirSync(join(dir, "coverage"), { recursive: true });
    const { status, metrics } = runCoverageGate({ root: dir, lcovPath });
    assert.equal(status, 0, "mini workspace debería pasar 70%");
    assert.ok(metrics);
    const artifact = validateLcovArtifact(lcovPath);
    assert.equal(artifact.ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
