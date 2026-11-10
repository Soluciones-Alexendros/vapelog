import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { liquids } from "./catalog.ts";
import type { Liquid } from "./types.ts";
import { aggregateTpdStatuses, aggregateVariationTpd } from "./tpd.ts";

describe("aggregateTpdStatuses", () => {
  it("lista vacía → desconocido", () => {
    assert.equal(aggregateTpdStatuses([]), "desconocido");
  });

  it("todas ausentes → desconocido", () => {
    assert.equal(aggregateTpdStatuses([undefined, undefined]), "desconocido");
  });

  it("todas iguales y presentes → ese estado", () => {
    assert.equal(aggregateTpdStatuses(["si", "si"]), "si");
    assert.equal(aggregateTpdStatuses(["no-aplica", "no-aplica"]), "no-aplica");
  });

  it("conocidas mezcladas con ausentes → incompleto si coinciden", () => {
    assert.equal(aggregateTpdStatuses(["si", undefined]), "incompleto");
  });

  it("conocidas incompatibles con ausentes → parcial", () => {
    assert.equal(aggregateTpdStatuses(["si", "no", undefined]), "parcial");
  });

  it("estados conocidos incompatibles → parcial", () => {
    assert.equal(aggregateTpdStatuses(["si", "no"]), "parcial");
    assert.equal(aggregateTpdStatuses(["si", "parcial"]), "parcial");
  });

  it("aplicables mezcladas con no-aplica declarado → parcial", () => {
    assert.equal(aggregateTpdStatuses(["si", "no-aplica"]), "parcial");
    assert.equal(aggregateTpdStatuses(["no", "no-aplica"]), "parcial");
  });
});

describe("aggregateVariationTpd catálogo", () => {
  it("líquidos sin TPD en variantes → desconocido (regresión)", () => {
    let absentOnly = 0;
    for (const liquid of liquids) {
      const allAbsent = liquid.variations.every((v) => v.tpd === undefined);
      if (allAbsent) {
        absentOnly += 1;
        assert.equal(
          aggregateVariationTpd(liquid),
          "desconocido",
          `esperado desconocido: ${liquid.slug}`,
        );
        assert.equal(
          aggregateVariationTpd(liquid) !== "no-aplica",
          true,
          `no debe ser no-aplica: ${liquid.slug}`,
        );
      }
    }
    assert.ok(absentOnly >= 46, `se esperaban al menos 46 líquidos sin dato; hay ${absentOnly}`);
  });

  it("variante única no-aplica justificada sigue siendo no-aplica", () => {
    const liquid: Liquid = {
      domain: "liquid",
      id: "test",
      slug: "test",
      archiveId: "T",
      brandId: "b",
      name: "Test",
      summary: "",
      confidence: "ficha",
      sources: [],
      caveats: [],
      tags: [],
      status: "referenciado",
      genreId: "g",
      line: "",
      flavorIds: [],
      draws: ["MTL"],
      variations: [
        {
          id: "v1",
          label: "v1",
          fillVolumeMl: 10,
          containerCapacityMl: 10,
          nicotineMgPerMl: 0,
          ratioVgPct: 50,
          ratioPgPct: 50,
          tpd: "no-aplica",
        },
      ],
    };
    assert.equal(aggregateVariationTpd(liquid), "no-aplica");
  });
});
