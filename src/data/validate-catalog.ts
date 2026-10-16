import { brands, coils, devices, liquids, parts, platforms, taxa } from "./catalog.ts";
import type { CatalogItem, Domain, Taxon } from "./types.ts";

export type CatalogIssueSeverity = "error" | "warning";

export interface CatalogIssue {
  severity: CatalogIssueSeverity;
  code: string;
  message: string;
  path?: string;
}

function allItems(): CatalogItem[] {
  return [...devices, ...coils, ...liquids, ...parts];
}

function taxonAncestors(id: string, byId: Map<string, Taxon>): string[] {
  const seen = new Set<string>();
  const chain: string[] = [];
  let current: string | null = id;
  while (current) {
    if (seen.has(current)) {
      chain.push(current);
      break;
    }
    seen.add(current);
    chain.push(current);
    current = byId.get(current)?.parentId ?? null;
  }
  return chain;
}

/** Validación pura de integridad del catálogo en archivos (ADR-0011). */
export function validateCatalog(): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const items = allItems();
  const ids = new Map<string, Domain>();
  const slugs = new Map<string, Domain>();
  const brandIds = new Set(brands.map((brand) => brand.id));
  const platformIds = new Set(platforms.map((platform) => platform.id));
  const taxonById = new Map(taxa.map((taxon) => [taxon.id, taxon]));

  for (const item of items) {
    if (ids.has(item.id)) {
      issues.push({
        severity: "error",
        code: "duplicate_id",
        message: `ID duplicado: ${item.id}`,
        path: `${item.domain}/${item.slug}`,
      });
    } else {
      ids.set(item.id, item.domain);
    }
    const slugKey = `${item.domain}:${item.slug}`;
    if (slugs.has(slugKey)) {
      issues.push({
        severity: "error",
        code: "duplicate_slug",
        message: `Slug duplicado en ${item.domain}: ${item.slug}`,
        path: slugKey,
      });
    } else {
      slugs.set(slugKey, item.domain);
    }
    if (!brandIds.has(item.brandId)) {
      issues.push({
        severity: "error",
        code: "broken_brand",
        message: `Marca inexistente: ${item.brandId}`,
        path: `${item.domain}/${item.slug}`,
      });
    }
    if (item.familyId && !taxonById.has(item.familyId)) {
      issues.push({
        severity: "error",
        code: "broken_taxon",
        message: `Taxón familia inexistente: ${item.familyId}`,
        path: `${item.domain}/${item.slug}`,
      });
    }
    if (item.subId && !taxonById.has(item.subId)) {
      issues.push({
        severity: "error",
        code: "broken_taxon",
        message: `Taxón sub inexistente: ${item.subId}`,
        path: `${item.domain}/${item.slug}`,
      });
    }
  }

  for (const taxon of taxa) {
    const chain = taxonAncestors(taxon.id, taxonById);
    if (chain.length !== new Set(chain).size) {
      issues.push({
        severity: "error",
        code: "taxon_cycle",
        message: `Ciclo taxonómico en ${taxon.id}`,
        path: `taxon/${taxon.id}`,
      });
    }
    if (taxon.parentId && !taxonById.has(taxon.parentId)) {
      issues.push({
        severity: "error",
        code: "broken_taxon_parent",
        message: `Padre inexistente ${taxon.parentId} para ${taxon.id}`,
        path: `taxon/${taxon.id}`,
      });
    }
  }

  for (const liquid of liquids) {
    for (const variation of liquid.variations) {
      const path = `liquid/${liquid.slug}#${variation.id}`;
      if (variation.nicotineMgPerMl != null && !Number.isFinite(variation.nicotineMgPerMl)) {
        issues.push({
          severity: "error",
          code: "invalid_nicotine",
          message: "nicotineMgPerMl no finito",
          path,
        });
      }
      if (
        variation.fillVolumeMl === variation.containerCapacityMl &&
        variation.preparedVolumeMl != null &&
        variation.preparedVolumeMl !== variation.fillVolumeMl &&
        !variation.recipe &&
        !variation.conflictNotes?.length
      ) {
        issues.push({
          severity: "warning",
          code: "prepared_without_recipe",
          message: "preparedVolumeMl sin receta ni conflicto documentado",
          path,
        });
      }
      if (
        variation.fillVolumeMl > 0 &&
        variation.containerCapacityMl > 0 &&
        variation.fillVolumeMl === variation.containerCapacityMl &&
        /longfill|aroma concentrado|10 ml de aroma/i.test(
          `${variation.bottle ?? ""} ${variation.composition?.note ?? ""}`,
        ) &&
        !variation.conflictNotes?.length
      ) {
        issues.push({
          severity: "warning",
          code: "volume_semantics",
          message:
            "Texto de longfill/aroma con fillVolumeMl === containerCapacityMl; revisar semántica de volúmenes",
          path,
        });
      }
    }
  }

  for (const device of devices) {
    for (const id of [...device.platformIds, ...device.kitPlatformIds]) {
      if (!platformIds.has(id)) {
        issues.push({
          severity: "error",
          code: "broken_platform",
          message: `Plataforma inexistente: ${id}`,
          path: `device/${device.slug}`,
        });
      }
    }
  }
  for (const coil of coils) {
    for (const id of coil.platformIds) {
      if (!platformIds.has(id)) {
        issues.push({
          severity: "error",
          code: "broken_platform",
          message: `Plataforma inexistente: ${id}`,
          path: `coil/${coil.slug}`,
        });
      }
    }
  }

  return issues;
}

export function catalogErrors(): CatalogIssue[] {
  return validateCatalog().filter((issue) => issue.severity === "error");
}
