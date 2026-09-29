import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { batteryMah } from "./measures.ts";

describe("batteryMah", () => {
  it("prefiere el valor entre paréntesis", () => {
    assert.equal(batteryMah("2×2200 mAh integrada (4400 mAh)"), 4400);
    assert.equal(batteryMah("2×1000 mAh integrada (2000 mAh)"), 2000);
  });

  it("multiplica el patrón N×X mAh", () => {
    assert.equal(batteryMah("2×1000 mAh integrada"), 2000);
    assert.equal(batteryMah("2×2200 mAh integrada"), 4400);
    assert.equal(batteryMah("3 x 1500 mAh"), 4500);
    assert.equal(batteryMah("2*1200 mAh"), 2400);
  });

  it("usa la única coincidencia mAh", () => {
    assert.equal(batteryMah("1000 mAh integrada"), 1000);
    assert.equal(batteryMah("1300 mAh integrada"), 1300);
    assert.equal(batteryMah("1,5 mAh"), 1.5);
  });

  it("devuelve null sin dato o con ambigüedad", () => {
    assert.equal(batteryMah("Dos 18650 externas, no incluidas"), null);
    assert.equal(batteryMah("Una 18650 externa, no incluida"), null);
    assert.equal(batteryMah("No publicada"), null);
    assert.equal(batteryMah("1000 mAh y 2000 mAh"), null);
  });
});
