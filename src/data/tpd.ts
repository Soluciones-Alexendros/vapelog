import type { Liquid, TpdStatus } from "./types.ts";

/**
 * Agregador canónico de estados TPD declarados por variante.
 * Ausencia sin evidencia de inaplicabilidad → desconocido / incompleto, nunca no-aplica global.
 */
export function aggregateTpdStatuses(statuses: readonly (TpdStatus | undefined)[]): TpdStatus {
  if (statuses.length === 0) return "desconocido";

  const known: TpdStatus[] = [];
  let absent = 0;
  for (const status of statuses) {
    if (status === undefined) absent += 1;
    else known.push(status);
  }

  if (known.length === 0) return "desconocido";

  if (absent > 0) {
    const unique = new Set(known);
    return unique.size === 1 ? "incompleto" : "parcial";
  }

  const unique = new Set(known);
  if (unique.size === 1) return known[0]!;

  return "parcial";
}

export function aggregateVariationTpd(liquid: Liquid): TpdStatus {
  return aggregateTpdStatuses(liquid.variations.map((variation) => variation.tpd));
}
