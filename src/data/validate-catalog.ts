import {
  brands,
  coils,
  devices,
  liquidGenres,
  liquids,
  parts,
  platforms,
  taxa,
} from "./catalog.ts";
import type {
  Brand,
  CatalogItem,
  Coil,
  Device,
  Domain,
  Genre,
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
  liquidGenres: readonly Genre[];
}

const RATIO_SUM_TOLERANCE = 0.01;

function defaultSnapshot(): CatalogSnapshot {
  return { devices, coils, liquids, parts, brands, platforms, taxa, liquidGenres };
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

function taxonDescendsFrom(
  descendantId: string,
  ancestorId: string,
  byId: Map<string, Taxon>,
): boolean {
  if (descendantId === ancestorId) return true;
  let current: string | null = descendantId;
  const seen = new Set<string>();
  while (current) {
    if (current === ancestorId) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    current = byId.get(current)?.parentId ?? null;
  }
  return false;
}

function allItems(snapshot: CatalogSnapshot): CatalogItem[] {
  return [...snapshot.devices, ...snapshot.coils, ...snapshot.liquids, ...snapshot.parts];
}

function pushDuplicateDictionaryIssues(
  issues: CatalogIssue[],
  rows: readonly { id: string }[],
  code: string,
  pathPrefix: string,
  label: string,
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      issues.push({
        severity: "error",
        code,
        message: `${label} duplicado: ${row.id}`,
        path: `${pathPrefix}/${row.id}`,
      });
    } else {
      seen.add(row.id);
    }
  }
}

function validateVariationRatio(
  issues: CatalogIssue[],
  variation: Liquid["variations"][number],
  path: string,
): void {
  const vg = variation.ratioVgPct;
  const pg = variation.ratioPgPct;
  const hasVg = vg != null;
  const hasPg = pg != null;
  if (hasVg !== hasPg) {
    issues.push({
      severity: "error",
      code: "incomplete_ratio",
      message: "ratioVgPct y ratioPgPct deben estar ambos presentes o ambos ausentes",
      path,
    });
    return;
  }
  if (!hasVg || !hasPg) return;
  if (!Number.isFinite(vg) || vg < 0 || vg > 100 || !Number.isFinite(pg) || pg < 0 || pg > 100) {
    issues.push({
      severity: "error",
      code: "invalid_ratio_bound",
      message: "Cada porcentaje del ratio VG/PG debe ser finito y estar entre 0 y 100",
      path,
    });
    return;
  }
  if (Math.abs(vg + pg - 100) > RATIO_SUM_TOLERANCE) {
    issues.push({
      severity: "error",
      code: "invalid_ratio_sum",
      message: `La suma del ratio VG/PG debe ser 100 ±${RATIO_SUM_TOLERANCE}`,
      path,
    });
  }
}

function validateVariationVolumes(
  issues: CatalogIssue[],
  variation: Liquid["variations"][number],
  path: string,
): void {
  const { fillVolumeMl: fill, containerCapacityMl: cap } = variation;
  if (!Number.isFinite(fill) || fill <= 0 || !Number.isFinite(cap) || cap <= 0) {
    issues.push({
      severity: "error",
      code: "invalid_volume",
      message: "Volúmenes deben ser finitos y positivos",
      path,
    });
    return;
  }
  if (fill > cap) {
    issues.push({
      severity: "error",
      code: "volume_exceeds_capacity",
      message: `fillVolumeMl (${fill}) no puede superar containerCapacityMl (${cap})`,
      path,
    });
  }
}

/**
 * Validación pura; acepta snapshot inyectable (OBJ-013).
 *
 * Contrato de invariantes (VAP-06 / VAP-07):
 * - Ratio VG/PG normalizado (`ratioVgPct` / `ratioPgPct`): ambos ausentes es válido; si uno
 *   está presente, el otro también. Cada uno finito en [0, 100]. Suma 100 ±0,01. No se exige
 *   VG+PG=100 en `composition` con aroma u otros componentes.
 * - Volúmenes: finitos, positivos; contenido ≤ capacidad. Avisos de `preparedVolumeMl`/`recipe`
 *   conservan su semántica actual.
 * - Integridad: unicidad de ids en diccionarios (marcas, plataformas, taxones, géneros) antes
 *   de indexar; `genreId` en géneros de líquido; `flavorIds` en taxones `flavor`; plataformas
 *   de piezas y referencias FK; familia/sub con dominio del ítem y subtaxón descendiente.
 */
export function validateCatalog(snapshot: CatalogSnapshot = defaultSnapshot()): CatalogIssue[] {
  const issues: CatalogIssue[] = [];

  pushDuplicateDictionaryIssues(
    issues,
    snapshot.brands,
    "duplicate_brand_id",
    "brand",
    "ID de marca",
  );
  pushDuplicateDictionaryIssues(
    issues,
    snapshot.platforms,
    "duplicate_platform_id",
    "platform",
    "ID de plataforma",
  );
  pushDuplicateDictionaryIssues(
    issues,
    snapshot.taxa,
    "duplicate_taxon_id",
    "taxon",
    "ID de taxón",
  );
  pushDuplicateDictionaryIssues(
    issues,
    snapshot.liquidGenres,
    "duplicate_genre_id",
    "genre",
    "ID de género",
  );

  const genreIds = new Set(snapshot.liquidGenres.map((genre) => genre.id));
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
    } else if (item.familyId) {
      const family = taxonById.get(item.familyId)!;
      if (family.domain !== item.domain) {
        issues.push({
          severity: "error",
          code: "taxon_family_domain_mismatch",
          message: `Familia ${item.familyId} (${family.domain}) incompatible con dominio ${item.domain}`,
          path: `${item.domain}/${item.slug}`,
        });
      }
    }
    if (item.subId && !taxonById.has(item.subId)) {
      issues.push({
        severity: "error",
        code: "broken_taxon",
        message: `Taxón sub inexistente: ${item.subId}`,
        path: `${item.domain}/${item.slug}`,
      });
    } else if (item.subId) {
      const sub = taxonById.get(item.subId)!;
      if (sub.domain !== item.domain) {
        issues.push({
          severity: "error",
          code: "taxon_sub_domain_mismatch",
          message: `Subtaxón ${item.subId} (${sub.domain}) incompatible con dominio ${item.domain}`,
          path: `${item.domain}/${item.slug}`,
        });
      }
    }
    if (item.familyId && item.subId && taxonById.has(item.familyId) && taxonById.has(item.subId)) {
      if (!taxonDescendsFrom(item.subId, item.familyId, taxonById)) {
        issues.push({
          severity: "error",
          code: "taxon_sub_not_descendant",
          message: `Subtaxón ${item.subId} no desciende de familia ${item.familyId}`,
          path: `${item.domain}/${item.slug}`,
        });
      }
    }

    if (item.domain === "liquid") {
      if (!genreIds.has(item.genreId)) {
        issues.push({
          severity: "error",
          code: "broken_genre",
          message: `Género de líquido inexistente: ${item.genreId}`,
          path: `liquid/${item.slug}`,
        });
      }
      for (const flavorId of item.flavorIds) {
        const flavor = taxonById.get(flavorId);
        if (!flavor) {
          issues.push({
            severity: "error",
            code: "broken_flavor",
            message: `Taxón de sabor inexistente: ${flavorId}`,
            path: `liquid/${item.slug}`,
          });
        } else if (flavor.domain !== "flavor") {
          issues.push({
            severity: "error",
            code: "broken_flavor",
            message: `Taxón ${flavorId} no pertenece al dominio flavor`,
            path: `liquid/${item.slug}`,
          });
        }
      }
    }

    if (item.domain === "part") {
      const path = `part/${item.slug}`;
      for (const id of item.fitsPlatformIds) {
        if (!platformIds.has(id)) {
          issues.push({
            severity: "error",
            code: "broken_part_platform",
            message: `Plataforma inexistente en fitsPlatformIds: ${id}`,
            path,
          });
        }
      }
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
      validateVariationVolumes(issues, variation, path);
      validateVariationRatio(issues, variation, path);
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
