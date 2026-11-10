import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ohmModeChanged,
  ohmModeForSearch,
  parseToolSearch,
  resolveOhmMode,
} from "../components/tool-search.ts";

test("parseToolSearch acepta números de la query como string", () => {
  assert.deepEqual(
    parseToolSearch({
      tab: "nicokit",
      aroma: 50,
      botella: 60,
      shotMl: 10,
      shotMg: 20,
      shots: 1,
    }),
    {
      tab: "nicokit",
      modo: undefined,
      ohms: undefined,
      watts: undefined,
      volts: undefined,
      device: undefined,
      aroma: "50",
      botella: "60",
      shotMl: "10",
      shotMg: "20",
      shots: "1",
      objetivo: undefined,
    },
  );
});

test("parseToolSearch conserva strings y descarta no finitos", () => {
  assert.equal(parseToolSearch({ aroma: "50,5" }).aroma, "50,5");
  assert.equal(parseToolSearch({ aroma: Number.NaN }).aroma, undefined);
  assert.equal(parseToolSearch({ aroma: Number.POSITIVE_INFINITY }).aroma, undefined);
});

test("parseToolSearch acepta modo válido y descarta inválido", () => {
  assert.equal(parseToolSearch({ modo: "watts" }).modo, "watts");
  assert.equal(parseToolSearch({ modo: "volts" }).modo, "volts");
  assert.equal(parseToolSearch({ modo: "watios" }).modo, undefined);
  assert.equal(parseToolSearch({ modo: ["volts"] }).modo, undefined);
  assert.equal(parseToolSearch({ modo: { x: "volts" } }).modo, undefined);
});

test("resolveOhmMode: precedencia modo explícito", () => {
  assert.equal(resolveOhmMode({ modo: "watts", volts: "3.7" }), "watts");
  assert.equal(resolveOhmMode({ modo: "volts", volts: "3.7" }), "volts");
});

test("resolveOhmMode: legado con volts no vacío", () => {
  assert.equal(resolveOhmMode({ volts: "3.7" }), "volts");
  assert.equal(resolveOhmMode({ volts: "0" }), "volts");
});

test("resolveOhmMode: vacío no activa legado ni cuenta como cero", () => {
  assert.equal(resolveOhmMode({}), "watts");
  assert.equal(resolveOhmMode({ volts: "" }), "watts");
  assert.equal(resolveOhmMode({ volts: undefined }), "watts");
});

test("resolveOhmMode: enlace solo ohms abre vatios", () => {
  assert.equal(resolveOhmMode(parseToolSearch({ tab: "ohm", ohms: "0.8" })), "watts");
});

test("ohmModeForSearch fija modo y limpia el campo inactivo", () => {
  assert.deepEqual(ohmModeForSearch("watts", { ohms: "0.8", volts: "3.7", watts: "14" }), {
    tab: "ohm",
    modo: "watts",
    ohms: "0.8",
    watts: "14",
    volts: undefined,
  });
  assert.deepEqual(ohmModeForSearch("volts", { ohms: "0.8", volts: "3.7", watts: "14" }), {
    tab: "ohm",
    modo: "volts",
    ohms: "0.8",
    volts: "3.7",
    watts: undefined,
  });
});

test("ohmModeChanged detecta cambio real de modo", () => {
  assert.equal(
    ohmModeChanged(parseToolSearch({ modo: "watts" }), parseToolSearch({ modo: "volts" })),
    true,
  );
  assert.equal(
    ohmModeChanged(parseToolSearch({ modo: "watts" }), parseToolSearch({ modo: "watts" })),
    false,
  );
  assert.equal(
    ohmModeChanged(parseToolSearch({ watts: "14" }), parseToolSearch({ modo: "volts" })),
    true,
  );
});
