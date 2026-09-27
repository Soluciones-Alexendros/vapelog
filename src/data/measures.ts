import type { Draw } from "./types.ts";

const UNPUBLISHED = /no publicad|sin dato|no fijad|leer la etiqueta/i;

export function publishedText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || UNPUBLISHED.test(trimmed)) return null;
  return trimmed;
}

export function parseDraws(value: string | null | undefined): Draw[] {
  const tokens = value?.toUpperCase().match(/MTL|RDL|DL/g) ?? [];
  const found: Draw[] = [];
  for (const token of tokens) {
    if ((token === "MTL" || token === "RDL" || token === "DL") && !found.includes(token))
      found.push(token);
  }
  return found;
}

export function batteryKind(value: string): "integrada" | "externa" | null {
  const text = value.toLowerCase();
  const integrated = text.includes("integrad");
  const external = text.includes("extern");
  if (integrated && !external) return "integrada";
  if (external && !integrated) return "externa";
  return null;
}

export function batteryMah(value: string): number | null {
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*mah/gi)];
  if (matches.length !== 1) return null;
  return Number(matches[0]![1]!.replace(",", "."));
}

export function cellFormat(value: string): "18650" | "21700" | null {
  const matches = value.match(/18650|21700/g) ?? [];
  const unique = [...new Set(matches)];
  if (unique.length !== 1) return null;
  return unique[0] === "21700" ? "21700" : "18650";
}

export function singleMl(value: string | null | undefined): number | null {
  if (!value) return null;
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*ml/gi)];
  if (matches.length !== 1) return null;
  return Number(matches[0]![1]!.replace(",", "."));
}

export function dimensionsMm(
  value: string | null | undefined,
): { height: number; width: number; depth: number } | null {
  if (!value) return null;
  const match = value.match(
    /(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*mm/i,
  );
  if (!match) return null;
  const [height, width, depth] = match.slice(1, 4).map((part) => Number(part!.replace(",", ".")));
  if ([height, width, depth].some((part) => part == null || Number.isNaN(part))) return null;
  return { height: height!, width: width!, depth: depth! };
}

export function weightGrams(value: string | null | undefined): number | null {
  if (!value) return null;
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
  if (matches.length !== 1) return null;
  return Number(matches[0]![1]!.replace(",", "."));
}

export function chargePort(value: string): string | null {
  if (/usb-?c/i.test(value)) return "USB-C";
  if (/micro-?usb/i.test(value)) return "Micro-USB";
  return null;
}

export function wireKind(wire: string, build: string): "malla" | "alambre" | null {
  const text = `${wire} ${build}`;
  if (/malla|mesh/i.test(text)) return "malla";
  if (/alambre|kanthal|nichrome|ni80|nicr/i.test(text)) return "alambre";
  return null;
}

export function packCount(value: string): number | null {
  const match = value.match(/(\d+)\s*(?:unidades|uds\.?|piezas)/i);
  if (!match) return null;
  return Number(match[1]);
}

export function ratioParts(ratio: "50/50" | "70/30" | null): { vg: number; pg: number } | null {
  if (ratio === "50/50") return { vg: 50, pg: 50 };
  if (ratio === "70/30") return { vg: 70, pg: 30 };
  return null;
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
