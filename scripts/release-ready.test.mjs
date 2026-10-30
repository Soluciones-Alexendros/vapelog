import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  REQUIRED_JOBS,
  evaluateReleaseReady,
  parseReleaseReadyNeedsFromCi,
} from "./release-ready.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "release-ready.mjs");

const deps = Object.fromEntries(REQUIRED_JOBS.map((name) => [name, { result: "success" }]));

test("pasa solo si todas las dependencias obligatorias están en success", () => {
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

test("falla con needs vacío, array o inválido", () => {
  assert.equal(evaluateReleaseReady(null).ok, false);
  assert.equal(evaluateReleaseReady(undefined).ok, false);
  assert.equal(evaluateReleaseReady({}).ok, false);
  assert.equal(evaluateReleaseReady([]).ok, false);
  assert.ok(evaluateReleaseReady({}).failures.some((f) => /vacío/.test(f)));
});

test("falla si falta una dependencia obligatoria", () => {
  const incomplete = { ...deps };
  delete incomplete.browser;
  const { ok, failures } = evaluateReleaseReady(incomplete);
  assert.equal(ok, false);
  assert.ok(failures.some((f) => f === "browser: ausente"));
});

test("falla si hay una clave fuera del contrato", () => {
  const { ok, failures } = evaluateReleaseReady({
    ...deps,
    "smoke-bench": { result: "success" },
  });
  assert.equal(ok, false);
  assert.ok(failures.some((f) => /smoke-bench/.test(f)));
});

test("falla si result está ausente o es desconocido", () => {
  assert.ok(
    evaluateReleaseReady({ ...deps, quality: {} }).failures.some((f) =>
      f.includes("quality: undefined"),
    ),
  );
  assert.ok(
    evaluateReleaseReady({ ...deps, quality: { result: "unknown" } }).failures.some((f) =>
      f.includes("quality: unknown"),
    ),
  );
  assert.ok(
    evaluateReleaseReady({ ...deps, quality: null }).failures.some((f) =>
      f.includes("quality: undefined"),
    ),
  );
});

test("REQUIRED_JOBS coincide con needs del job release-ready en ci.yml", () => {
  const yaml = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
  const fromCi = parseReleaseReadyNeedsFromCi(yaml);
  assert.ok(fromCi, "no se encontró needs de release-ready en ci.yml");
  assert.deepEqual(fromCi, [...REQUIRED_JOBS]);
});

function runCli(args, input) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    input,
    cwd: ROOT,
  });
}

test("CLI exit 0 con conjunto completo satisfactorio", () => {
  const dir = mkdtempSync(join(tmpdir(), "rr-"));
  try {
    const file = join(dir, "needs.json");
    writeFileSync(file, JSON.stringify(deps));
    const r = runCli([file]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /release-ready: OK/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI exit 1 con needs vacío", () => {
  const dir = mkdtempSync(join(tmpdir(), "rr-"));
  try {
    const file = join(dir, "needs.json");
    writeFileSync(file, "{}");
    const r = runCli([file]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /gate rojo/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI exit 2 con JSON inválido", () => {
  const dir = mkdtempSync(join(tmpdir(), "rr-"));
  try {
    const file = join(dir, "needs.json");
    writeFileSync(file, "{no-json");
    const r = runCli([file]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /JSON inválido/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI exit 2 con fichero ausente", () => {
  const r = runCli([join(tmpdir(), "release-ready-no-existe-" + Date.now() + ".json")]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no se pudo leer/);
});
