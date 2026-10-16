import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug, coils, devices, liquidBySlug, parts } from "./catalog.ts";
import { editorialRuleById } from "./editorial-rules.ts";
import {
  availableOhms,
  compatibility,
  knownNicotineMgPerMl,
  mixNicotine,
  partsForDevice,
  powerNotes,
  recommendedPowerForOhms,
  recommendLiquids,
  round,
  shotAlternatives,
  shotsForTarget,
  solveOhm,
} from "./logic.ts";
import type { Coil, Device, Liquid, Ratio } from "./types";

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

function syntheticLiquid(
  overrides: Partial<Liquid> & Pick<Liquid, "slug"> & { ratio?: Ratio | null },
): Liquid {
  const { ratio = null, ...rest } = overrides;
  return {
    domain: "liquid",
    id: overrides.slug,
    archiveId: "TEST-LIQ",
    brandId: "test",
    name: overrides.slug,
    genreId: "shortfill",
    line: "test",
    summary: "Líquido sintético para tests.",
    confidence: "ficha",
    sources: [],
    caveats: [],
    tags: [],
    status: "referenciado",
    flavorIds: [],
    draws: ["MTL"],
    variations: [
      {
        id: "base",
        label: "50 ml · 0 mg/ml",
        volumeMl: 50,
        hasNicotine: false,
        nicotineMg: 0,
        ratio,
        bottle: "",
        tpd: "si",
      },
    ],
    ...rest,
  };
}

describe("ley de Ohm", () => {
  it("cierra potencia y resistencia", () => {
    const result = solveOhm({ ohms: 0.8, watts: 14 });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(round(result.amps, 2), round(Math.sqrt(14 / 0.8), 2));
    assert.ok(Math.abs(result.volts - result.amps * 0.8) < 1e-9);
  });

  it("rechaza resistencia nula", () => {
    const result = solveOhm({ ohms: 0, watts: 10 });
    assert.equal("error" in result, true);
  });
});

describe("nicokit", () => {
  it("50 ml + un shot de 10 ml a 20 mg quedan en 3,33 mg/ml", () => {
    const result = mixNicotine({
      initialZeroMgMl: 50,
      bottleMl: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 1,
    });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(round(result.mgPerMl, 2), 3.33);
    assert.equal(result.overflow, false);
    assert.equal(result.overTpdStrength, false);
    assert.equal(result.freeMl, 10);
    assert.equal(result.remainingMl, 0);
  });

  it("avisa si el shot no cabe", () => {
    const result = mixNicotine({
      initialZeroMgMl: 50,
      bottleMl: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 2,
    });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(result.overflow, true);
    assert.ok(result.remainingMl < 0);
  });

  it("calcula un shot para el ejemplo clásico", () => {
    const result = shotsForTarget(50, 10, 20, 20 / 6);
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.ok(Math.abs(result.shots - 1) < 0.02);
  });

  it("objetivo cero no añade nicokits", () => {
    const result = shotsForTarget(50, 10, 20, 0, 60);
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(result.shots, 0);
    assert.equal(result.mgPerMl, 0);
    assert.equal(result.overflow, false);
  });

  it("las alternativas enteras marcan desbordamiento", () => {
    const alts = shotAlternatives(55, 60, 10, 20, 5);
    assert.ok(alts.length > 0);
    assert.ok(alts.some((alt) => alt.overflow));
  });

  it("rechaza un número de nicokits no entero", () => {
    const result = mixNicotine({
      initialZeroMgMl: 50,
      bottleMl: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 1.5,
    });
    assert.equal("error" in result, true);
  });
});

describe("cruce", () => {
  it("la cápsula XROS es nativa en el XROS 4", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });

  it("la cápsula XROS es nativa en el XROS 6", () => {
    const device = deviceBySlug("vaporesso-xros-6");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });

  it("la B 0,4 es nativa en el Hero 5", () => {
    const device = deviceBySlug("geekvape-aegis-hero-5");
    const coil = coilBySlug("geekvape-b-0-4");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });

  it("el cartucho XLIM es nativo en el XLIM Pro 3", () => {
    const device = deviceBySlug("oxva-xlim-pro-3");
    const coil = coilBySlug("xlim-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });

  it("la PnP no es nativa en el Drag 6 (va en el kit PnP X)", () => {
    const device = deviceBySlug("voopoo-drag-6");
    const coil = coilBySlug("voopoo-pnp-vm1");
    assert.ok(device && coil);
    if (!device || !coil) return;
    const result = compatibility(device, coil);
    assert.notEqual(result.kind, "nativa");
  });

  it("la Z 0,2 va en el tanque del kit L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("geekvape-z-0-2");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "kit");
  });

  it("la Z 0,2 no entra en el XROS 4", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    const coil = coilBySlug("geekvape-z-0-2");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("una cápsula XROS no entra en el L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("una GTX de 0,15 Ω no cabe en el LUXE X de 40 W", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-15");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("la Z 0,15 no se da por kit del L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("geekvape-z-0-15");
    assert.ok(device && coil);
    if (!device || !coil) return;
    const result = compatibility(device, coil);
    assert.notEqual(result.kind, "kit");
    assert.notEqual(result.kind, "nativa");
    assert.match(result.reasons.join(" "), /PDF/);
  });

  it("una GTX de 0,8 Ω es nativa en el LUXE X", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });
});

describe("ventana de potencia en ambos sentidos", () => {
  it("una coil por debajo del mínimo del dispositivo cruza a no", () => {
    const device = syntheticDevice({
      slug: "mod-fijo-40",
      powerMinW: 40,
      powerMaxW: 40,
      ohmMin: null,
      ohmMax: null,
    });
    const coil = syntheticCoil({ slug: "coil-15-25", ohms: 0.4, wattMin: 15, wattMax: 25 });
    const result = compatibility(device, coil);
    assert.equal(result.kind, "no");
    assert.match(
      result.reasons.join(" "),
      /se recomienda hasta 25 W y el dispositivo publica un mínimo de 40 W/,
    );
  });
});

describe("ventana de ohmios por extremos", () => {
  it("una coil por debajo del mínimo publicado cruza a no aunque no haya máximo", () => {
    const device = syntheticDevice({
      slug: "mod-min-0-5",
      powerMinW: null,
      powerMaxW: null,
      ohmMin: 0.5,
      ohmMax: null,
    });
    const coil = syntheticCoil({ slug: "coil-0-3", ohms: 0.3 });
    const result = compatibility(device, coil);
    assert.equal(result.kind, "no");
    assert.match(
      result.reasons.join(" "),
      /0\.3 Ω queda por debajo del mínimo publicado \(0\.5 Ω\)/,
    );
  });

  it("una coil por encima del máximo publicado cruza a no aunque no haya mínimo", () => {
    const device = syntheticDevice({
      slug: "mod-max-3",
      powerMinW: null,
      powerMaxW: null,
      ohmMin: null,
      ohmMax: 3,
    });
    const coil = syntheticCoil({ slug: "coil-3-5", ohms: 3.5 });
    const result = compatibility(device, coil);
    assert.equal(result.kind, "no");
    assert.match(result.reasons.join(" "), /3\.5 Ω supera el máximo publicado \(3 Ω\)/);
  });
});

describe("regresión de catálogo", () => {
  it("ningún cruce nativa, kit o eléctrica viola la ventana publicada de potencia u ohmios", () => {
    for (const device of devices) {
      for (const coil of coils) {
        const result = compatibility(device, coil);
        if (result.kind === "no") continue;
        if (device.powerMaxW != null && coil.wattMin != null) {
          assert.ok(
            coil.wattMin <= device.powerMaxW,
            `${device.slug} x ${coil.slug}: la coil pide desde ${coil.wattMin} W y el techo publicado es ${device.powerMaxW} W`,
          );
        }
        if (device.powerMinW != null && coil.wattMax != null) {
          assert.ok(
            coil.wattMax >= device.powerMinW,
            `${device.slug} x ${coil.slug}: la coil se recomienda hasta ${coil.wattMax} W y el suelo publicado es ${device.powerMinW} W`,
          );
        }
        if (device.ohmMin != null) {
          assert.ok(
            coil.ohms >= device.ohmMin,
            `${device.slug} x ${coil.slug}: ${coil.ohms} Ω queda bajo el mínimo publicado de ${device.ohmMin} Ω`,
          );
        }
        if (device.ohmMax != null) {
          assert.ok(
            coil.ohms <= device.ohmMax,
            `${device.slug} x ${coil.slug}: ${coil.ohms} Ω supera el máximo publicado de ${device.ohmMax} Ω`,
          );
        }
      }
    }
  });

  it("el L200 no lista la boquilla de rosca 510 genérica", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    assert.ok(device);
    if (!device) return;
    assert.ok(parts.some((part) => part.slug === "boquilla-rosca-510"));
    const fitted = partsForDevice(device, parts);
    assert.ok(fitted.every((part) => part.slug !== "boquilla-rosca-510"));
  });
});

describe("líquidos por coil", () => {
  it("la regla de umbral 12 mg/ml queda retirada", () => {
    const rule = editorialRuleById("nicotine-mg-draw-threshold-12");
    assert.equal(rule?.status, "withdrawn");
    const coil = syntheticCoil({ slug: "coil-mtl", ohms: 0.8, draws: ["MTL"] });
    const liquid = syntheticLiquid({
      slug: "sales-20",
      draws: ["MTL"],
      variations: [
        {
          id: "sal-20",
          label: "20 mg/ml · 10 ml",
          volumeMl: 10,
          hasNicotine: true,
          nicotineMg: 20,
          ratio: "50/50",
          tpd: "si",
        },
      ],
    });
    const [fit] = recommendLiquids(coil, [liquid]);
    assert.equal(fit?.fit, "directo");
  });

  it("un aroma no se clasifica como listo para uso directo", () => {
    const coil = syntheticCoil({
      slug: "coil-mtl",
      ohms: 1.2,
      draws: ["MTL"],
      refillable: true,
    });
    const aroma = liquidBySlug("herrera-abarra-aroma");
    assert.ok(aroma);
    if (!aroma) return;
    const [fit] = recommendLiquids(coil, [aroma]);
    assert.equal(fit?.fit, "preparacion");
    assert.equal(fit?.requiresPreparation, true);
    assert.match(fit?.reason ?? "", /preparación/i);
  });

  it("un 70/30 en una MTL de 0,8 Ω queda en posible con su aviso", () => {
    const coil = syntheticCoil({ slug: "coil-mtl", ohms: 0.8, draws: ["MTL"] });
    const liquid = syntheticLiquid({ slug: "liquido-70-30-test", ratio: "70/30" });
    const [fit] = recommendLiquids(coil, [liquid]);
    assert.equal(fit?.fit, "posible");
    assert.match(fit?.reason ?? "", /VG alto/);
  });

  it("elige la variación con mejor encaje cuando el VG alto baja el rango", () => {
    const coil = syntheticCoil({ slug: "coil-mtl", ohms: 0.8, draws: ["MTL"] });
    const liquid = syntheticLiquid({
      slug: "doble-variacion",
      draws: ["MTL"],
      variations: [
        {
          id: "alto-vg",
          label: "0 mg/ml · 70/30",
          volumeMl: 50,
          hasNicotine: false,
          nicotineMg: 0,
          ratio: "70/30",
          tpd: "si",
        },
        {
          id: "fifty",
          label: "0 mg/ml · 50/50",
          volumeMl: 10,
          hasNicotine: false,
          nicotineMg: 0,
          ratio: "50/50",
          tpd: "si",
        },
      ],
    });
    const [fit] = recommendLiquids(coil, [liquid]);
    assert.equal(fit?.fit, "directo");
    assert.equal(fit?.variation.id, "fifty");
  });

  it("una concentración desconocida no se lee como cero", () => {
    const variation = {
      id: "unk",
      label: "sin dato",
      volumeMl: 10,
      hasNicotine: true,
      ratio: "50/50" as Ratio,
      tpd: "si" as const,
    };
    assert.equal(knownNicotineMgPerMl(variation), null);
  });
});

describe("ventana eléctrica estructurada", () => {
  it("sin límites publicados no afirma estar dentro", () => {
    const device = syntheticDevice({
      slug: "sin-ventana",
      powerMinW: null,
      powerMaxW: null,
      ohmMin: null,
      ohmMax: null,
    });
    const result = powerNotes(device, 20, 0.5);
    assert.equal(result.power, "unknown");
    assert.equal(result.ohms, "unknown");
    assert.ok(result.notes.some((note) => /no se puede afirmar/i.test(note)));
    assert.ok(!result.notes.some((note) => /^Dentro de la ventana/.test(note)));
  });
});

describe("availableOhms", () => {
  it("ordena y elimina duplicados normalizados a 2 decimales", () => {
    const result = availableOhms([
      syntheticCoil({ slug: "c-08-a", ohms: 0.8 }),
      syntheticCoil({ slug: "c-04", ohms: 0.4 }),
      syntheticCoil({ slug: "c-08-b", ohms: 0.8 }),
      syntheticCoil({ slug: "c-12", ohms: 1.2 }),
    ]);
    assert.deepEqual(result, [0.4, 0.8, 1.2]);
  });

  it("tolera ruido flotante al normalizar", () => {
    const result = availableOhms([
      syntheticCoil({ slug: "c-float", ohms: 0.1 + 0.2 }),
      syntheticCoil({ slug: "c-exact", ohms: 0.3 }),
    ]);
    assert.deepEqual(result, [0.3]);
  });
});

describe("recommendedPowerForOhms", () => {
  it("tolera ruido flotante al emparejar ohmios", () => {
    const result = recommendedPowerForOhms(0.3, [
      syntheticCoil({ slug: "c-float", ohms: 0.1 + 0.2, wattMin: 10, wattMax: 20 }),
    ]);
    assert.equal(result.hasPublished, true);
    assert.equal(result.matchingCoilCount, 1);
  });

  it("devuelve caveat cuando no hay coils publicadas para el valor", () => {
    const result = recommendedPowerForOhms(0.5, [
      syntheticCoil({ slug: "c-sin-rango", ohms: 0.5 }),
      syntheticCoil({ slug: "c-otro", ohms: 0.8, wattMin: 12, wattMax: 18 }),
    ]);
    assert.equal(result.hasPublished, false);
    assert.deepEqual(result.references, []);
    assert.equal(result.matchingCoilCount, 0);
    assert.equal(
      result.note,
      "No se publica un rango de vatios propio para este valor de resistencia.",
    );
  });

  it("una sola coil devuelve su rango exacto como referencia", () => {
    const result = recommendedPowerForOhms(0.8, [
      syntheticCoil({ slug: "c-unica", ohms: 0.8, wattMin: 12, wattMax: 18, name: "Única" }),
    ]);
    assert.equal(result.hasPublished, true);
    assert.equal(result.matchingCoilCount, 1);
    assert.equal(result.references[0]?.wattMin, 12);
    assert.equal(result.references[0]?.wattMax, 18);
    assert.match(result.note, /Única/);
  });

  it("varias coils del mismo ohmiaje no fabrican una potencia universal", () => {
    const result = recommendedPowerForOhms(0.4, [
      syntheticCoil({ slug: "c-a", ohms: 0.4, wattMin: 15, wattMax: 25, name: "A" }),
      syntheticCoil({ slug: "c-b", ohms: 0.4, wattMin: 20, wattMax: 30, name: "B" }),
    ]);
    assert.equal(result.hasPublished, true);
    assert.equal(result.matchingCoilCount, 2);
    assert.equal(result.references.length, 2);
    assert.equal(result.references[0]?.wattMin, 15);
    assert.equal(result.references[0]?.wattMax, 25);
    assert.equal(result.references[1]?.wattMin, 20);
    assert.equal(result.references[1]?.wattMax, 30);
    assert.match(result.note, /no hay una potencia recomendada única/i);
  });
});
