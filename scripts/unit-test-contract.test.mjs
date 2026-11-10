import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverUnitTestFiles,
  isCoverageExcluded,
  isInCoverageUniverse,
  listCoverageUniverseFiles,
  repoRoot,
} from "./unit-test-contract.mjs";

test("descubrimiento recursivo incluye tests anidados bajo src/data", () => {
  const files = discoverUnitTestFiles();
  assert.ok(
    files.includes("src/data/dimension-window.test.ts"),
    "el glob plano src/data/*.test.ts no cubriría este fichero",
  );
});

test("universo excluye tests, generados y acepta lógica de dominio", () => {
  assert.equal(isCoverageExcluded("src/data/logic.test.ts"), true);
  assert.equal(isCoverageExcluded("src/data/images.gen.ts"), true);
  assert.equal(isInCoverageUniverse("src/data/images.gen.ts"), false);
  assert.equal(isInCoverageUniverse("src/data/logic.ts"), true);
  assert.equal(isInCoverageUniverse("scripts/coverage-gate.mjs"), true);
});

test("inventario del universo no está vacío y no lista .test.ts", () => {
  const universe = listCoverageUniverseFiles(repoRoot());
  assert.ok(universe.length > 20);
  assert.ok(universe.every((p) => !p.endsWith(".test.ts")));
  assert.ok(universe.every((p) => !p.endsWith(".test.mjs")));
  assert.ok(!universe.includes("src/data/images.gen.ts"));
});
