import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  brands,
  coils,
  devices,
  liquidBySlug,
  liquids,
  parts,
  platforms,
  taxa,
} from "./catalog.ts";
import { catalogErrors, validateCatalog, type CatalogSnapshot } from "./validate-catalog.ts";

function snapshot(overrides: Partial<CatalogSnapshot> = {}): CatalogSnapshot {
  return {
    devices,
    coils,
    liquids,
    parts,
    brands,
    platforms,
    taxa,
    ...overrides,
  };
}

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

  it("VAL-013-01: fixture con rango invertido y FK rota", () => {
    const base = devices[0]!;
    const broken = snapshot({
      devices: [
        {
          ...base,
          id: "dup-test-device",
          slug: "dup-test-device",
          archiveId: "DUP-ARCH",
          powerMinW: 80,
          powerMaxW: 40,
          platformIds: ["plataforma-inexistente-xyz"],
        },
        { ...base, id: "dup-test-device-2", slug: "dup-test-device-2", archiveId: "DUP-ARCH" },
      ],
    });
    const errors = catalogErrors(broken);
    assert.ok(errors.some((issue) => issue.code === "inverted_power_range"));
    assert.ok(errors.some((issue) => issue.code === "broken_platform"));
    assert.ok(errors.some((issue) => issue.code === "duplicate_archive_id"));
  });
});
