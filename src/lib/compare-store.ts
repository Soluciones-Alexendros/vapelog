import type { Domain } from "../data/types.ts";

export type CompareRefLike = {
  domain: Domain;
  slug: string;
};

/** Search tipado de `/comparar` (validateSearch). */
export type CompareRouteSearch = {
  dominio?: Domain;
  fichas?: string;
};

export type ParsedCompareSearch = {
  items: CompareRefLike[];
  /** Slugs únicos de la URL que no existen en el catálogo. */
  discarded: number;
  /** Había `dominio` + `fichas` en la query (intención de selección por URL). */
  hasUrlIntent: boolean;
};

const DOMAINS: ReadonlySet<string> = new Set(["device", "coil", "liquid", "part"]);

function asDomain(value: unknown): Domain | undefined {
  return value === "device" || value === "coil" || value === "liquid" || value === "part"
    ? value
    : undefined;
}

export function slugExistsInCatalog(
  domain: Domain,
  slug: string,
  lookup: {
    device: (slug: string) => unknown;
    coil: (slug: string) => unknown;
    liquid: (slug: string) => unknown;
    part: (slug: string) => unknown;
  },
): boolean {
  if (domain === "device") return lookup.device(slug) != null;
  if (domain === "coil") return lookup.coil(slug) != null;
  if (domain === "liquid") return lookup.liquid(slug) != null;
  return lookup.part(slug) != null;
}

/**
 * Descarta formas inválidas, slugs ausentes, duplicados y un segundo dominio.
 * Se queda con el dominio del primer elemento válido. Tope de 4.
 */
export function sanitizeCompare(
  raw: unknown,
  exists: (domain: Domain, slug: string) => boolean,
): CompareRefLike[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  let domain: Domain | null = null;
  const out: CompareRefLike[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as { domain?: unknown; slug?: unknown };
    if (typeof candidate.domain !== "string" || typeof candidate.slug !== "string") continue;
    if (!DOMAINS.has(candidate.domain)) continue;
    const nextDomain = candidate.domain as Domain;
    if (!exists(nextDomain, candidate.slug)) continue;
    if (domain === null) domain = nextDomain;
    if (nextDomain !== domain) continue;
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    out.push({ domain: nextDomain, slug: candidate.slug });
    if (out.length >= 4) break;
  }
  return out;
}

/** Solo persistir tras restaurar la selección hidratada. */
export function shouldPersistCompare(hydrated: boolean): boolean {
  return hydrated;
}

export function parseCompareJson(
  raw: string | null,
  exists: (domain: Domain, slug: string) => boolean,
): CompareRefLike[] {
  if (!raw) return [];
  try {
    return sanitizeCompare(JSON.parse(raw) as unknown, exists);
  } catch {
    return [];
  }
}

/** Normaliza la search de `/comparar` sin consultar el catálogo. */
export function validateCompareRouteSearch(search: Record<string, unknown>): CompareRouteSearch {
  const dominio = asDomain(search.dominio);
  const fichas =
    typeof search.fichas === "string" && search.fichas.length > 0 ? search.fichas : undefined;
  const out: CompareRouteSearch = {};
  if (dominio) out.dominio = dominio;
  if (fichas) out.fichas = fichas;
  return out;
}

/**
 * Parseo puro junto a `sanitizeCompare`: dominio + fichas separadas por coma.
 * Descarta desconocidos, duplicados, dominio distinto y el quinto en adelante.
 */
export function parseCompareSearch(
  search: Record<string, unknown> | CompareRouteSearch,
  exists: (domain: Domain, slug: string) => boolean,
): ParsedCompareSearch {
  const validated = validateCompareRouteSearch(search as Record<string, unknown>);
  const hasUrlIntent = Boolean(validated.dominio && validated.fichas);
  if (!validated.dominio || !validated.fichas) {
    return { items: [], discarded: 0, hasUrlIntent: false };
  }
  const domain = validated.dominio;
  const slugs = validated.fichas
    .split(",")
    .map((part) => part.trim())
    .filter((slug) => slug.length > 0);
  const unique = [...new Set(slugs)];
  let discarded = 0;
  for (const slug of unique) {
    if (!exists(domain, slug)) discarded += 1;
  }
  const items = sanitizeCompare(
    slugs.map((slug) => ({ domain, slug })),
    exists,
  );
  return { items, discarded, hasUrlIntent };
}

/** Search canónica solo con slugs públicos ya sanitizados. */
export function compareSearchFromItems(items: readonly CompareRefLike[]): CompareRouteSearch {
  if (items.length === 0) return {};
  const domain = items[0]?.domain;
  if (!domain) return {};
  return {
    dominio: domain,
    fichas: items.map((item) => item.slug).join(","),
  };
}

export function sameCompareSearch(a: CompareRouteSearch, b: CompareRouteSearch): boolean {
  return (a.dominio ?? "") === (b.dominio ?? "") && (a.fichas ?? "") === (b.fichas ?? "");
}
