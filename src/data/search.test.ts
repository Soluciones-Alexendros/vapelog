import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coils } from "./catalog.ts";
import {
  TABLE_KEYS,
  buildFacets,
  hasDraw,
  matchResult,
  matchingVariantIds,
  matches,
  query,
} from "./search.ts";
import type { Liquid } from "./types.ts";

describe("búsqueda por característica", () => {
  it("no confunde DL con RDL", () => {
    assert.equal(hasDraw("MTL y RDL, según la cápsula", "DL"), false);
    assert.equal(hasDraw("MTL y RDL, según la cápsula", "RDL"), true);
    assert.equal(hasDraw("DL", "DL"), true);
  });

  it("cruza resistencia integrada con una marca real", () => {
    const hits = query("coil", { familia: "capsula", marca: "vaporesso" });
    assert.ok(hits.length > 0);
    assert.ok(
      hits.every(
        (item) =>
          item.domain === "coil" && item.familyId === "capsula" && item.brandId === "vaporesso",
      ),
    );
  });

  it("una marca ausente no fabrica resultados", () => {
    const hits = coils.filter((coil) => matches(coil, { familia: "capsula", marca: "bubu" }));
    assert.equal(hits.length, 0);
  });

  it("elige una marca y sigue contando las demás", () => {
    const facets = buildFacets("coil", { familia: "capsula", marca: "vaporesso" });
    const marcas = facets.find((facet) => facet.key === "marca");
    const oxva = marcas?.options.find((option) => option.id === "oxva");
    const expected = coils.filter(
      (coil) => coil.familyId === "capsula" && coil.brandId === "oxva",
    ).length;
    assert.equal(oxva?.count, expected);
    assert.ok(expected > 0);
  });

  it("suma tanque, DL y malla", () => {
    const hits = query("coil", { familia: "tanque", calada: "DL", hilo: "malla" });
    assert.ok(hits.length > 0);
    assert.ok(
      hits.every(
        (item) =>
          item.domain === "coil" &&
          item.familyId === "tanque" &&
          item.draws.includes("DL") &&
          /malla|mesh/i.test(
            `${item.wireKind ?? ""} ${item.wireMaterial ?? ""} ${item.build ?? ""}`,
          ),
      ),
    );
  });
});

describe("filtros de líquido por variación", () => {
  it("encuentra un líquido por su género", () => {
    const hits = query("liquid", { genero: "sales" });
    assert.ok(hits.length > 0);
    assert.ok(hits.every((item) => item.domain === "liquid" && item.genreId === "sales"));
  });

  it("encuentra un líquido si alguna variación tiene nicotina", () => {
    const hits = query("liquid", { tieneNicotina: true });
    assert.ok(hits.length > 0);
    assert.ok(
      hits.every(
        (item) =>
          item.domain === "liquid" &&
          item.variations.some(
            (variation) => variation.nicotineMgPerMl != null && variation.nicotineMgPerMl > 0,
          ),
      ),
    );
  });

  it("Abarra freebase aparece en sin nicotina por su variante a 0 mg/ml", () => {
    const hits = query("liquid", { tieneNicotina: false });
    const abarra = hits.find((item) => item.slug === "herrera-abarra-freebase");
    assert.ok(abarra && abarra.domain === "liquid");
    if (!abarra || abarra.domain !== "liquid") return;
    const ids = matchingVariantIds(abarra, { tieneNicotina: false });
    assert.ok(ids.some((id) => id.includes("-libre-0") || id.includes("0")));
    const zero = abarra.variations.find((variation) => ids.includes(variation.id));
    assert.ok(zero && zero.nicotineMgPerMl === 0);
  });

  it("filtros de nicotina y ratio se evalúan en la misma variante", () => {
    const liquid: Liquid = {
      domain: "liquid",
      id: "cruce-imposible",
      slug: "cruce-imposible",
      archiveId: "TEST-CRUCE",
      brandId: "test",
      name: "Cruce",
      genreId: "freebase",
      line: "test",
      summary: "Fixture de filtros cruzados.",
      confidence: "ficha",
      sources: [],
      caveats: [],
      tags: [],
      status: "referenciado",
      flavorIds: [],
      draws: ["MTL"],
      variations: [
        {
          id: "zero-5050",
          label: "0 mg · 50/50",
          fillVolumeMl: 10,
          containerCapacityMl: 10,
          nicotineMgPerMl: 0,
          ratioVgPct: 50,
          ratioPgPct: 50,
        },
        {
          id: "nic-7030",
          label: "12 mg · 70/30",
          fillVolumeMl: 10,
          containerCapacityMl: 10,
          nicotineMgPerMl: 12,
          ratioVgPct: 70,
          ratioPgPct: 30,
        },
      ],
    };
    assert.equal(matches(liquid, { tieneNicotina: false, ratio: "70/30" }), false);
    assert.deepEqual(matchingVariantIds(liquid, { tieneNicotina: false, ratio: "70/30" }), []);
    assert.deepEqual(matchingVariantIds(liquid, { tieneNicotina: false, ratio: "50/50" }), [
      "zero-5050",
    ]);
    const result = matchResult(liquid, { tieneNicotina: false, ratio: "50/50" });
    assert.equal(result.matches, true);
    assert.deepEqual(result.matchingVariantIds, ["zero-5050"]);
  });

  it("la faceta de ratio sale de la unión de variaciones", () => {
    const facets = buildFacets("liquid", {});
    const ratio = facets.find((facet) => facet.key === "ratio");
    assert.ok(ratio && ratio.options.length > 0);
    assert.ok(ratio.options.every((option) => /^\d+\/\d+$/.test(option.id)));
  });

  it("la faceta de género sale de liquidGenres y sustituye a familia", () => {
    const facets = buildFacets("liquid", {});
    assert.equal(
      facets.find((facet) => facet.key === "familia"),
      undefined,
    );
    assert.equal(
      facets.find((facet) => facet.key === "sub"),
      undefined,
    );
    const genero = facets.find((facet) => facet.key === "genero");
    assert.ok(genero && genero.options.length > 0);
  });

  it("la tabla de líquidos usa las claves de la v3", () => {
    assert.deepEqual(TABLE_KEYS.liquid, [
      "genre",
      "volume_ml",
      "has_nicotine",
      "nicotine_mg",
      "draw",
      "tpd",
    ]);
  });
});

describe("faceta de hilo", () => {
  it("el hilo regular cuenta como alambre", () => {
    const hits = query("coil", { hilo: "alambre" });
    assert.ok(hits.some((item) => item.slug === "voopoo-pnp-r1"));
  });

  it("la cerámica CCELL es su propia clase y solo la GT la usa", () => {
    const hits = query("coil", { hilo: "ceramica" });
    assert.deepEqual(hits.map((item) => item.slug).sort(), [
      "vaporesso-gt-ccell-0-3",
      "vaporesso-gt-ccell-0-5",
    ]);
  });

  it("la faceta Hilo publica Cerámica con su recuento", () => {
    const facets = buildFacets("coil", {});
    const hilo = facets.find((facet) => facet.key === "hilo");
    const ceramica = hilo?.options.find((option) => option.id === "ceramica");
    assert.equal(ceramica?.label, "Cerámica");
    assert.equal(ceramica?.count, 2);
  });
});
