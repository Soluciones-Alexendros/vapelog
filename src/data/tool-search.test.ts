import assert from "node:assert/strict";
import { test } from "node:test";
import { parseToolSearch } from "../components/tool-search.ts";

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
