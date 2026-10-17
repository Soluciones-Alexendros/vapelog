import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evidenceIsPublishable, tpdAsMarketRequirements } from "./evidence.ts";

describe("evidencia VAL-014", () => {
  it("VAL-014-01: TPD si heredado no produce meets verificado", () => {
    const [req] = tpdAsMarketRequirements("si", "2026-10-17");
    assert.ok(req);
    assert.equal(req!.status, "unknown");
    assert.notEqual(req!.status, "meets");
    assert.equal(req!.evidence[0]?.verification, "unverified");
    assert.ok(req!.evidence[0]?.sourceId);
  });

  it("VAL-014-02: verificado sin localizador no es publicable", () => {
    assert.equal(
      evidenceIsPublishable({
        field: "tpd",
        sourceId: "src-1",
        sourceKind: "manufacturer",
        verification: "verified",
        nature: "declared",
        consultedAt: "2026-10-17",
        locator: null,
      }),
      false,
    );
  });
});
