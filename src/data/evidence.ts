/**
 * Evidencia versionada por campo (fase 6). Distingue tipo de fuente,
 * verificación y naturaleza del dato.
 */

export type SourceKind = "manufacturer" | "distributor" | "archive" | "derived";

export type VerificationStatus = "verified" | "unverified" | "conflict" | "stale";

export type DatumNature = "declared" | "derived" | "inferred" | "conflicted";

export interface FieldEvidence {
  field: string;
  sourceKind: SourceKind;
  verification: VerificationStatus;
  nature: DatumNature;
  consultedAt: string | null;
  locator: string | null;
  note?: string;
}

export interface MarketRequirement {
  market: string;
  code: string;
  status: "meets" | "fails" | "unknown" | "not_applicable";
  asOf: string | null;
  evidence: FieldEvidence[];
}

/** Sustituye el TPD global por requisitos de mercado fechados. */
export function tpdAsMarketRequirements(
  tpd: "si" | "parcial" | "no" | "no-aplica",
  consultedAt: string | null = null,
): MarketRequirement[] {
  if (tpd === "no-aplica") {
    return [
      {
        market: "UE",
        code: "tpd-liquid",
        status: "not_applicable",
        asOf: consultedAt,
        evidence: [],
      },
    ];
  }
  return [
    {
      market: "UE",
      code: "tpd-liquid",
      status: tpd === "si" ? "meets" : tpd === "no" ? "fails" : "unknown",
      asOf: consultedAt,
      evidence: [
        {
          field: "tpd",
          sourceKind: "archive",
          verification: tpd === "parcial" ? "conflict" : "unverified",
          nature: tpd === "parcial" ? "conflicted" : "declared",
          consultedAt,
          locator: null,
        },
      ],
    },
  ];
}
