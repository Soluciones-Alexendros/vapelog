import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deviceBySlug } from "./catalog.ts";
import {
  deriveTaxonLabels,
  sensoryFreshnessFromFlavorIds,
  splitActivationAndModes,
  wireGeometryLabel,
} from "./taxonomy.ts";

describe("taxonomías", () => {
  it("deriva ancestros de un taxón de cápsula", () => {
    const labels = deriveTaxonLabels("capsula.xros");
    assert.ok(labels.length >= 1);
  });

  it("separa activación de modos", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    assert.ok(device);
    const split = splitActivationAndModes({
      ...device!,
      modes: ["Calada o botón", "VW", "Bypass"],
    });
    assert.deepEqual(split.activation, ["Calada o botón"]);
    assert.deepEqual(split.modes, ["VW", "Bypass"]);
  });

  it("no reduce triple malla a malla simple", () => {
    assert.equal(wireGeometryLabel("malla", 3), "Triple malla");
    assert.equal(wireGeometryLabel("doble-malla"), "Doble malla");
  });

  it("frescor no es la nota menta", () => {
    assert.equal(sensoryFreshnessFromFlavorIds(["menta"]), null);
    assert.equal(sensoryFreshnessFromFlavorIds(["menta.frio"]), true);
  });
});
