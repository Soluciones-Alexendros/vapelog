import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateElectricalSubdimensions,
  evaluatePowerIntervalOverlap,
  evaluateValueInWindow,
} from "./dimension-window.ts";

describe("evaluateValueInWindow U2", () => {
  it("sin límites → unknown con razón", () => {
    const r = evaluateValueInWindow(0.8, null, null, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "unknown");
    assert.ok(r.reasons.length > 0);
  });

  it("ventana completa y valor dentro → match", () => {
    const r = evaluateValueInWindow(0.8, 0.5, 1.2, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "match");
  });

  it("solo mínimo respetado → unknown, no match", () => {
    const r = evaluateValueInWindow(0.8, 0.5, null, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "unknown");
    assert.match(r.reasons.join(" "), /otro extremo/i);
  });

  it("solo máximo respetado → unknown", () => {
    const r = evaluateValueInWindow(12, null, 40, { noun: "potencia", unit: "W" });
    assert.equal(r.verdict, "unknown");
  });

  it("contradicción en un solo extremo → mismatch", () => {
    const r = evaluateValueInWindow(0.3, 0.5, null, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "mismatch");
  });

  it("rango invertido → mismatch", () => {
    const r = evaluateValueInWindow(1, 2, 0.5, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "mismatch");
  });

  it("no finito → unknown", () => {
    const r = evaluateValueInWindow(Number.NaN, 0.5, 1, { noun: "ohmios", unit: "Ω" });
    assert.equal(r.verdict, "unknown");
  });
});

describe("evaluatePowerIntervalOverlap U2", () => {
  it("intervalos disjuntos → mismatch", () => {
    const r = evaluatePowerIntervalOverlap(5, 25, 40, 60);
    assert.equal(r.verdict, "mismatch");
  });

  it("solape parcial → match con tramo", () => {
    const r = evaluatePowerIntervalOverlap(5, 40, 25, 60);
    assert.equal(r.verdict, "match");
    assert.match(r.reasons.join(" "), /25–40 W/);
  });

  it("extremos parciales → unknown", () => {
    const r = evaluatePowerIntervalOverlap(5, null, 10, 20);
    assert.equal(r.verdict, "unknown");
  });
});

describe("evaluateElectricalSubdimensions U2", () => {
  it("ambas subdimensiones match → sufficiency match", () => {
    const subs = evaluateElectricalSubdimensions(0.8, 0.5, 1.2, 5, 40, 10, 20);
    assert.equal(subs.resistanceAdmission.verdict, "match");
    assert.equal(subs.powerOverlap.verdict, "match");
    assert.equal(subs.sufficiency.verdict, "match");
    assert.ok(subs.sufficiency.reasons.length > 0);
  });

  it("físico no aplica: sufficiency puede ser unknown sin fabricar match", () => {
    const subs = evaluateElectricalSubdimensions(0.8, null, null, null, null, null, null);
    assert.equal(subs.sufficiency.verdict, "unknown");
  });
});
