import type { Domain } from "../data/types.ts";

export type CompareRefLike = {
  domain: Domain;
  slug: string;
};

const DOMAINS: ReadonlySet<string> = new Set(["device", "coil", "liquid", "part"]);

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
