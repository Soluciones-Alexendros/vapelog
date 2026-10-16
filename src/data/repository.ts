/**
 * Repositorio de lectura independiente del almacenamiento (fase 8).
 * Hoy lee el catálogo en archivos; la UI y las reglas no deben acoplarse
 * a la forma concreta de importación.
 */
import {
  brandById,
  coils,
  deviceBySlug,
  devices,
  liquids,
  parts,
  platformById,
  taxa,
} from "./catalog.ts";
import { evaluateCompatibility } from "./compat-evaluation.ts";
import { projectCoil, projectDevice, projectPart } from "./entities.ts";
import { matchingVariantIds, matches, type CatalogSearch } from "./search.ts";
import type { CatalogItem, Coil, Device, Domain, Liquid, Part } from "./types.ts";
import { CATALOG_REVISION, SCHEMA_VERSION } from "./types.ts";

export interface ListDto {
  id: string;
  slug: string;
  domain: Domain;
  name: string;
  brandName: string;
  summary: string;
}

export interface SheetDto {
  item: CatalogItem;
  brandName: string;
  matchingVariantIds?: string[];
}

export interface EvaluationDto {
  deviceSlug: string;
  coilSlug: string;
  evaluation: ReturnType<typeof evaluateCompatibility>;
}

export interface CatalogRepository {
  schemaVersion: typeof SCHEMA_VERSION;
  catalogRevision: typeof CATALOG_REVISION;
  list(domain: Domain, search?: CatalogSearch, limit?: number): ListDto[];
  getBySlug(domain: Domain, slug: string): SheetDto | null;
  evaluate(deviceSlug: string, coilSlug: string): EvaluationDto | null;
  indexes(): {
    byId: Map<string, CatalogItem>;
    bySlug: Map<string, CatalogItem>;
    byPlatform: Map<string, CatalogItem[]>;
  };
}

const MAX_LIST = 500;
const MAX_QUERY_LEN = 120;

function clampSearch(search: CatalogSearch = {}): CatalogSearch {
  if (search.q && search.q.length > MAX_QUERY_LEN) {
    return { ...search, q: search.q.slice(0, MAX_QUERY_LEN) };
  }
  return search;
}

function toListDto(item: CatalogItem): ListDto {
  return {
    id: item.id,
    slug: item.slug,
    domain: item.domain,
    name: item.name,
    brandName: brandById(item.brandId)?.name ?? item.brandId,
    summary: item.summary,
  };
}

function itemsFor(domain: Domain): CatalogItem[] {
  if (domain === "device") return devices;
  if (domain === "coil") return coils;
  if (domain === "liquid") return liquids;
  return parts;
}

function buildIndexes() {
  const byId = new Map<string, CatalogItem>();
  const bySlug = new Map<string, CatalogItem>();
  const byPlatform = new Map<string, CatalogItem[]>();
  for (const item of [...devices, ...coils, ...liquids, ...parts]) {
    byId.set(item.id, item);
    bySlug.set(`${item.domain}:${item.slug}`, item);
    const platformIds =
      item.domain === "device"
        ? [...item.platformIds, ...item.kitPlatformIds]
        : item.domain === "coil"
          ? item.platformIds
          : item.domain === "part"
            ? item.fitsPlatformIds
            : [];
    for (const platformId of platformIds) {
      const bucket = byPlatform.get(platformId) ?? [];
      bucket.push(item);
      byPlatform.set(platformId, bucket);
    }
  }
  return { byId, bySlug, byPlatform };
}

let cachedIndexes: ReturnType<typeof buildIndexes> | null = null;

export const fileCatalogRepository: CatalogRepository = {
  schemaVersion: SCHEMA_VERSION,
  catalogRevision: CATALOG_REVISION,
  list(domain, search = {}, limit = MAX_LIST) {
    const safe = clampSearch(search);
    const capped = Math.min(Math.max(1, limit), MAX_LIST);
    return itemsFor(domain)
      .filter((item) => matches(item, safe))
      .slice(0, capped)
      .map(toListDto);
  },
  getBySlug(domain, slug) {
    const item = itemsFor(domain).find((row) => row.slug === slug);
    if (!item) return null;
    const dto: SheetDto = {
      item,
      brandName: brandById(item.brandId)?.name ?? item.brandId,
    };
    if (item.domain === "liquid") {
      dto.matchingVariantIds = matchingVariantIds(item, {});
    }
    return dto;
  },
  evaluate(deviceSlug, coilSlug) {
    const device = deviceBySlug(deviceSlug);
    const coil = coils.find((row) => row.slug === coilSlug);
    if (!device || !coil) return null;
    return {
      deviceSlug,
      coilSlug,
      evaluation: evaluateCompatibility(device, coil),
    };
  },
  indexes() {
    cachedIndexes ??= buildIndexes();
    return cachedIndexes;
  },
};

export function projectForPhysicalBrowse(domain: Domain): unknown[] {
  if (domain === "device") return devices.map(projectDevice);
  if (domain === "coil") return coils.map(projectCoil);
  if (domain === "part") return parts.map(projectPart);
  return liquids;
}

export function platformLabel(id: string): string {
  return platformById(id)?.name ?? id;
}

export function taxonCount(): number {
  return taxa.length;
}

export type { Device, Coil, Liquid, Part };
