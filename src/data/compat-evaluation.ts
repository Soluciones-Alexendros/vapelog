/**
 * Compatibilidad versionada (fase 6). Convive con CompatKind legado vía adaptador.
 */
import { compatibility } from "./logic.ts";
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

const RULE = {
  physicalPlatform: { id: "physical-platform-share", version: 1 },
  electricalWindow: { id: "electrical-watt-ohm-window", version: 1 },
  operatingDraw: { id: "operating-draw-overlap", version: 1 },
} as const;

export function evaluateCompatibility(device: Device, coil: Coil): CompatEvaluation {
  const legacy = compatibility(device, coil);
  const physical = physicalFromLegacy(device, coil, legacy);
  const electrical = electricalFromLegacy(device, coil, legacy);
  const operating: DimensionEvaluation = {
    status:
      device.draws.length === 0 || coil.draws.length === 0
        ? "unknown"
        : device.draws.some((draw) => coil.draws.includes(draw))
          ? "match"
          : "conditional",
    ruleId: RULE.operatingDraw.id,
    ruleVersion: RULE.operatingDraw.version,
    reasons:
      device.draws.length === 0 || coil.draws.length === 0
        ? ["No hay caladas publicadas suficientes para evaluar el régimen de uso."]
        : device.draws.some((draw) => coil.draws.includes(draw))
          ? [`Caladas comunes: ${device.draws.filter((d) => coil.draws.includes(d)).join(", ")}.`]
          : [
              `Caladas del dispositivo (${device.draws.join("/")}) y de la resistencia (${coil.draws.join("/")}) no se solapan.`,
            ],
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    catalogRevision: CATALOG_REVISION,
    deviceId: device.id,
    coilId: coil.id,
    physical,
    electrical,
    operating,
    legacyKind: legacy.kind,
  };
}

function physicalFromLegacy(device: Device, coil: Coil, legacy: CompatResult): DimensionEvaluation {
  if (legacy.kind === "nativa" || legacy.kind === "kit") {
    return {
      status: "match",
      ruleId: RULE.physicalPlatform.id,
      ruleVersion: RULE.physicalPlatform.version,
      reasons: legacy.reasons,
    };
  }
  if (device.connector === "510" && coil.connector === "510") {
    return {
      status: "conditional",
      ruleId: RULE.physicalPlatform.id,
      ruleVersion: RULE.physicalPlatform.version,
      reasons: [
        "Rosca 510 compartida: encaje físico posible solo con el atomizador montado, no con la coil suelta.",
        ...legacy.reasons.filter((reason) => /510|atomizador|plataforma/i.test(reason)),
      ],
    };
  }
  if (legacy.kind === "no") {
    return {
      status: "mismatch",
      ruleId: RULE.physicalPlatform.id,
      ruleVersion: RULE.physicalPlatform.version,
      reasons: legacy.reasons,
    };
  }
  return {
    status: "unknown",
    ruleId: RULE.physicalPlatform.id,
    ruleVersion: RULE.physicalPlatform.version,
    reasons: ["No hay evidencia suficiente de encaje físico."],
  };
}

function electricalFromLegacy(
  device: Device,
  coil: Coil,
  legacy: CompatResult,
): DimensionEvaluation {
  const hasPower = device.powerMinW != null || device.powerMaxW != null;
  const hasOhm = device.ohmMin != null || device.ohmMax != null;
  if (!hasPower && !hasOhm && coil.wattMin == null && coil.wattMax == null) {
    return {
      status: "unknown",
      ruleId: RULE.electricalWindow.id,
      ruleVersion: RULE.electricalWindow.version,
      reasons: ["No hay ventana eléctrica publicada en dispositivo ni resistencia."],
    };
  }
  if (legacy.kind === "no" && legacy.reasons.some((reason) => /potencia|ohm|Ω|W\b/i.test(reason))) {
    return {
      status: "mismatch",
      ruleId: RULE.electricalWindow.id,
      ruleVersion: RULE.electricalWindow.version,
      reasons: legacy.reasons.filter((reason) => /potencia|ohm|Ω|W\b/i.test(reason)),
    };
  }
  if (legacy.kind === "electrica" || legacy.kind === "nativa" || legacy.kind === "kit") {
    return {
      status: hasPower || hasOhm ? "match" : "unknown",
      ruleId: RULE.electricalWindow.id,
      ruleVersion: RULE.electricalWindow.version,
      reasons: legacy.reasons.filter((reason) =>
        /potencia|ohm|Ω|W\b|eléctrica|ventana/i.test(reason),
      ),
    };
  }
  return {
    status: "not_applicable",
    ruleId: RULE.electricalWindow.id,
    ruleVersion: RULE.electricalWindow.version,
    reasons: ["La evaluación eléctrica no aplica tras un fallo de encaje físico."],
  };
}
