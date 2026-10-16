import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug } from "./catalog.ts";
import { evaluateCompatibility } from "./compat-evaluation.ts";

describe("evaluateCompatibility", () => {
  it("XROS 4 + Corex 0,8 separa físico y eléctrico con ids estables", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    const result = evaluateCompatibility(device!, coil!);
    assert.equal(result.deviceId, device!.id);
    assert.equal(result.coilId, coil!.id);
    assert.equal(result.physical.status, "match");
    assert.equal(result.legacyKind, "nativa");
    assert.ok(result.physical.reasons.length > 0);
  });

  it("sin datos eléctricos suficientes no inventa match eléctrico", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    const bare = {
      ...device!,
      powerMinW: null,
      powerMaxW: null,
      ohmMin: null,
      ohmMax: null,
    };
    const result = evaluateCompatibility(bare, { ...coil!, wattMin: null, wattMax: null });
    assert.ok(["unknown", "match", "not_applicable"].includes(result.electrical.status));
  });
});
