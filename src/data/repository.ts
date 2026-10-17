/**
 * Repositorio de lectura independiente del almacenamiento.
 * Ordena antes de paginar; no expone Maps/objetos mutables del catálogo.
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
import { matchingVariantIds, matches, query, type CatalogSearch } from "./search.ts";
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

export interface ListPageDto {
  items: ListDto[];
  total: number;
  limit: number;
  hasMore: boolean;
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
  listPage(domain: Domain, search?: CatalogSearch, limit?: number): ListPageDto;
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

export function normalizeListLimit(limit: unknown): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || !Number.isInteger(limit)) {
    throw new TypeError("limit debe ser un entero finito");
  }
  if (limit < 1 || limit > MAX_LIST) {
    throw new RangeError(`limit fuera de rango 1..${MAX_LIST}`);
  }
  return limit;
}

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

function cloneItem<T extends CatalogItem>(item: T): T {
  return structuredClone(item);
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
    return this.listPage(domain, search, limit).items;
  },
  listPage(domain, search = {}, limit = MAX_LIST) {
    const safe = clampSearch(search);
    const capped = normalizeListLimit(limit);
    // Misma semántica de orden que search.query (VAL-016-01).
    const ordered = query(domain, safe);
    const total = ordered.length;
    const page = ordered.slice(0, capped).map(toListDto);
    return {
      items: page,
      total,
      limit: capped,
      hasMore: total > capped,
    };
  },
  getBySlug(domain, slug) {
    const item =
      domain === "device"
        ? devices.find((row) => row.slug === slug)
        : domain === "coil"
          ? coils.find((row) => row.slug === slug)
          : domain === "liquid"
            ? liquids.find((row) => row.slug === slug)
            : parts.find((row) => row.slug === slug);
    if (!item) return null;
    const copy = cloneItem(item);
    const dto: SheetDto = {
      item: copy,
      brandName: brandById(copy.brandId)?.name ?? copy.brandId,
    };
    if (copy.domain === "liquid") {
      dto.matchingVariantIds = matchingVariantIds(copy, {});
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
    // Copias superficiales de Maps para no exponer el caché mutable (VAL-016-03).
    const byId = new Map(cachedIndexes.byId);
    const bySlug = new Map(cachedIndexes.bySlug);
    const byPlatform = new Map(
      [...cachedIndexes.byPlatform.entries()].map(([key, value]) => [key, [...value]]),
    );
    return { byId, bySlug, byPlatform };
  },
};

export function projectForPhysicalBrowse(domain: Domain): unknown[] {
  if (domain === "device") return devices.map(projectDevice);
  if (domain === "coil") return coils.map(projectCoil);
  if (domain === "part") return parts.map(projectPart);
  return liquids.map((liquid) => structuredClone(liquid));
}

export function platformLabel(id: string): string {
  return platformById(id)?.name ?? id;
}

export function taxonCount(): number {
  return taxa.length;
}

export type { Device, Coil, Liquid, Part };

// Re-export matches for callers that filter via repository contract.
export { matches };
