import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consultedAtIsParseable,
  effectiveVerification,
  evidenceIsPublishable,
  evidenceIsVerified,
  tpdAsMarketRequirements,
} from "./evidence.ts";

const LEGACY_SOURCES = new Set(["archive:tpd-legacy"]);

describe("evidencia VAL-014", () => {
  it("VAL-014-01: TPD si heredado no produce meets verificado", () => {
    const [req] = tpdAsMarketRequirements("si", "2026-10-17");
    assert.ok(req);
    assert.equal(req!.status, "unknown");
    assert.notEqual(req!.status, "meets");
    assert.equal(req!.evidence[0]?.verification, "unverified");
    assert.ok(req!.evidence[0]?.sourceId);
  });

  it("VAL-014-02: verificado sin localizador no es publicable como verificado", () => {
    const row = {
      field: "tpd",
      sourceId: "src-1",
      sourceKind: "manufacturer" as const,
      verification: "verified" as const,
      nature: "declared" as const,
      consultedAt: "2026-10-17",
      locator: null,
    };
    assert.equal(evidenceIsVerified(row, new Set(["src-1"])), false);
    assert.equal(evidenceIsPublishable(row, new Set(["src-1"])), false);
    assert.equal(effectiveVerification(row), "unverified");
  });

  it("VAL-014-03: TPD parcial conserva conflicto y no elige ganador", () => {
    const [req] = tpdAsMarketRequirements("parcial", "2026-10-17");
    assert.equal(req!.status, "unknown");
    assert.equal(req!.evidence[0]?.verification, "conflict");
    assert.equal(req!.evidence[0]?.nature, "conflicted");
  });

  it("TPD no heredado no produce fails verificado", () => {
    const [req] = tpdAsMarketRequirements("no", "2026-10-17");
    assert.equal(req!.status, "declared_negative");
    assert.notEqual(req!.status, "fails");
    assert.equal(req!.evidence[0]?.verification, "unverified");
  });

  it("TPD no-aplica sin evidencia adjunta", () => {
    const [req] = tpdAsMarketRequirements("no-aplica");
    assert.equal(req!.status, "not_applicable");
    assert.equal(req!.evidence.length, 0);
  });

  it("verificado sin fecha parseable se degrada", () => {
    const row = {
      field: "tpd",
      sourceId: "src-1",
      sourceKind: "manufacturer" as const,
      verification: "verified" as const,
      nature: "declared" as const,
      consultedAt: "no-es-fecha",
      locator: "https://example.com/tpd",
    };
    assert.equal(consultedAtIsParseable(row.consultedAt), false);
    assert.equal(evidenceIsVerified(row, new Set(["src-1"])), false);
    assert.equal(evidenceIsPublishable(row, new Set(["src-1"])), false);
  });

  it("verificado sin consultedAt no es publicable como verificado", () => {
    const row = {
      field: "tpd",
      sourceId: "src-1",
      sourceKind: "manufacturer" as const,
      verification: "verified" as const,
      nature: "declared" as const,
      consultedAt: null,
      locator: "https://example.com/tpd",
    };
    assert.equal(evidenceIsVerified(row, new Set(["src-1"])), false);
    assert.equal(evidenceIsPublishable(row, new Set(["src-1"])), false);
  });

  it("declaración unverified con sourceId comprobable es publicable con cautela", () => {
    const [req] = tpdAsMarketRequirements("si", "2026-10-17");
    const ev = req!.evidence[0]!;
    assert.equal(evidenceIsVerified(ev, LEGACY_SOURCES), false);
    assert.equal(evidenceIsPublishable(ev, LEGACY_SOURCES), true);
  });

  it("sourceId huérfano: máximo unverified y no publicable con registro", () => {
    const row = {
      field: "tpd",
      sourceId: "orphan:missing",
      sourceKind: "archive" as const,
      verification: "verified" as const,
      nature: "declared" as const,
      consultedAt: "2026-10-17",
      locator: "p.12",
    };
    const registry = new Set(["archive:tpd-legacy"]);
    assert.equal(effectiveVerification(row, registry), "unverified");
    assert.equal(evidenceIsVerified(row, registry), false);
    assert.equal(evidenceIsPublishable(row, registry), false);
  });

  it("verificado completo con registro comprobable", () => {
    const row = {
      field: "tpd",
      sourceId: "manufacturer:acme-tpd-2026",
      sourceKind: "manufacturer" as const,
      verification: "verified" as const,
      nature: "declared" as const,
      consultedAt: "2026-10-17T12:00:00Z",
      locator: "https://example.com/tpd.pdf#page=4",
    };
    const registry = new Set(["manufacturer:acme-tpd-2026"]);
    assert.equal(evidenceIsVerified(row, registry), true);
    assert.equal(evidenceIsPublishable(row, registry), true);
  });
});
