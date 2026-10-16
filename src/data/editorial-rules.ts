/**
 * Reglas editoriales versionadas. No son evaluación sanitaria personalizada.
 * Una regla retirada permanece registrada; no se sustituye por otro umbral
 * sin justificación documentada (ADR-0011).
 */

export type EditorialRuleStatus = "active" | "withdrawn";

export interface EditorialRule {
  id: string;
  version: number;
  status: EditorialRuleStatus;
  scope: string;
  evidence: string;
  summary: string;
}

export const EDITORIAL_RULES: readonly EditorialRule[] = [
  {
    id: "nicotine-mg-draw-threshold-12",
    version: 1,
    status: "withdrawn",
    scope: "liquid-coil-fit",
    evidence:
      "Umbral fijo de 12 mg/ml cruzado solo con calada MTL/RDL/DL. Retirado: no distingue preparación, evidencia de ficha ni evaluación personalizada.",
    summary:
      "Clasificación categórica evitar cuando nicotineMg > 12 y la coil era MTL o de calada abierta.",
  },
];

export function editorialRuleById(id: string): EditorialRule | undefined {
  return EDITORIAL_RULES.find((rule) => rule.id === id);
}
