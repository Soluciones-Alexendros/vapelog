/**
 * Compatibilidad versionada (canónica). Las dimensiones se evalúan desde datos
 * tipados; CompatKind legado se deriva del resultado, no al revés.
 */
import { exclusionReason } from "./compat-rules.ts";
import type { Coil, CompatKind, CompatResult, Device } from "./types.ts";
import { CATALOG_REVISION, SCHEMA_VERSION } from "./types.ts";

export type EvaluationStatus = "match" | "mismatch" | "unknown" | "conditional" | "not_applicable";

export interface DimensionEvaluation {
  status: EvaluationStatus;
  ruleId: string;
  ruleVersion: number;
  reasons: string[];
}

export interface CompatEvaluation {
  schemaVersion: typeof SCHEMA_VERSION;
  catalogRevision: typeof CATALOG_REVISION;
  deviceId: string;
  coilId: string;
  physical: DimensionEvaluation;
  electrical: DimensionEvaluation;
  operating: DimensionEvaluation;
  /** CompatKind legado derivado para UI existente. */
  legacyKind: CompatKind;
}

type PhysicalKind = "native" | "kit" | "thread510" | "none";

const RULE = {
  physicalPlatform: { id: "physical-platform-share", version: 2 },
  electricalWindow: { id: "electrical-watt-ohm-window", version: 2 },
  operatingDraw: { id: "operating-draw-overlap", version: 1 },
} as const;

export function evaluateCompatibility(device: Device, coil: Coil): CompatEvaluation {
  const { physical, kind: physicalKind } = evaluatePhysical(device, coil);
  const electrical = evaluateElectrical(device, coil, physicalKind);
  const operating = evaluateOperating(device, coil);
  const legacyKind = deriveLegacyKind(physicalKind, physical, electrical);

  return {
    schemaVersion: SCHEMA_VERSION,
    catalogRevision: CATALOG_REVISION,
    deviceId: device.id,
    coilId: coil.id,
    physical,
    electrical,
    operating,
    legacyKind,
  };
}

/** Adaptador legado: misma semántica que `evaluateCompatibility`. */
export function toCompatResult(evaluation: CompatEvaluation): CompatResult {
  return {
    kind: evaluation.legacyKind,
    reasons: legacyReasons(evaluation),
  };
}

function evaluatePhysical(
  device: Device,
  coil: Coil,
): { physical: DimensionEvaluation; kind: PhysicalKind } {
  const sharedNative = device.platformIds.filter((id) => coil.platformIds.includes(id));
  const nativeBlocked = exclusionReason(device.slug, coil.slug, "nativa");
  if (sharedNative.length > 0 && !nativeBlocked) {
    return {
      kind: "native",
      physical: dim("match", RULE.physicalPlatform, [
        "Comparten plataforma de cápsula. La coil o el pod entra en el dispositivo sin adaptador.",
      ]),
    };
  }

  const sharedKit = device.kitPlatformIds.filter((id) => coil.platformIds.includes(id));
  const kitBlocked = exclusionReason(device.slug, coil.slug, "kit");
  if (sharedKit.length > 0 && !kitBlocked) {
    return {
      kind: "kit",
      physical: dim("match", RULE.physicalPlatform, [
        "El kit incluye un atomizador de esa plataforma. La coil no se enchufa al mod: va en el tanque del kit.",
        "Si se cambia el atomizador 510, la compatibilidad pasa a ser solo eléctrica y hay que repetir el cruce.",
      ]),
    };
  }

  if (device.connector === "510" && coil.connector === "510") {
    const reasons = [
      "Los dos usan rosca 510. Eso no significa que la coil quepa en cualquier tanque.",
      "Cruce eléctrico posible solo con el atomizador montado, no con la coil suelta.",
    ];
    if (kitBlocked) reasons.unshift(kitBlocked);
    return {
      kind: "thread510",
      physical: dim("conditional", RULE.physicalPlatform, reasons),
    };
  }

  return {
    kind: "none",
    physical: dim("mismatch", RULE.physicalPlatform, [
      "Plataforma y conector no coinciden. No son intercambiables.",
    ]),
  };
}

function evaluateElectrical(
  device: Device,
  coil: Coil,
  physicalKind: PhysicalKind,
): DimensionEvaluation {
  if (physicalKind === "none") {
    return dim("not_applicable", RULE.electricalWindow, [
      "La evaluación eléctrica no aplica tras un fallo de encaje físico.",
    ]);
  }

  const devicePowerKnown = device.powerMinW != null || device.powerMaxW != null;
  const deviceOhmKnown = device.ohmMin != null || device.ohmMax != null;
  const coilWattKnown = coil.wattMin != null || coil.wattMax != null;
  const hasAnyWindow = devicePowerKnown || deviceOhmKnown || coilWattKnown;

  if (!hasAnyWindow) {
    return dim("unknown", RULE.electricalWindow, [
      "No hay ventana eléctrica publicada en dispositivo ni resistencia.",
    ]);
  }

  const watt = wattClash(device, coil);
  const ohm = ohmClash(device, coil);
  if (watt || ohm) {
    const reasons: string[] = [];
    if (watt) reasons.push(watt);
    if (ohm) reasons.push(ohm);
    return dim("mismatch", RULE.electricalWindow, reasons);
  }

  // Un solo extremo conocido: no elevar a match global.
  const wattComparable =
    (device.powerMaxW != null && coil.wattMin != null) ||
    (device.powerMinW != null && coil.wattMax != null);
  const ohmComparable =
    (device.ohmMin != null || device.ohmMax != null) && Number.isFinite(coil.ohms);
  if (!wattComparable && !ohmComparable) {
    return dim("unknown", RULE.electricalWindow, [
      "Solo hay extremos eléctricos parciales publicados; no se afirma encaje ni rechazo.",
    ]);
  }

  const reasons: string[] = [];
  if (device.ohmMin != null && device.ohmMax != null) {
    reasons.push(`La resistencia entra en la ventana ${device.ohmMin}–${device.ohmMax} Ω.`);
  } else if (wattComparable) {
    reasons.push("Las ventanas de potencia publicadas no chocan.");
  }
  return dim("match", RULE.electricalWindow, reasons);
}

function evaluateOperating(device: Device, coil: Coil): DimensionEvaluation {
  if (device.draws.length === 0 || coil.draws.length === 0) {
    return dim("unknown", RULE.operatingDraw, [
      "No hay caladas publicadas suficientes para evaluar el régimen de uso.",
    ]);
  }
  const shared = device.draws.filter((draw) => coil.draws.includes(draw));
  if (shared.length > 0) {
    return dim("match", RULE.operatingDraw, [`Caladas comunes: ${shared.join(", ")}.`]);
  }
  return dim("conditional", RULE.operatingDraw, [
    `Caladas del dispositivo (${device.draws.join("/")}) y de la resistencia (${coil.draws.join("/")}) no se solapan.`,
  ]);
}

function deriveLegacyKind(
  physicalKind: PhysicalKind,
  physical: DimensionEvaluation,
  electrical: DimensionEvaluation,
): CompatKind {
  if (physicalKind === "none" || physical.status === "mismatch") return "no";
  if (electrical.status === "mismatch") return "no";
  if (physicalKind === "native") return "nativa";
  if (physicalKind === "kit") return "kit";
  if (physicalKind === "thread510") return "electrica";
  return "no";
}

function legacyReasons(evaluation: CompatEvaluation): string[] {
  const reasons = [
    ...evaluation.physical.reasons,
    ...evaluation.electrical.reasons.filter(
      (reason) => !evaluation.physical.reasons.includes(reason),
    ),
  ];
  if (evaluation.legacyKind === "no" && evaluation.physical.status === "match") {
    if (evaluation.electrical.status === "mismatch") {
      const head =
        evaluation.physical.ruleId === RULE.physicalPlatform.id
          ? evaluation.physical.reasons[0]?.includes("kit")
            ? "El kit trae ese atomizador, pero la ventana eléctrica no encaja."
            : "La plataforma coincide, pero la ventana eléctrica no."
          : "Encaje físico posible, pero la ventana eléctrica no.";
      return [head, ...evaluation.electrical.reasons];
    }
  }
  if (evaluation.legacyKind === "electrica") {
    return [
      ...evaluation.physical.reasons.slice(0, 1),
      ...evaluation.electrical.reasons,
      "Cruce eléctrico posible. La coil tiene que pertenecer al atomizador que esté montado.",
    ].filter((reason, index, all) => all.indexOf(reason) === index);
  }
  return reasons.length > 0 ? reasons : ["Sin detalle de compatibilidad."];
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

function dim(
  status: EvaluationStatus,
  rule: { id: string; version: number },
  reasons: string[],
): DimensionEvaluation {
  return {
    status,
    ruleId: rule.id,
    ruleVersion: rule.version,
    reasons,
  };
}
