import assert from "node:assert/strict";
import test from "node:test";
import { checkManifest, validateManifestStructure } from "./check-manifest.mjs";

const base = {
  commit: "abc123",
  version: "0.12.0",
  lockfileSha256: "deadbeef",
  schemaVersion: "1.3.0",
  catalogRevision: "2026-10-16.normalizacion",
};

test("acepta manifiesto alineado", () => {
  const { ok, mismatches } = checkManifest(base, {
    commit: "abc123",
    version: "0.12.0",
    lockfileSha256: "deadbeef",
    schemaVersion: "1.3.0",
    catalogRevision: "2026-10-16.normalizacion",
  });
  assert.equal(ok, true);
  assert.deepEqual(mismatches, []);
});

test("rechaza SHA distinto", () => {
  const { ok, mismatches } = checkManifest(base, { commit: "fff" });
  assert.equal(ok, false);
  assert.ok(mismatches.some((m) => m.startsWith("commit:")));
});

test("rechaza lockfile distinto", () => {
  const { ok } = checkManifest(base, { lockfileSha256: "otro" });
  assert.equal(ok, false);
});

test("rechaza estructura incompleta", () => {
  const { ok, mismatches } = validateManifestStructure({ commit: "x" });
  assert.equal(ok, false);
  assert.ok(mismatches.some((m) => /version: ausente/.test(m)));
});

test("rechaza JSON no objeto", () => {
  assert.equal(validateManifestStructure(null).ok, false);
  assert.equal(validateManifestStructure([]).ok, false);
});

test("rechaza schemaVersion o catalogRevision distintos cuando se esperan", () => {
  assert.equal(checkManifest(base, { schemaVersion: "9.9.9" }).ok, false);
  assert.equal(checkManifest(base, { catalogRevision: "otra" }).ok, false);
});
