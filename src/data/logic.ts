import { evaluateCompatibility, toCompatResult } from "./compat-evaluation.ts";
import { formatRatioLabel, ratioPartsFromVariation } from "./measures.ts";
import type {
  Coil,
  CompatResult,
  Device,
  Draw,
  Liquid,
  LiquidVariation,
  Part,
  Ratio,
  TpdStatus,
} from "./types";

export function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export interface OhmInput {
  ohms: number;
  watts?: number;
  volts?: number;
}

export interface OhmResult {
  volts: number;
  amps: number;
  watts: number;
  ohms: number;
}

export function solveOhm(input: OhmInput): OhmResult | { error: string } {
  if (!(input.ohms > 0) || !Number.isFinite(input.ohms)) {
    return { error: "La resistencia tiene que ser mayor que 0 Ω." };
  }
  if (input.watts != null && input.volts != null) {
    return { error: "Indica potencia o voltaje, no los dos." };
  }
  if (input.watts != null) {
    if (!(input.watts > 0) || !Number.isFinite(input.watts)) {
      return { error: "La potencia tiene que ser mayor que 0 W." };
    }
    const amps = Math.sqrt(input.watts / input.ohms);
    const volts = amps * input.ohms;
    return { volts, amps, watts: input.watts, ohms: input.ohms };
  }
  if (input.volts != null) {
    if (!(input.volts > 0) || !Number.isFinite(input.volts)) {
      return { error: "El voltaje tiene que ser mayor que 0 V." };
    }
    const amps = input.volts / input.ohms;
    const watts = input.volts * amps;
    return { volts: input.volts, amps, watts, ohms: input.ohms };
  }
  return { error: "Añade potencia o voltaje además de la resistencia." };
}

export type WindowStatus = "inside" | "outside" | "unknown";

export interface PowerNotesResult {
  power: WindowStatus;
  ohms: WindowStatus;
  notes: string[];
}

function dimensionStatus(value: number, min: number | null, max: number | null): WindowStatus {
  const hasMin = min != null;
  const hasMax = max != null;
  if (!hasMin && !hasMax) return "unknown";
  if (hasMin && value < (min as number)) return "outside";
  if (hasMax && value > (max as number)) return "outside";
  if (hasMin && hasMax) return "inside";
  return "inside";
}

export function powerNotes(device: Device, watts: number, ohms: number): PowerNotesResult {
  const power = dimensionStatus(watts, device.powerMinW, device.powerMaxW);
  const ohmsStatus = dimensionStatus(ohms, device.ohmMin, device.ohmMax);
  const notes: string[] = [];

  if (device.powerMaxW != null && watts > device.powerMaxW) {
    notes.push(`Supera el máximo publicado de ${device.powerMaxW} W.`);
  }
  if (device.powerMinW != null && watts < device.powerMinW) {
    notes.push(`Queda por debajo del mínimo publicado de ${device.powerMinW} W.`);
  }
  if (device.ohmMin != null && ohms < device.ohmMin) {
    notes.push(`La resistencia queda por debajo de la ventana (${device.ohmMin} Ω).`);
  }
  if (device.ohmMax != null && ohms > device.ohmMax) {
    notes.push(`La resistencia queda por encima de la ventana (${device.ohmMax} Ω).`);
  }

  if (power === "unknown" && ohmsStatus === "unknown") {
    notes.push(
      "Este dispositivo no publica límites de potencia ni de ohmios. No se puede afirmar que la cifra quede dentro de una ventana.",
    );
  } else if (power === "unknown") {
    notes.push("No hay ventana de potencia publicada para este dispositivo.");
  } else if (ohmsStatus === "unknown") {
    notes.push("No hay ventana de ohmios publicada para este dispositivo.");
  }

  if (power === "inside" && ohmsStatus === "inside") {
    notes.push("Dentro de la ventana de potencia y ohmios publicada para este dispositivo.");
  } else if (power === "inside" && ohmsStatus !== "outside") {
    notes.push("Dentro de la ventana de potencia publicada.");
  } else if (ohmsStatus === "inside" && power !== "outside") {
    notes.push("Dentro de la ventana de ohmios publicada.");
  }

  notes.push(
    "Un mod regulado no es un mod mecánico. Esta cifra no autoriza un montaje mecánico ni sustituye el CDR de la celda.",
  );
  return { power, ohms: ohmsStatus, notes };
}

export interface MixInput {
  /** Volumen inicial a 0 mg/ml ya en la botella. */
  initialZeroMgMl: number;
  bottleMl: number;
  shotMl: number;
  shotMg: number;
  shots: number;
}

export interface MixResult {
  finalMl: number;
  mgPerMl: number;
  /** Hueco inicial (capacidad − volumen a 0 mg). */
  freeMl: number;
  /** Espacio restante tras añadir los nicokits (puede ser negativo si desborda). */
  remainingMl: number;
  overflow: boolean;
  overTpdStrength: boolean;
}

export function mixNicotine(input: MixInput): MixResult | { error: string } {
  const { initialZeroMgMl, bottleMl, shotMl, shotMg, shots } = input;
  if (![initialZeroMgMl, bottleMl, shotMl, shotMg, shots].every(Number.isFinite)) {
    return { error: "Todos los valores tienen que ser números." };
  }
  if (initialZeroMgMl <= 0 || bottleMl <= 0 || shotMl <= 0 || shotMg <= 0) {
    return { error: "Volúmenes y graduación del nicokit tienen que ser mayores que 0." };
  }
  if (!Number.isInteger(shots) || shots < 0) {
    return { error: "El número de nicokits tiene que ser un entero mayor o igual que 0." };
  }
  if (initialZeroMgMl - bottleMl > 0.001) {
    return { error: "El líquido de partida no cabe en la botella." };
  }
  const added = shots * shotMl;
  const finalMl = initialZeroMgMl + added;
  const freeMl = bottleMl - initialZeroMgMl;
  const remainingMl = bottleMl - finalMl;
  const mgPerMl = finalMl === 0 ? 0 : (shots * shotMl * shotMg) / finalMl;
  return {
    finalMl,
    mgPerMl,
    freeMl,
    remainingMl,
    overflow: added - freeMl > 0.001,
    overTpdStrength: mgPerMl > 20 + 1e-9,
  };
}

export type ShotsForTargetResult =
  { shots: number; overflow: boolean; finalMl: number; mgPerMl: number } | { error: string };

export function shotsForTarget(
  initialZeroMgMl: number,
  shotMl: number,
  shotMg: number,
  targetMg: number,
  bottleMl?: number,
): ShotsForTargetResult {
  if (![initialZeroMgMl, shotMl, shotMg, targetMg].every(Number.isFinite)) {
    return { error: "Todos los valores tienen que ser números." };
  }
  if (initialZeroMgMl <= 0 || shotMl <= 0 || shotMg <= 0) {
    return { error: "Volumen inicial, nicokit y graduación tienen que ser mayores que 0." };
  }
  if (targetMg < 0) {
    return { error: "El objetivo no puede ser negativo." };
  }
  if (targetMg === 0) {
    const finalMl = initialZeroMgMl;
    const overflow =
      bottleMl != null && Number.isFinite(bottleMl) ? finalMl - bottleMl > 0.001 : false;
    return { shots: 0, overflow, finalMl, mgPerMl: 0 };
  }
  if (targetMg >= shotMg) {
    return { error: "El objetivo no puede igualar ni superar la graduación del nicokit." };
  }
  const denom = shotMg * shotMl - targetMg * shotMl;
  if (denom <= 0) return { error: "No hay una mezcla posible con ese nicokit." };
  const shots = (targetMg * initialZeroMgMl) / denom;
  const added = shots * shotMl;
  const finalMl = initialZeroMgMl + added;
  const overflow =
    bottleMl != null && Number.isFinite(bottleMl) ? finalMl - bottleMl > 0.001 : false;
  const mgPerMl = finalMl === 0 ? 0 : (shots * shotMl * shotMg) / finalMl;
  return { shots, overflow, finalMl, mgPerMl };
}

/** Alternativas enteras alrededor del objetivo; cada una indica desbordamiento. */
export function shotAlternatives(
  initialZeroMgMl: number,
  bottleMl: number,
  shotMl: number,
  shotMg: number,
  targetMg: number,
): Array<{ shots: number; overflow: boolean; mgPerMl: number; finalMl: number }> {
  const target = shotsForTarget(initialZeroMgMl, shotMl, shotMg, targetMg, bottleMl);
  if ("error" in target) return [];
  const candidates = Array.from(
    new Set([Math.floor(target.shots), Math.ceil(target.shots)].filter((k) => k >= 0)),
  );
  return candidates.flatMap((shots) => {
    const mixed = mixNicotine({
      initialZeroMgMl,
      bottleMl,
      shotMl,
      shotMg,
      shots,
    });
    if ("error" in mixed) return [];
    return [
      {
        shots,
        overflow: mixed.overflow,
        mgPerMl: mixed.mgPerMl,
        finalMl: mixed.finalMl,
      },
    ];
  });
}

/** Adaptador legado: delega en la evaluación dimensional canónica. */
export function compatibility(device: Device, coil: Coil): CompatResult {
  return toCompatResult(evaluateCompatibility(device, coil));
}

export function partsForDevice(device: Device, parts: Part[]): Part[] {
  return parts.filter((part) => {
    const platforms = [...device.platformIds, ...device.kitPlatformIds];
    if (part.fitsPlatformIds.some((id) => platforms.includes(id))) return true;
    if (part.fitsBattery === "18650" && device.cellType === "18650") return true;
    return false;
  });
}

/** Encaje de calada / uso; `preparacion` es concentrado que no está listo. */
export type LiquidFitKind = "directo" | "posible" | "evitar" | "preparacion";

export interface LiquidFit {
  liquid: Liquid;
  variation: LiquidVariation;
  fit: LiquidFitKind;
  reason: string;
  /** Si el líquido requiere preparación antes del uso. */
  requiresPreparation: boolean;
}

/**
 * Concentración conocida en mg/ml.
 * - número ≥ 0: valor conocido (cero incluido)
 * - null: desconocido (no se interpreta como cero)
 */
export function knownNicotineMgPerMl(variation: LiquidVariation): number | null {
  if (variation.nicotineMgPerMl == null) return null;
  if (!Number.isFinite(variation.nicotineMgPerMl)) return null;
  return variation.nicotineMgPerMl;
}

export function isKnownZeroNicotine(variation: LiquidVariation): boolean {
  return knownNicotineMgPerMl(variation) === 0;
}

export function isKnownPositiveNicotine(variation: LiquidVariation): boolean {
  const mg = knownNicotineMgPerMl(variation);
  return mg != null && mg > 0;
}

export function isUnknownNicotine(variation: LiquidVariation): boolean {
  return knownNicotineMgPerMl(variation) == null;
}

/** Primera variación del producto; no elige por nicotina máxima. */
export function leadVariation(liquid: Liquid): LiquidVariation | undefined {
  return liquid.variations[0];
}

export function liquidVolumeMl(liquid: Liquid): number | null {
  return leadVariation(liquid)?.fillVolumeMl ?? null;
}

export function liquidNicotineMg(liquid: Liquid): number | null {
  const lead = leadVariation(liquid);
  return lead ? knownNicotineMgPerMl(lead) : null;
}

export function hasNicotineVariation(variation: LiquidVariation): boolean {
  return isKnownPositiveNicotine(variation);
}

export function liquidRatio(liquid: Liquid): Ratio | null {
  const lead = leadVariation(liquid);
  if (!lead) return null;
  return formatRatioLabel(lead.ratioVgPct, lead.ratioPgPct);
}

export function liquidBottle(liquid: Liquid): string | null {
  return leadVariation(liquid)?.bottle ?? null;
}

export function liquidAssumedBottleMl(liquid: Liquid): number | null {
  return leadVariation(liquid)?.containerCapacityMl ?? null;
}

export function liquidTpd(liquid: Liquid): TpdStatus {
  return leadVariation(liquid)?.tpd ?? "no-aplica";
}

export function liquidHasRatio(liquid: Liquid, ratio: Ratio | null): boolean {
  if (!ratio) return false;
  return liquid.variations.some(
    (variation) => formatRatioLabel(variation.ratioVgPct, variation.ratioPgPct) === ratio,
  );
}

const FIT_RANK: Record<LiquidFitKind, number> = {
  evitar: 0,
  preparacion: 1,
  posible: 2,
  directo: 3,
};

function fitVariation(
  coil: Coil,
  variation: LiquidVariation,
  draws: Draw[],
  genreId: string,
): { fit: LiquidFitKind; reason: string; requiresPreparation: boolean } {
  if (genreId === "aroma") {
    const drawFits = coil.draws.some((draw) => draws.includes(draw));
    return {
      fit: "preparacion",
      requiresPreparation: true,
      reason: drawFits
        ? `Concentrado: requiere preparación. La calada del montaje (${coil.draws.join("/")}) encaja con el perfil del aroma, pero no está listo para vapear.`
        : "Concentrado: requiere preparación antes del uso. No es un líquido listo para vapear.",
    };
  }

  const parts = ratioPartsFromVariation(variation);
  if (parts && parts.vg >= 70 && coil.draws.includes("MTL")) {
    return {
      fit: "posible",
      requiresPreparation: false,
      reason:
        "El VG alto puede ir justo en un MTL cerrado. Mejor un 50/50 si la cápsula es estrecha.",
    };
  }
  if (coil.draws.some((draw) => draws.includes(draw))) {
    if (isUnknownNicotine(variation)) {
      return {
        fit: "posible",
        requiresPreparation: false,
        reason:
          "La calada encaja, pero la concentración de nicotina no está publicada: no se presume cero ni adecuación.",
      };
    }
    return {
      fit: "directo",
      requiresPreparation: false,
      reason: `La calada encaja con el montaje ${coil.draws.join("/")}.`,
    };
  }
  if (isUnknownNicotine(variation)) {
    return {
      fit: "posible",
      requiresPreparation: false,
      reason: "Concentración de nicotina desconocida: no se presume cero ni adecuación al montaje.",
    };
  }
  return {
    fit: "posible",
    requiresPreparation: false,
    reason: "Se puede usar, pero no es el cruce más natural de formato y calada.",
  };
}

export function recommendLiquids(coil: Coil, liquids: Liquid[]): LiquidFit[] {
  if (!coil.refillable) return [];

  const fits: LiquidFit[] = [];
  for (const liquid of liquids) {
    let best: LiquidFit | null = null;
    for (const variation of liquid.variations) {
      const evaluation = fitVariation(coil, variation, liquid.draws, liquid.genreId);
      const candidate: LiquidFit = {
        liquid,
        variation,
        fit: evaluation.fit,
        reason: evaluation.reason,
        requiresPreparation: evaluation.requiresPreparation,
      };
      if (!best || FIT_RANK[evaluation.fit] > FIT_RANK[best.fit]) {
        best = candidate;
      }
    }
    if (best) fits.push(best);
  }
  return fits;
}

export function drawsMatch(draw: Draw, recommended: Draw[]): boolean {
  return recommended.includes(draw);
}

export function availableOhms(coils: Coil[]): number[] {
  return [...new Set(coils.map((coil) => round(coil.ohms, 2)))].sort((a, b) => a - b);
}

export interface CoilPowerReference {
  coilId: string;
  coilSlug: string;
  coilName: string;
  wattMin: number;
  wattMax: number;
}

export interface RecommendedPower {
  hasPublished: boolean;
  /** Rangos de cada resistencia identificada; no hay agregado universal. */
  references: CoilPowerReference[];
  matchingCoilCount: number;
  note: string;
}

export function recommendedPowerForOhms(ohms: number, coils: Coil[]): RecommendedPower {
  const target = round(ohms, 2);
  const matching = coils.filter(
    (coil) =>
      Math.abs(round(coil.ohms, 2) - target) < 1e-9 && coil.wattMin != null && coil.wattMax != null,
  );
  if (matching.length === 0) {
    return {
      hasPublished: false,
      references: [],
      matchingCoilCount: 0,
      note: "No se publica un rango de vatios propio para este valor de resistencia.",
    };
  }
  const references: CoilPowerReference[] = matching.map((coil) => ({
    coilId: coil.id,
    coilSlug: coil.slug,
    coilName: coil.name,
    wattMin: coil.wattMin as number,
    wattMax: coil.wattMax as number,
  }));
  return {
    hasPublished: true,
    references,
    matchingCoilCount: references.length,
    note:
      references.length === 1
        ? `${references[0]!.coilName}: ${references[0]!.wattMin}–${references[0]!.wattMax} W (rango publicado de esa resistencia).`
        : `${references.length} resistencias del archivo a ${target} Ω con rangos propios; no hay una potencia recomendada única.`,
  };
}
