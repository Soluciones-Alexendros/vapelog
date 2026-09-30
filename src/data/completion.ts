import { defsFor, type SpecDef } from "./spec-def.ts";
import { hasCatalogPhoto } from "./images.ts";
import type { CatalogItem } from "./types.ts";

export interface CompletionGap {
  key: string;
  label: string;
}

export interface Completion {
  pct: number;
  filled: number;
  total: number;
  missing: CompletionGap[];
  hasPhoto: boolean;
  hasSource: boolean;
}

export function specApplies(item: CatalogItem, def: SpecDef): boolean {
  if (def.domain !== item.domain) return false;
  if (item.domain === "device") {
    if (def.key === "cell") return item.batteryKind === "externa";
    if (def.key === "battery_mah") return item.batteryKind === "integrada";
  }
  if (item.domain === "liquid" && def.key === "nicotine_mg") {
    return item.variations.some((variation) => variation.hasNicotine);
  }
  if (item.domain === "part") {
    if (def.key === "drip_mm") return item.familyId === "boquilla";
    if (def.key === "chemistry" || def.key === "amps") return item.familyId === "bateria";
    if (def.key === "fits_battery") return item.familyId === "bateria";
    if (def.key === "fits_connector") return item.fitsConnector != null;
  }
  return true;
}

export function completion(item: CatalogItem): Completion {
  const defs = defsFor(item.domain).filter((def) => specApplies(item, def));
  const missing: CompletionGap[] = [];
  let filledSpecs = 0;
  for (const def of defs) {
    const value = def.read(item);
    if (value != null && value.trim() !== "") filledSpecs += 1;
    else missing.push({ key: def.key, label: def.label });
  }
  const hasPhoto = hasCatalogPhoto(item.slug);
  const hasSource = item.sources.length > 0;
  if (!hasPhoto) missing.push({ key: "photo", label: "Foto" });
  if (!hasSource) missing.push({ key: "source", label: "Fuente" });
  const filled = filledSpecs + (hasPhoto ? 1 : 0) + (hasSource ? 1 : 0);
  const total = defs.length + 2;
  return {
    pct: total === 0 ? 0 : Math.round((100 * filled) / total),
    filled,
    total,
    missing,
    hasPhoto,
    hasSource,
  };
}
