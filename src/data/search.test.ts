import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coils } from "./catalog.ts";
import { buildFacets, hasDraw, matches, query } from "./search.ts";

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
          item.draw === "DL" &&
          /malla|mesh/i.test(`${item.wire} ${item.build}`),
      ),
    );
  });
});

describe("filtros de líquido por variación", () => {
  it("encuentra un líquido si alguna variación tiene esa nicotina", () => {
    const hits = query("liquid", { nicotina: "sal" });
    assert.ok(hits.length > 0);
    assert.ok(
      hits.every(
        (item) =>
          item.domain === "liquid" &&
          item.variations.some((variation) => variation.nicotineType === "sal"),
      ),
    );
  });

  it("la faceta de ratio sale de la unión de variaciones", () => {
    const facets = buildFacets("liquid", {});
    const ratio = facets.find((facet) => facet.key === "ratio");
    assert.ok(ratio && ratio.options.length > 0);
    assert.ok(ratio.options.every((option) => /^\d+\/\d+$/.test(option.id)));
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
