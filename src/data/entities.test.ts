import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug } from "./catalog.ts";
import {
  aggregateVariationTpd,
  assertKitReferencesResolvable,
  documentedKit,
  interfacesMayMate,
  projectCoil,
  projectDevice,
  projectLiquid,
  type MatingInterface,
} from "./entities.ts";
import type { Coil, Liquid } from "./types.ts";

describe("entidades físicas proyectadas VAL-009–012", () => {
  it("VAL-009-01: cápsula con construcción malla no es resistencia reemplazable", () => {
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(coil);
    assert.equal(coil!.familyId, "capsula");
    assert.equal(coil!.build, "malla");
    const projected = projectCoil(coil!);
    assert.equal(projected.kind, "cartridge");
    if (projected.kind === "cartridge") {
      assert.equal(projected.heaterEmbedded, true);
      assert.equal(projected.coilReplaceable, false);
      assert.equal(projected.integratedCoilId, null);
    }
  });

  it("VAL-009-02: build legado capsula no reclasifica un cabezal de tanque", () => {
    const coil = coilBySlug("vaporesso-gtx-0-15");
    assert.ok(coil);
    const spoofed: Coil = { ...coil!, build: "capsula" };
    const projected = projectCoil(spoofed);
    assert.equal(projected.kind, "coil_head");
    if (projected.kind === "coil_head") {
      assert.match(projected.housingInterfaceId, /^coil_housing:/);
    }
  });

  it("una coil de tanque se proyecta como cabezal con interfaz de alojamiento", () => {
    const coil = coilBySlug("geekvape-z-0-15");
    assert.ok(coil);
    const projected = projectCoil(coil!);
    assert.equal(projected.kind, "coil_head");
    if (projected.kind === "coil_head") {
      assert.match(projected.housingInterfaceId, /^coil_housing:/);
    }
  });

  it("VAL-009-03: interfaces de distinto kind no se emparejan por texto igual", () => {
    const a: MatingInterface = {
      kind: "device_atomizer",
      id: "shared-label",
      label: "510",
    };
    const b: MatingInterface = {
      kind: "coil_housing",
      id: "shared-label",
      label: "510",
    };
    assert.equal(interfacesMayMate(a, b), false);
  });

  it("VAL-010-02: kit sin documentación es unknown, no lista vacía confirmada", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    assert.ok(device);
    const { kit, interfaces } = projectDevice(device!);
    assert.equal(kit.status, "unknown");
    if (kit.status === "unknown") {
      assert.ok(kit.platformIds.length > 0);
      assert.equal(kit.deviceId, device!.id);
    }
    assert.ok(interfaces.some((entry) => entry.kind === "device_cartridge"));
  });

  it("VAL-010-01/03: presentaciones documentadas distinguibles; FK rota bloquea", () => {
    const solo = documentedKit({
      deviceId: "mod-solo",
      atomizerIds: [],
      cartridgeIds: [],
      coilHeadIds: [],
      accessoryIds: [],
      platformIds: ["gtx"],
    });
    const kitA = documentedKit({
      deviceId: "mod-solo",
      atomizerIds: ["atom-a"],
      cartridgeIds: [],
      coilHeadIds: ["coil-a"],
      accessoryIds: [],
      platformIds: ["gtx"],
    });
    assert.equal(solo.status, "documented");
    assert.equal(kitA.status, "documented");
    if (solo.status === "documented" && kitA.status === "documented") {
      assert.notDeepEqual(solo.contents, kitA.contents);
    }
    const errors = assertKitReferencesResolvable(
      {
        deviceId: "mod-solo",
        atomizerIds: ["missing-atom"],
        cartridgeIds: [],
        coilHeadIds: [],
        accessoryIds: [],
        platformIds: [],
      },
      new Set(["mod-solo"]),
    );
    assert.ok(errors.some((error) => /inexistente/.test(error)));
  });

  it("VAL-011: TPD agregado no depende del orden de variantes", () => {
    const liquid: Liquid = {
      domain: "liquid",
      id: "liq-tpd",
      slug: "liq-tpd",
      archiveId: "T",
      brandId: "test",
      name: "TPD test",
      summary: "",
      confidence: "ficha",
      sources: [],
      caveats: [],
      tags: [],
      status: "referenciado",
      genreId: "freebase",
      line: "",
      flavorIds: [],
      draws: ["MTL"],
      variations: [
        {
          id: "a",
          label: "si",
          fillVolumeMl: 10,
          containerCapacityMl: 10,
          nicotineMgPerMl: 0,
          ratioVgPct: 50,
          ratioPgPct: 50,
          tpd: "si",
        },
        {
          id: "b",
          label: "no",
          fillVolumeMl: 10,
          containerCapacityMl: 10,
          nicotineMgPerMl: 3,
          ratioVgPct: 70,
          ratioPgPct: 30,
          tpd: "no",
        },
      ],
    };
    const forward = aggregateVariationTpd(liquid);
    const reversed = aggregateVariationTpd({
      ...liquid,
      variations: [...liquid.variations].reverse(),
    });
    assert.equal(forward, "parcial");
    assert.equal(reversed, "parcial");
    assert.equal(projectLiquid(liquid).tpdStatus, "parcial");
  });
});
