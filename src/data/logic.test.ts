import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilBySlug, deviceBySlug } from "./catalog.ts";
import { compatibility, mixNicotine, round, shotsForTarget, solveOhm } from "./logic.ts";

describe("ley de Ohm", () => {
  it("cierra potencia y resistencia", () => {
    const result = solveOhm({ ohms: 0.8, watts: 14 });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(round(result.amps, 2), round(Math.sqrt(14 / 0.8), 2));
    assert.ok(Math.abs(result.volts - result.amps * 0.8) < 1e-9);
  });

  it("rechaza resistencia nula", () => {
    const result = solveOhm({ ohms: 0, watts: 10 });
    assert.equal("error" in result, true);
  });
});

describe("nicokit", () => {
  it("50 ml + un shot de 10 ml a 20 mg quedan en 3,33 mg/ml", () => {
    const result = mixNicotine({
      aromaMl: 50,
      bottleMl: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 1,
    });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(round(result.mgPerMl, 2), 3.33);
    assert.equal(result.overflow, false);
    assert.equal(result.overTpdStrength, false);
  });

  it("avisa si el shot no cabe", () => {
    const result = mixNicotine({
      aromaMl: 50,
      bottleMl: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 2,
    });
    assert.equal("error" in result, false);
    if ("error" in result) return;
    assert.equal(result.overflow, true);
  });

  it("calcula un shot para el ejemplo clásico", () => {
    const shots = shotsForTarget(50, 10, 20, 20 / 6);
    assert.equal(typeof shots, "number");
    if (typeof shots !== "number") return;
    assert.ok(Math.abs(shots - 1) < 0.02);
  });
});

describe("cruce", () => {
  it("la cápsula XROS es nativa en el XROS 4", () => {
    const device = deviceBySlug("vaporesso-xros-4");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });

  it("la Z 0,2 va en el tanque del kit L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("geekvape-z-0-2");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "kit");
  });

  it("la Z 0,2 no entra en el T18 II", () => {
    const device = deviceBySlug("innokin-endura-t18-ii");
    const coil = coilBySlug("geekvape-z-0-2");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("una cápsula XROS no entra en el L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("xros-corex-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("una GTX de 0,15 Ω no cabe en el LUXE X de 40 W", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-15");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "no");
  });

  it("la Z 0,15 no se da por kit del L200", () => {
    const device = deviceBySlug("geekvape-aegis-legend-2");
    const coil = coilBySlug("geekvape-z-0-15");
    assert.ok(device && coil);
    if (!device || !coil) return;
    const result = compatibility(device, coil);
    assert.notEqual(result.kind, "kit");
    assert.notEqual(result.kind, "nativa");
    assert.match(result.reasons.join(" "), /PDF/);
  });

  it("una GTX de 0,8 Ω es nativa en el LUXE X", () => {
    const device = deviceBySlug("vaporesso-luxe-x");
    const coil = coilBySlug("vaporesso-gtx-0-8");
    assert.ok(device && coil);
    if (!device || !coil) return;
    assert.equal(compatibility(device, coil).kind, "nativa");
  });
});
