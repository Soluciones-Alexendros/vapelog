import type { LiquidVariation, Ratio } from "./types.ts";

const UNPUBLISHED = /no publicad|sin dato|no fijad|leer la etiqueta/i;

export function publishedText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || UNPUBLISHED.test(trimmed)) return null;
  return trimmed;
}

/** Etiqueta VG/PG derivada de porcentajes numéricos (primer número = VG). */
export function formatRatioLabel(
  vgPct: number | null | undefined,
  pgPct: number | null | undefined,
): Ratio | null {
  if (vgPct == null || pgPct == null) return null;
  if (!Number.isFinite(vgPct) || !Number.isFinite(pgPct)) return null;
  return `${vgPct}/${pgPct}` as Ratio;
}

export function ratioPartsFromVariation(
  variation: Pick<LiquidVariation, "ratioVgPct" | "ratioPgPct">,
): { vg: number; pg: number } | null {
  return formatRatioParts(variation.ratioVgPct, variation.ratioPgPct);
}

export function formatRatioParts(
  vgPct: number | null | undefined,
  pgPct: number | null | undefined,
): { vg: number; pg: number } | null {
  if (vgPct == null || pgPct == null) return null;
  if (!Number.isFinite(vgPct) || !Number.isFinite(pgPct)) return null;
  return { vg: vgPct, pg: pgPct };
}

/** Parsea una etiqueta VG/PG de consulta (`70/30` → VG 70, PG 30). */
export function ratioParts(ratio: Ratio | null | undefined): { vg: number; pg: number } | null {
  if (!ratio) return null;
  const match = ratio.match(/^\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)\s*$/);
  if (!match) return null;
  const vg = Number(match[1]!.replace(",", "."));
  const pg = Number(match[2]!.replace(",", "."));
  if (!Number.isFinite(vg) || !Number.isFinite(pg)) return null;
  return { vg, pg };
}

export const ohmBands = [
  { id: "baja" as const, label: "Menos de 0,4 Ω", min: 0, maxExclusive: 0.4 },
  { id: "media" as const, label: "0,4 a 0,8 Ω", min: 0.4, maxExclusive: 0.8 },
  { id: "alta" as const, label: "0,8 a 1,2 Ω", min: 0.8, maxExclusive: 1.2 },
  { id: "muy" as const, label: "1,2 Ω o más", min: 1.2, maxExclusive: Infinity },
];

export const powerBands = [
  { id: "baja" as const, label: "Hasta 30 W", max: 30 },
  { id: "media" as const, label: "De 31 a 80 W", max: 80 },
  { id: "alta" as const, label: "Más de 80 W", max: Infinity },
];

export function ohmBandId(ohms: number): (typeof ohmBands)[number]["id"] {
  return ohmBands.find((band) => ohms >= band.min && ohms < band.maxExclusive)?.id ?? "muy";
}

export function powerBandId(powerMaxW: number): (typeof powerBands)[number]["id"] {
  if (powerMaxW <= 30) return "baja";
  if (powerMaxW <= 80) return "media";
  return "alta";
}
