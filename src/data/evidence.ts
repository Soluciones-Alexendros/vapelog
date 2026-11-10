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

/** `fails` solo ante incumplimiento verificado; `declared_negative` conserva el «no» heredado sin elevar certeza. */
export type MarketRequirementStatus =
  "meets" | "fails" | "unknown" | "not_applicable" | "declared_negative";

export interface MarketRequirement {
  market: string;
  code: string;
  status: MarketRequirementStatus;
  asOf: string | null;
  evidence: FieldEvidence[];
}

export function consultedAtIsParseable(consultedAt: string | null): boolean {
  if (consultedAt == null) return false;
  const trimmed = consultedAt.trim();
  if (!trimmed) return false;
  return Number.isFinite(Date.parse(trimmed));
}

export function sourceIdIsCheckable(
  sourceId: string,
  knownSourceIds?: ReadonlySet<string>,
): boolean {
  const trimmed = sourceId.trim();
  if (!trimmed) return false;
  if (knownSourceIds === undefined) return true;
  return knownSourceIds.has(sourceId);
}

/** Criterios estructurales de verificación (sin resolver el registro de fuente). */
export function evidenceMeetsVerifiedShape(evidence: FieldEvidence): boolean {
  return (
    Boolean(evidence.sourceId?.trim()) &&
    Boolean(evidence.locator?.trim()) &&
    consultedAtIsParseable(evidence.consultedAt)
  );
}

/**
 * Estado de verificación efectivo: `verified` declarado sin respaldo o con
 * `sourceId` huérfano se degrada a `unverified` (VAL-014-02).
 */
export function effectiveVerification(
  evidence: FieldEvidence,
  knownSourceIds?: ReadonlySet<string>,
): VerificationStatus {
  if (evidence.verification !== "verified") {
    return evidence.verification;
  }
  if (!evidenceMeetsVerifiedShape(evidence)) {
    return "unverified";
  }
  if (!sourceIdIsCheckable(evidence.sourceId, knownSourceIds)) {
    return "unverified";
  }
  return "verified";
}

export function evidenceIsVerified(
  evidence: FieldEvidence,
  knownSourceIds?: ReadonlySet<string>,
): boolean {
  return effectiveVerification(evidence, knownSourceIds) === "verified";
}

/**
 * Publicación con cautela (declaración no verificada) vs dato verificado.
 * Verificado exige forma completa y `sourceId` comprobable cuando hay registro.
 */
export function evidenceIsPublishable(
  evidence: FieldEvidence,
  knownSourceIds?: ReadonlySet<string>,
): boolean {
  if (evidence.verification === "verified") {
    const effective = effectiveVerification(evidence, knownSourceIds);
    if (effective !== "verified") {
      return false;
    }
    return evidenceMeetsVerifiedShape(evidence);
  }
  const effective = effectiveVerification(evidence, knownSourceIds);
  if (effective === "conflict" || effective === "stale" || effective === "unverified") {
    if (!evidence.sourceId?.trim()) return false;
    if (knownSourceIds !== undefined) {
      return sourceIdIsCheckable(evidence.sourceId, knownSourceIds);
    }
    return true;
  }
  return false;
}

/**
 * TPD heredado sin verificación → sin `meets` ni `fails` probados (VAL-014-01).
 * `no` heredado → `declared_negative`, no incumplimiento verificado.
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

  const status: MarketRequirementStatus =
    tpd === "no" ? "declared_negative" : tpd === "parcial" ? "unknown" : "unknown";

  const verification: VerificationStatus = tpd === "parcial" ? "conflict" : "unverified";
  const nature: DatumNature = tpd === "parcial" ? "conflicted" : "declared";

  let note: string | undefined;
  if (tpd === "si") {
    note = "Declaración TPD heredada sin verificación independiente; no acredita cumplimiento.";
  } else if (tpd === "no") {
    note =
      "Declaración TPD negativa heredada sin verificación independiente; no acredita incumplimiento.";
  } else if (tpd === "parcial") {
    note = "Declaración TPD parcial heredada; conflicto editorial conservado.";
  }

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
          verification,
          nature,
          consultedAt,
          locator: null,
          note,
        },
      ],
    },
  ];
}
