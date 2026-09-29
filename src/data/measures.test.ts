import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ohmBandId,
  ohmBands,
  powerBandId,
  powerBands,
  publishedText,
  ratioParts,
} from "./measures.ts";

describe("publishedText", () => {
  it("devuelve null sin dato o con frase de ausencia", () => {
    assert.equal(publishedText(null), null);
    assert.equal(publishedText(""), null);
    assert.equal(publishedText("Sin dato publicado"), null);
    assert.equal(publishedText("No publicada"), null);
  });

  it("recorta el texto publicado", () => {
    assert.equal(publishedText("  USB-C  "), "USB-C");
  });
});

describe("ratioParts", () => {
  it("desglosa un ratio VG/PG", () => {
    assert.deepEqual(ratioParts("50/50"), { vg: 50, pg: 50 });
    assert.deepEqual(ratioParts("70/30"), { vg: 70, pg: 30 });
  });

  it("acepta coma decimal", () => {
    assert.deepEqual(ratioParts("60,5/39,5" as `${number}/${number}`), { vg: 60.5, pg: 39.5 });
  });

  it("devuelve null sin ratio o con formato inválido", () => {
    assert.equal(ratioParts(null), null);
    assert.equal(ratioParts("50-50" as `${number}/${number}`), null);
  });
});

describe("ohmBandId", () => {
  it("clasifica por tramos", () => {
    assert.equal(ohmBandId(0.2), "baja");
    assert.equal(ohmBandId(0.4), "media");
    assert.equal(ohmBandId(0.8), "alta");
    assert.equal(ohmBandId(1.2), "muy");
  });

  it("las bandas cubren todo el rango", () => {
    assert.equal(ohmBands.length, 4);
  });
});

describe("powerBandId", () => {
  it("clasifica por techo de vatios", () => {
    assert.equal(powerBandId(30), "baja");
    assert.equal(powerBandId(80), "media");
    assert.equal(powerBandId(81), "alta");
  });

  it("las bandas cubren todo el rango", () => {
    assert.equal(powerBands.length, 3);
  });
});
