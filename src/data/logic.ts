import { exclusionReason } from "./compat-rules.ts";
import { ratioParts } from "./measures.ts";
import type {
  Coil,
  CompatResult,
  Device,
  Draw,
  Liquid,
  LiquidVariation,
  Part,
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

export function powerNotes(device: Device, watts: number, ohms: number): string[] {
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
  if (notes.length === 0) {
    notes.push("Dentro de la ventana de potencia y ohmios publicada para este dispositivo.");
  }
  notes.push(
    "Un mod regulado no es un mod mecánico. Esta cifra no autoriza un montaje mecánico ni sustituye el CDR de la celda.",
  );
  return notes;
}

export interface MixInput {
  aromaMl: number;
  bottleMl: number;
  shotMl: number;
  shotMg: number;
  shots: number;
}

export interface MixResult {
  finalMl: number;
  mgPerMl: number;
  freeMl: number;
  overflow: boolean;
  overTpdStrength: boolean;
}

export function mixNicotine(input: MixInput): MixResult | { error: string } {
  const { aromaMl, bottleMl, shotMl, shotMg, shots } = input;
  if (![aromaMl, bottleMl, shotMl, shotMg, shots].every(Number.isFinite)) {
    return { error: "Todos los valores tienen que ser números." };
  }
  if (aromaMl <= 0 || bottleMl <= 0 || shotMl <= 0 || shotMg <= 0) {
    return { error: "Volúmenes y graduación del nicokit tienen que ser mayores que 0." };
  }
  if (shots < 0) return { error: "El número de nicokits no puede ser negativo." };
  if (aromaMl - bottleMl > 0.001) {
    return { error: "El líquido de partida no cabe en la botella." };
  }
  const added = shots * shotMl;
  const finalMl = aromaMl + added;
  const freeMl = bottleMl - aromaMl;
  const mgPerMl = finalMl === 0 ? 0 : (shots * shotMl * shotMg) / finalMl;
  return {
    finalMl,
    mgPerMl,
    freeMl,
    overflow: added - freeMl > 0.001,
    overTpdStrength: mgPerMl > 20 + 1e-9,
  };
}

export function shotsForTarget(
  aromaMl: number,
  shotMl: number,
  shotMg: number,
  targetMg: number,
): number | { error: string } {
  if (![aromaMl, shotMl, shotMg, targetMg].every((n) => Number.isFinite(n) && n > 0)) {
    return { error: "Aroma, nicokit y objetivo tienen que ser mayores que 0." };
  }
  if (targetMg >= shotMg) {
    return { error: "El objetivo no puede igualar ni superar la graduación del nicokit." };
  }
  const denom = shotMg * shotMl - targetMg * shotMl;
  if (denom <= 0) return { error: "No hay una mezcla posible con ese nicokit." };
  return (targetMg * aromaMl) / denom;
}

export function compatibility(device: Device, coil: Coil): CompatResult {
  const sharedNative = device.platformIds.filter((id) => coil.platformIds.includes(id));
  if (sharedNative.length > 0 && !exclusionReason(device.slug, coil.slug, "nativa")) {
    const clash = wattClash(device, coil);
    if (clash) {
      return {
        kind: "no",
        reasons: ["La plataforma coincide, pero la ventana de potencia no.", clash],
      };
    }
    const ohm = ohmClash(device, coil);
    if (ohm) {
      return {
        kind: "no",
        reasons: [
          "La plataforma coincide, pero la resistencia queda fuera de la ventana publicada.",
          ohm,
        ],
      };
    }
    return {
      kind: "nativa",
      reasons: [
        "Comparten plataforma de cápsula. La coil o el pod entra en el dispositivo sin adaptador.",
      ],
    };
  }

  const sharedKit = device.kitPlatformIds.filter((id) => coil.platformIds.includes(id));
  const kitBlocked = exclusionReason(device.slug, coil.slug, "kit");
  if (sharedKit.length > 0 && !kitBlocked) {
    const clash = wattClash(device, coil);
    if (clash) {
      return {
        kind: "no",
        reasons: [
          "El kit trae ese atomizador, pero la coil pide más potencia de la publicada.",
          clash,
        ],
      };
    }
    const ohm = ohmClash(device, coil);
    if (ohm) {
      return {
        kind: "no",
        reasons: [
          "El kit trae ese atomizador, pero la resistencia queda fuera de la ventana publicada.",
          ohm,
        ],
      };
    }
    return {
      kind: "kit",
      reasons: [
        "El kit incluye un atomizador de esa plataforma. La coil no se enchufa al mod: va en el tanque del kit.",
        "Si se cambia el atomizador 510, la compatibilidad pasa a ser solo eléctrica y hay que repetir el cruce.",
      ],
    };
  }

  if (device.connector === "510" && coil.connector === "510") {
    const reasons = [
      "Los dos usan rosca 510. Eso no significa que la coil quepa en cualquier tanque.",
    ];
    if (kitBlocked) reasons.unshift(kitBlocked);
    const ohm = ohmClash(device, coil);
    if (ohm) {
      reasons.push(ohm);
      return { kind: "no", reasons };
    }
    if (device.ohmMin != null && device.ohmMax != null) {
      reasons.push(`La resistencia entra en la ventana ${device.ohmMin}–${device.ohmMax} Ω.`);
    }
    const clash = wattClash(device, coil);
    if (clash) {
      reasons.push(clash);
      return { kind: "no", reasons };
    }
    reasons.push(
      "Cruce eléctrico posible. La coil tiene que pertenecer al atomizador que esté montado.",
    );
    return { kind: "electrica", reasons };
  }

  return {
    kind: "no",
    reasons: ["Plataforma y conector no coinciden. No son intercambiables."],
  };
}

function wattClash(device: Device, coil: Coil): string | null {
  if (device.powerMaxW != null && coil.wattMin != null && coil.wattMin > device.powerMaxW) {
    return `La coil está recomendada desde ${coil.wattMin} W y el dispositivo publica un máximo de ${device.powerMaxW} W.`;
  }
  if (device.powerMinW != null && coil.wattMax != null && coil.wattMax < device.powerMinW) {
    return `La coil se recomienda hasta ${coil.wattMax} W y el dispositivo publica un mínimo de ${device.powerMinW} W.`;
  }
  return null;
}

function ohmClash(device: Device, coil: Coil): string | null {
  if (device.ohmMin != null && coil.ohms < device.ohmMin) {
    return `${coil.ohms} Ω queda por debajo del mínimo publicado (${device.ohmMin} Ω).`;
  }
  if (device.ohmMax != null && coil.ohms > device.ohmMax) {
    return `${coil.ohms} Ω supera el máximo publicado (${device.ohmMax} Ω).`;
  }
  return null;
}

export function partsForDevice(device: Device, parts: Part[]): Part[] {
  return parts.filter((part) => {
    const platforms = [...device.platformIds, ...device.kitPlatformIds];
    if (part.fitsPlatformIds.some((id) => platforms.includes(id))) return true;
    if (part.fitsBattery === "18650" && device.battery.includes("18650")) return true;
    return false;
  });
}

export type LiquidFitKind = "directo" | "posible" | "evitar";

export interface LiquidFit {
  liquid: Liquid;
  variation: LiquidVariation;
  fit: LiquidFitKind;
  reason: string;
}

export function leadVariation(liquid: Liquid): LiquidVariation | undefined {
  return liquid.variations.reduce<LiquidVariation | undefined>(
    (lead, variation) =>
      !lead || (variation.nicotineMg ?? 0) > (lead.nicotineMg ?? 0) ? variation : lead,
    undefined,
  );
}

export function liquidVolumeMl(liquid: Liquid): number | null {
  return leadVariation(liquid)?.volumeMl ?? null;
}

export function liquidNicotineMg(liquid: Liquid): number | null {
  return leadVariation(liquid)?.nicotineMg ?? null;
}

export function hasNicotineVariation(variation: LiquidVariation): boolean {
  return variation.hasNicotine;
}

export function liquidRatio(liquid: Liquid): LiquidVariation["ratio"] {
  return leadVariation(liquid)?.ratio ?? null;
}

export function liquidBottle(liquid: Liquid): string | null {
  return leadVariation(liquid)?.bottle ?? null;
}

export function liquidAssumedBottleMl(liquid: Liquid): number | null {
  return leadVariation(liquid)?.assumedBottleMl ?? null;
}

export function liquidTpd(liquid: Liquid): TpdStatus {
  return leadVariation(liquid)?.tpd ?? "no-aplica";
}

export function liquidHasRatio(liquid: Liquid, ratio: LiquidVariation["ratio"]): boolean {
  return liquid.variations.some((variation) => variation.ratio === ratio);
}

const FIT_RANK: Record<LiquidFitKind, number> = { evitar: 0, posible: 1, directo: 2 };

function fitVariation(
  coil: Coil,
  variation: LiquidVariation,
  draws: Draw[],
): { fit: LiquidFitKind; reason: string } {
  if (variation.hasNicotine && (variation.nicotineMg ?? 0) > 12) {
    if (coil.draws.includes("MTL")) {
      return { fit: "evitar", reason: "Graduación alta de nicotina para una calada MTL." };
    }
    if (coil.draws.some((draw) => draw === "RDL" || draw === "DL")) {
      return {
        fit: "evitar",
        reason: "Graduación alta para una calada abierta (RDL/DL).",
      };
    }
  }
  const parts = ratioParts(variation.ratio);
  if (parts && parts.vg >= 70 && coil.draws.includes("MTL")) {
    return {
      fit: "posible",
      reason:
        "El VG alto puede ir justo en un MTL cerrado. Mejor un 50/50 si la cápsula es estrecha.",
    };
  }
  if (coil.draws.some((draw) => draws.includes(draw))) {
    return {
      fit: "directo",
      reason: `La calada encaja con el montaje ${coil.draws.join("/")}.`,
    };
  }
  return {
    fit: "posible",
    reason: "Se puede usar, pero no es el cruce más natural de formato y calada.",
  };
}

export function recommendLiquids(coil: Coil, liquids: Liquid[]): LiquidFit[] {
  if (!coil.refillable) return [];

  const fits: LiquidFit[] = [];
  for (const liquid of liquids) {
    let best: LiquidFit | null = null;
    for (const variation of liquid.variations) {
      const evaluation = fitVariation(coil, variation, liquid.draws);
      if (!best || FIT_RANK[evaluation.fit] > FIT_RANK[best.fit]) {
        best = { liquid, variation, fit: evaluation.fit, reason: evaluation.reason };
      }
    }
    if (best) fits.push(best);
  }
  return fits;
}

export function drawsMatch(draw: Draw, recommended: Draw[]): boolean {
  return recommended.includes(draw);
}
