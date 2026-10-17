/**
 * Evidencia versionada por campo. Distingue tipo de fuente,
 * verificación y naturaleza del dato. La migración no aumenta certeza.
 */

export type SourceKind = "manufacturer" | "distributor" | "archive" | "derived";

export type VerificationStatus = "verified" | "unverified" | "conflict" | "stale";

export type DatumNature = "declared" | "derived" | "inferred" | "conflicted";

export interface FieldEvidence {
  field: string;
  /** Identificador resoluble del registro de fuente (no opcional en afirmaciones críticas). */
  sourceId: string;
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

/**
 * TPD heredado sin verificación → declaración `unknown`/`unverified`,
 * nunca `meets` comprobado (VAL-014-01).
 */
export function tpdAsMarketRequirements(
  tpd: "si" | "parcial" | "no" | "no-aplica",
  consultedAt: string | null = null,
  sourceId = "archive:tpd-legacy",
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
  // «si» heredado sin fuente verificada: unknown + unverified (no meets).
  const status = tpd === "no" ? "fails" : tpd === "parcial" ? "unknown" : "unknown";
  return [
    {
      market: "UE",
      code: "tpd-liquid",
      status,
      asOf: consultedAt,
      evidence: [
        {
          field: "tpd",
          sourceId,
          sourceKind: "archive",
          verification: tpd === "parcial" ? "conflict" : "unverified",
          nature: tpd === "parcial" ? "conflicted" : "declared",
          consultedAt,
          locator: null,
          note:
            tpd === "si"
              ? "Declaración TPD heredada sin verificación independiente; no acredita cumplimiento."
              : undefined,
        },
      ],
    },
  ];
}

export function evidenceIsPublishable(evidence: FieldEvidence): boolean {
  if (evidence.verification === "verified") {
    return Boolean(evidence.sourceId && evidence.locator);
  }
  return Boolean(evidence.sourceId);
}
