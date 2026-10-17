import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug } from "./catalog.ts";
import { evaluateCompatibility, toCompatResult } from "./compat-evaluation.ts";
import type { Coil, Device } from "./types.ts";

function syntheticDevice(
  overrides: Partial<Device> &
    Pick<Device, "slug" | "powerMinW" | "powerMaxW" | "ohmMin" | "ohmMax">,
): Device {
  return {
    domain: "device",
    id: overrides.slug,
    archiveId: "TEST-DEV",
    brandId: "test",
    name: overrides.slug,
    familyId: "mod",
    subId: "mod.dual",
    summary: "Dispositivo sintético para tests.",
    confidence: "ficha",
    sources: [],
    caveats: [],
    tags: [],
    status: "referenciado",
    batteryKind: "integrada",
    batteryMah: null,
    cellCount: null,
    cellType: null,
    chargePort: "USB-C",
    chargeAmps: null,
    chargeVolts: null,
    chipset: null,
    modes: [],
    displayKind: null,
    displaySizeIn: null,
    connector: "510",
    platformIds: [],
    kitPlatformIds: [],
    materials: null,
    airflow: null,
    capacityMl: null,
    capacityTpdMl: null,
    heightMm: null,
    widthMm: null,
    depthMm: null,
    weightG: null,
    tpd: "no-aplica",
    year: null,
    draws: [],
    ...overrides,
  };
}

function syntheticCoil(overrides: Partial<Coil> & Pick<Coil, "slug" | "ohms">): Coil {
  return {
    domain: "coil",
    id: overrides.slug,
    archiveId: "TEST-COIL",
    brandId: "test",
    name: overrides.slug,
    familyId: "tanque",
    subId: "tanque.z",
    summary: "Coil sintética para tests.",
    confidence: "ficha",
    sources: [],
    caveats: [],
    tags: [],
    status: "referenciado",
    platformIds: [],
    wattMin: null,
    wattMax: null,
    wireKind: "malla",
    wireMaterial: null,
    build: "malla",
    draws: ["DL"],
    connector: "510",
    refillable: true,
    packCount: null,
    ...overrides,
  };
}

describe("evaluateCompatibility VAL-006", () => {
  it("VAL-006-01: plataforma OK y potencia incompatible → físico match, eléctrico mismatch", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-15");
    assert.ok(device && coil);
    const result = evaluateCompatibility(device!, coil!);
    assert.equal(result.physical.status, "match");
    assert.equal(result.electrical.status, "mismatch");
    assert.equal(result.legacyKind, "no");
  });

  it("VAL-006-01 sintético: misma plataforma, wattMin > powerMax", () => {
    const device = syntheticDevice({
      slug: "mod-40",
      platformIds: ["plat-a"],
      connector: "propietario",
      powerMaxW: 40,
      powerMinW: 5,
      ohmMin: null,
      ohmMax: null,
    });
    const coil = syntheticCoil({
      slug: "coil-hot",
      platformIds: ["plat-a"],
      connector: "propietario",
      wattMin: 60,
      wattMax: 80,
      ohms: 0.15,
    });
    const result = evaluateCompatibility(device, coil);
    assert.equal(result.physical.status, "match");
    assert.equal(result.electrical.status, "mismatch");
    assert.equal(result.legacyKind, "no");
  });

  it("VAL-006-02: un solo extremo conocido no eleva a match eléctrico", () => {
    const device = syntheticDevice({
      slug: "mod-partial",
      platformIds: ["plat-a"],
      connector: "propietario",
      powerMaxW: 40,
      powerMinW: null,
      ohmMin: null,
      ohmMax: null,
    });
    const coil = syntheticCoil({
      slug: "coil-partial",
      platformIds: ["plat-a"],
      connector: "propietario",
      wattMin: null,
      wattMax: null,
      ohms: 0.8,
    });
    const result = evaluateCompatibility(device, coil);
    assert.equal(result.physical.status, "match");
    assert.equal(result.electrical.status, "unknown");
  });

  it("VAL-006-02: sin ventanas → eléctrico unknown estricto", () => {
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
    assert.equal(result.electrical.status, "unknown");
  });

  it("VAL-006-03: el resultado dimensional no depende de notas o idioma", () => {
    const device = syntheticDevice({
      slug: "mod-lang",
      platformIds: ["plat-a"],
      connector: "propietario",
      powerMaxW: 40,
      powerMinW: 5,
      ohmMin: null,
      ohmMax: null,
    });
    const coil = syntheticCoil({
      slug: "coil-lang",
      platformIds: ["plat-a"],
      connector: "propietario",
      wattMin: 60,
      wattMax: 80,
      ohms: 0.2,
    });
    const a = evaluateCompatibility(device, coil);
    const b = evaluateCompatibility(
      { ...device, caveats: ["texte français quelconque"] },
      { ...coil, caveats: ["other language notes ignored"] },
    );
    assert.equal(a.physical.status, b.physical.status);
    assert.equal(a.electrical.status, b.electrical.status);
    assert.equal(a.legacyKind, b.legacyKind);
  });

  it("VAL-006-04: evidencia incompleta no fabrica match ni mismatch eléctrico", () => {
    const device = syntheticDevice({
      slug: "mod-unk",
      platformIds: ["plat-a"],
      connector: "propietario",
      powerMinW: null,
      powerMaxW: null,
      ohmMin: null,
      ohmMax: null,
    });
    const coil = syntheticCoil({
      slug: "coil-unk",
      platformIds: ["plat-a"],
      connector: "propietario",
      wattMin: null,
      wattMax: null,
      ohms: 0.8,
    });
    const result = evaluateCompatibility(device, coil);
    assert.equal(result.physical.status, "match");
    assert.equal(result.electrical.status, "unknown");
  });

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

  it("toCompatResult preserva legacyKind del evaluador", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-15");
    assert.ok(device && coil);
    const evaluation = evaluateCompatibility(device!, coil!);
    const legacy = toCompatResult(evaluation);
    assert.equal(legacy.kind, evaluation.legacyKind);
    assert.equal(legacy.kind, "no");
  });
});
