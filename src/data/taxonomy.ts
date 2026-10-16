/**
 * Ejes taxonómicos independientes (fase 5). Los ancestros se derivan;
 * alias conservan URLs.
 */
import { taxa } from "./catalog.ts";
import type { Device, Taxon } from "./types.ts";

export type TaxonomyAxis =
  | "entity_type"
  | "physical_format"
  | "supply"
  | "power_architecture"
  | "activation"
  | "operating_modes"
  | "output_controls"
  | "interfaces"
  | "commercial_family"
  | "aromatic_notes"
  | "sensory";

export interface TaxonomyAlias {
  obsoleteId: string;
  canonicalId: string;
  axis: TaxonomyAxis;
}

export const TAXONOMY_ALIASES: readonly TaxonomyAlias[] = [
  { obsoleteId: "capsula.pod", canonicalId: "capsula", axis: "physical_format" },
];

const taxonById = new Map(taxa.map((taxon) => [taxon.id, taxon]));

export function resolveTaxonId(id: string): string {
  const alias = TAXONOMY_ALIASES.find((entry) => entry.obsoleteId === id);
  return alias?.canonicalId ?? id;
}

export function taxonAncestors(id: string): Taxon[] {
  const resolved = resolveTaxonId(id);
  const chain: Taxon[] = [];
  const seen = new Set<string>();
  let current: string | null = resolved;
  while (current && !seen.has(current)) {
    seen.add(current);
    const taxon = taxonById.get(current);
    if (!taxon) break;
    chain.push(taxon);
    current = taxon.parentId;
  }
  return chain;
}

export function deriveTaxonLabels(id: string): string[] {
  return taxonAncestors(id).map((taxon) => taxon.es);
}

/**
 * Separa activación de modos de funcionamiento.
 * «Calada o botón» no pertenece a `modes`.
 */
export function splitActivationAndModes(device: Device): {
  activation: string[];
  modes: string[];
} {
  const activation: string[] = [];
  const modes: string[] = [];
  for (const mode of device.modes) {
    if (/calada|bot[oó]n|auto[- ]?draw|fire/i.test(mode)) {
      activation.push(mode);
    } else {
      modes.push(mode);
    }
  }
  return { activation, modes };
}

/** Frescor sensorial distinto de la nota aromática «menta». */
export function sensoryFreshnessFromFlavorIds(flavorIds: string[]): boolean | null {
  if (flavorIds.some((id) => /frio|ice|fresh|mentol/i.test(id))) return true;
  if (flavorIds.some((id) => id === "menta" || id.startsWith("menta."))) return null;
  return false;
}

export function wireGeometryLabel(
  wireKind: "malla" | "doble-malla" | "alambre" | null,
  meshCount?: 1 | 2 | 3 | 4,
): string | null {
  if (wireKind == null) return null;
  if (wireKind === "alambre") return "Alambre";
  if (wireKind === "doble-malla" || meshCount === 2) return "Doble malla";
  if (meshCount === 3) return "Triple malla";
  if (meshCount === 4) return "Cuádruple malla";
  return "Malla";
}
