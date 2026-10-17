import { brands, coils, devices, liquids, parts, platforms, taxa } from "./catalog.ts";
import type {
  Brand,
  CatalogItem,
  Coil,
  Device,
  Domain,
  Liquid,
  Part,
  Platform,
  Taxon,
} from "./types.ts";

export type CatalogIssueSeverity = "error" | "warning";

export interface CatalogIssue {
  severity: CatalogIssueSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface CatalogSnapshot {
  devices: readonly Device[];
  coils: readonly Coil[];
  liquids: readonly Liquid[];
  parts: readonly Part[];
  brands: readonly Brand[];
  platforms: readonly Platform[];
  taxa: readonly Taxon[];
}

function defaultSnapshot(): CatalogSnapshot {
  return { devices, coils, liquids, parts, brands, platforms, taxa };
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

function allItems(snapshot: CatalogSnapshot): CatalogItem[] {
  return [...snapshot.devices, ...snapshot.coils, ...snapshot.liquids, ...snapshot.parts];
}

/** Validación pura; acepta snapshot inyectable (OBJ-013). */
export function validateCatalog(snapshot: CatalogSnapshot = defaultSnapshot()): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const items = allItems(snapshot);
  const ids = new Map<string, Domain>();
  const archiveIds = new Map<string, string>();
  const slugs = new Map<string, Domain>();
  const brandIds = new Set(snapshot.brands.map((brand) => brand.id));
  const platformIds = new Set(snapshot.platforms.map((platform) => platform.id));
  const taxonById = new Map(snapshot.taxa.map((taxon) => [taxon.id, taxon]));

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
    if (archiveIds.has(item.archiveId)) {
      issues.push({
        severity: "error",
        code: "duplicate_archive_id",
        message: `archiveId duplicado: ${item.archiveId}`,
        path: `${item.domain}/${item.slug}`,
      });
    } else {
      archiveIds.set(item.archiveId, item.id);
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

  for (const taxon of snapshot.taxa) {
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
    if (taxon.parentId) {
      const parent = taxonById.get(taxon.parentId);
      if (parent && parent.domain !== taxon.domain && parent.domain !== "flavor") {
        // flavor parents can span; device/coil/liquid/part must match
        if (taxon.domain !== "flavor") {
          issues.push({
            severity: "error",
            code: "taxon_domain_mismatch",
            message: `Dominio de taxón ${taxon.id} (${taxon.domain}) incompatible con padre ${parent.id} (${parent.domain})`,
            path: `taxon/${taxon.id}`,
          });
        }
      }
    }
  }

  for (const liquid of snapshot.liquids) {
    const variationIds = new Set<string>();
    for (const variation of liquid.variations) {
      const path = `liquid/${liquid.slug}#${variation.id}`;
      if (variationIds.has(variation.id)) {
        issues.push({
          severity: "error",
          code: "duplicate_variation_id",
          message: `Variación duplicada: ${variation.id}`,
          path,
        });
      }
      variationIds.add(variation.id);
      if (variation.nicotineMgPerMl != null && !Number.isFinite(variation.nicotineMgPerMl)) {
        issues.push({
          severity: "error",
          code: "invalid_nicotine",
          message: "nicotineMgPerMl no finito",
          path,
        });
      }
      if (
        !Number.isFinite(variation.fillVolumeMl) ||
        variation.fillVolumeMl <= 0 ||
        !Number.isFinite(variation.containerCapacityMl) ||
        variation.containerCapacityMl <= 0
      ) {
        issues.push({
          severity: "error",
          code: "invalid_volume",
          message: "Volúmenes deben ser finitos y positivos",
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

  for (const device of snapshot.devices) {
    const path = `device/${device.slug}`;
    if (
      device.powerMinW != null &&
      device.powerMaxW != null &&
      device.powerMinW > device.powerMaxW
    ) {
      issues.push({
        severity: "error",
        code: "inverted_power_range",
        message: `powerMinW (${device.powerMinW}) > powerMaxW (${device.powerMaxW})`,
        path,
      });
    }
    if (device.ohmMin != null && device.ohmMax != null && device.ohmMin > device.ohmMax) {
      issues.push({
        severity: "error",
        code: "inverted_ohm_range",
        message: `ohmMin (${device.ohmMin}) > ohmMax (${device.ohmMax})`,
        path,
      });
    }
    for (const id of [...device.platformIds, ...device.kitPlatformIds]) {
      if (!platformIds.has(id)) {
        issues.push({
          severity: "error",
          code: "broken_platform",
          message: `Plataforma inexistente: ${id}`,
          path,
        });
      }
    }
  }
  for (const coil of snapshot.coils) {
    const path = `coil/${coil.slug}`;
    if (coil.wattMin != null && coil.wattMax != null && coil.wattMin > coil.wattMax) {
      issues.push({
        severity: "error",
        code: "inverted_watt_range",
        message: `wattMin (${coil.wattMin}) > wattMax (${coil.wattMax})`,
        path,
      });
    }
    if (!Number.isFinite(coil.ohms) || coil.ohms <= 0) {
      issues.push({
        severity: "error",
        code: "invalid_ohms",
        message: "ohms debe ser finito y positivo",
        path,
      });
    }
    for (const id of coil.platformIds) {
      if (!platformIds.has(id)) {
        issues.push({
          severity: "error",
          code: "broken_platform",
          message: `Plataforma inexistente: ${id}`,
          path,
        });
      }
    }
  }

  return issues;
}

export function catalogErrors(snapshot?: CatalogSnapshot): CatalogIssue[] {
  return validateCatalog(snapshot).filter((issue) => issue.severity === "error");
}
