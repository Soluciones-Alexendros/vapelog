import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  brands,
  coils,
  devices,
  liquidBySlug,
  liquidGenres,
  liquids,
  parts,
  platforms,
  taxa,
} from "./catalog.ts";
import type { Liquid, Part } from "./types.ts";
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
    liquidGenres,
    ...overrides,
  };
}

function expectCode(sn: CatalogSnapshot, code: string): void {
  const errors = catalogErrors(sn);
  assert.ok(
    errors.some((issue) => issue.code === code),
    `Se esperaba código ${code}; obtuvo: ${errors.map((i) => i.code).join(", ") || "(ninguno)"}`,
  );
}

function baseLiquid(slug = "fixture-liquid"): Liquid {
  const template = liquids[0]!;
  return {
    ...template,
    id: slug,
    slug,
    archiveId: `ARCH-${slug}`,
    variations: [
      {
        ...template.variations[0]!,
        id: `${slug}-var`,
      },
    ],
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

  describe("VAL-013 invariantes (una fixture por regla)", () => {
    it("duplicate_brand_id", () => {
      const brand = brands[0]!;
      expectCode(
        snapshot({ brands: [brand, { ...brand, name: "Duplicado" }] }),
        "duplicate_brand_id",
      );
    });

    it("duplicate_platform_id", () => {
      const platform = platforms[0]!;
      expectCode(
        snapshot({ platforms: [platform, { ...platform, name: "Duplicado" }] }),
        "duplicate_platform_id",
      );
    });

    it("duplicate_taxon_id", () => {
      const taxon = taxa.find((row) => row.domain === "device")!;
      expectCode(snapshot({ taxa: [taxon, { ...taxon, es: "Duplicado" }] }), "duplicate_taxon_id");
    });

    it("duplicate_genre_id", () => {
      const genre = liquidGenres[0]!;
      expectCode(
        snapshot({ liquidGenres: [genre, { ...genre, es: "Duplicado" }] }),
        "duplicate_genre_id",
      );
    });

    it("incomplete_ratio", () => {
      const liquid = baseLiquid("incomplete-ratio");
      liquid.variations[0]!.ratioVgPct = 50;
      liquid.variations[0]!.ratioPgPct = null;
      expectCode(snapshot({ liquids: [liquid] }), "incomplete_ratio");
    });

    it("invalid_ratio_bound", () => {
      const liquid = baseLiquid("invalid-ratio-bound");
      liquid.variations[0]!.ratioVgPct = 150;
      liquid.variations[0]!.ratioPgPct = -50;
      expectCode(snapshot({ liquids: [liquid] }), "invalid_ratio_bound");
    });

    it("invalid_ratio_sum", () => {
      const liquid = baseLiquid("invalid-ratio-sum");
      liquid.variations[0]!.ratioVgPct = 70;
      liquid.variations[0]!.ratioPgPct = 70;
      expectCode(snapshot({ liquids: [liquid] }), "invalid_ratio_sum");
    });

    it("invalid_volume", () => {
      const liquid = baseLiquid("invalid-volume");
      liquid.variations[0]!.fillVolumeMl = 0;
      expectCode(snapshot({ liquids: [liquid] }), "invalid_volume");
    });

    it("volume_exceeds_capacity", () => {
      const liquid = baseLiquid("volume-overflow");
      liquid.variations[0]!.fillVolumeMl = 12;
      liquid.variations[0]!.containerCapacityMl = 10;
      expectCode(snapshot({ liquids: [liquid] }), "volume_exceeds_capacity");
    });

    it("broken_genre", () => {
      const liquid = baseLiquid("broken-genre");
      liquid.genreId = "genero-inexistente";
      expectCode(snapshot({ liquids: [liquid] }), "broken_genre");
    });

    it("broken_flavor", () => {
      const liquid = baseLiquid("broken-flavor");
      liquid.flavorIds = ["pod"];
      expectCode(snapshot({ liquids: [liquid] }), "broken_flavor");
    });

    it("broken_part_platform", () => {
      const part = parts[0] as Part;
      const broken: Part = {
        ...part,
        id: "part-fixture-platform",
        slug: "part-fixture-platform",
        archiveId: "ARCH-PART-FIX",
        fitsPlatformIds: ["plataforma-inexistente-xyz"],
      };
      expectCode(snapshot({ parts: [broken] }), "broken_part_platform");
    });

    it("taxon_family_domain_mismatch", () => {
      const device = devices[0]!;
      expectCode(
        snapshot({
          devices: [
            {
              ...device,
              id: "family-domain-mismatch",
              slug: "family-domain-mismatch",
              archiveId: "ARCH-FAM-DOM",
              familyId: "tanque",
            },
          ],
        }),
        "taxon_family_domain_mismatch",
      );
    });

    it("taxon_sub_domain_mismatch", () => {
      const coil = coils[0]!;
      expectCode(
        snapshot({
          coils: [
            {
              ...coil,
              id: "sub-domain-mismatch",
              slug: "sub-domain-mismatch",
              archiveId: "ARCH-SUB-DOM",
              subId: "pod.abierto",
            },
          ],
        }),
        "taxon_sub_domain_mismatch",
      );
    });

    it("taxon_sub_not_descendant", () => {
      const device = devices[0]!;
      expectCode(
        snapshot({
          devices: [
            {
              ...device,
              id: "sub-not-descendant",
              slug: "sub-not-descendant",
              archiveId: "ARCH-SUB-NO-DESC",
              familyId: "pod",
              subId: "tanque.z",
            },
          ],
        }),
        "taxon_sub_not_descendant",
      );
    });
  });
});
