import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { liquidBySlug } from "./catalog.ts";
import { catalogErrors, validateCatalog } from "./validate-catalog.ts";

describe("validateCatalog", () => {
  it("el catálogo actual no tiene errores de integridad", () => {
    const errors = catalogErrors();
    assert.deepEqual(
      errors,
      [],
      errors.map((issue) => `${issue.code}: ${issue.message} (${issue.path})`).join("\n"),
    );
  });

  it("detecta volúmenes de longfill Herrera ya normalizados", () => {
    const aroma = liquidBySlug("herrera-abarra-aroma");
    assert.ok(aroma);
    const mini = aroma!.variations.find((variation) => variation.id.endsWith("-30"));
    assert.ok(mini);
    assert.notEqual(mini!.fillVolumeMl, mini!.containerCapacityMl);
    const issues = validateCatalog().filter(
      (issue) => issue.path?.includes("herrera-abarra-aroma") && issue.code === "volume_semantics",
    );
    assert.equal(issues.length, 0);
  });
});
