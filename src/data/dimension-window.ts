/**
 * Primitiva compartida: valor en ventana publicada y solape de intervalos cerrados.
 * Usada por powerNotes (calculadora) y evaluateCompatibility (CompatLab).
 */

export type WindowVerdict = "match" | "mismatch" | "unknown";

export interface WindowEvaluation {
  verdict: WindowVerdict;
  reasons: string[];
}

export function finiteBound(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

export function evaluateValueInWindow(
  value: number,
  min: number | null,
  max: number | null,
  labels: { noun: string; unit: string },
): WindowEvaluation {
  if (!Number.isFinite(value)) {
    return {
      verdict: "unknown",
      reasons: [`${labels.noun}: el valor no es un número finito.`],
    };
  }
  const hasMin = finiteBound(min);
  const hasMax = finiteBound(max);
  if (!hasMin && !hasMax) {
    return {
      verdict: "unknown",
      reasons: [`No hay ventana de ${labels.noun} publicada.`],
    };
  }
  if (hasMin && hasMax && min > max) {
    return {
      verdict: "mismatch",
      reasons: [
        `La ventana publicada de ${labels.noun} es contradictoria (${min}–${max} ${labels.unit}).`,
      ],
    };
  }
  if (hasMin && value < min) {
    return {
      verdict: "mismatch",
      reasons: [
        `${value} ${labels.unit} queda por debajo del mínimo publicado (${min} ${labels.unit}).`,
      ],
    };
  }
  if (hasMax && value > max) {
    return {
      verdict: "mismatch",
      reasons: [`${value} ${labels.unit} supera el máximo publicado (${max} ${labels.unit}).`],
    };
  }
  if (hasMin && hasMax) {
    return {
      verdict: "match",
      reasons: [
        `${value} ${labels.unit} entra en la ventana publicada ${min}–${max} ${labels.unit}.`,
      ],
    };
  }
  if (hasMin) {
    return {
      verdict: "unknown",
      reasons: [
        `Respecta el mínimo publicado (${min} ${labels.unit}), pero no consta el otro extremo de la ventana de ${labels.noun}.`,
      ],
    };
  }
  return {
    verdict: "unknown",
    reasons: [
      `Respecta el máximo publicado (${max as number} ${labels.unit}), pero no consta el otro extremo de la ventana de ${labels.noun}.`,
    ],
  };
}

/** Solape de intervalos cerrados dispositivo ↔ resistencia (vatios). */
export function evaluatePowerIntervalOverlap(
  deviceMinW: number | null,
  deviceMaxW: number | null,
  coilMinW: number | null,
  coilMaxW: number | null,
): WindowEvaluation {
  const dMin = finiteBound(deviceMinW) ? deviceMinW : null;
  const dMax = finiteBound(deviceMaxW) ? deviceMaxW : null;
  const cMin = finiteBound(coilMinW) ? coilMinW : null;
  const cMax = finiteBound(coilMaxW) ? coilMaxW : null;
  const deviceKnown = dMin != null || dMax != null;
  const coilKnown = cMin != null || cMax != null;

  if (!deviceKnown && !coilKnown) {
    return {
      verdict: "unknown",
      reasons: ["No hay ventanas de potencia publicadas en dispositivo ni resistencia."],
    };
  }

  if (dMax != null && cMin != null && cMin > dMax) {
    return {
      verdict: "mismatch",
      reasons: [
        `La coil está recomendada desde ${cMin} W y el dispositivo publica un máximo de ${dMax} W.`,
      ],
    };
  }
  if (dMin != null && cMax != null && cMax < dMin) {
    return {
      verdict: "mismatch",
      reasons: [
        `La coil se recomienda hasta ${cMax} W y el dispositivo publica un mínimo de ${dMin} W.`,
      ],
    };
  }

  if (dMin != null && dMax != null && dMin > dMax) {
    return {
      verdict: "mismatch",
      reasons: [`La ventana de potencia del dispositivo es contradictoria (${dMin}–${dMax} W).`],
    };
  }
  if (cMin != null && cMax != null && cMin > cMax) {
    return {
      verdict: "mismatch",
      reasons: [`La ventana de potencia de la resistencia es contradictoria (${cMin}–${cMax} W).`],
    };
  }

  if (dMin != null && dMax != null && cMin != null && cMax != null) {
    const low = Math.max(dMin, cMin);
    const high = Math.min(dMax, cMax);
    if (low > high) {
      return {
        verdict: "mismatch",
        reasons: [
          `Las ventanas de potencia no se solapan (dispositivo ${dMin}–${dMax} W, resistencia ${cMin}–${cMax} W).`,
        ],
      };
    }
    return {
      verdict: "match",
      reasons: [`Las ventanas de potencia se solapan en ${low}–${high} W.`],
    };
  }

  return {
    verdict: "unknown",
    reasons: ["Solo hay extremos de potencia parciales; no se afirma solape completo."],
  };
}

export type ElectricalSubdimension = "resistance_admission" | "power_overlap" | "sufficiency";

export interface ElectricalSubEvaluations {
  resistanceAdmission: WindowEvaluation;
  powerOverlap: WindowEvaluation;
  sufficiency: WindowEvaluation;
}

export function evaluateElectricalSubdimensions(
  coilOhms: number,
  deviceOhmMin: number | null,
  deviceOhmMax: number | null,
  devicePowerMinW: number | null,
  devicePowerMaxW: number | null,
  coilWattMin: number | null,
  coilWattMax: number | null,
): ElectricalSubEvaluations {
  const resistanceAdmission = evaluateValueInWindow(coilOhms, deviceOhmMin, deviceOhmMax, {
    noun: "ohmios",
    unit: "Ω",
  });
  const powerOverlap = evaluatePowerIntervalOverlap(
    devicePowerMinW,
    devicePowerMaxW,
    coilWattMin,
    coilWattMax,
  );
  const sufficiency = aggregateSufficiency(resistanceAdmission, powerOverlap);
  return { resistanceAdmission, powerOverlap, sufficiency };
}

function aggregateSufficiency(
  resistance: WindowEvaluation,
  power: WindowEvaluation,
): WindowEvaluation {
  if (resistance.verdict === "mismatch" || power.verdict === "mismatch") {
    const reasons = [
      ...(resistance.verdict === "mismatch" ? resistance.reasons : []),
      ...(power.verdict === "mismatch" ? power.reasons : []),
    ];
    return { verdict: "mismatch", reasons };
  }
  if (resistance.verdict === "match" && power.verdict === "match") {
    return {
      verdict: "match",
      reasons: [...resistance.reasons, ...power.reasons],
    };
  }
  const reasons = [...resistance.reasons, ...power.reasons];
  if (reasons.length === 0) {
    return {
      verdict: "unknown",
      reasons: ["No hay datos eléctricos suficientes para afirmar encaje ni rechazo."],
    };
  }
  return { verdict: "unknown", reasons };
}
