import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decide,
  indexToTier,
  initialTierIndex,
  isFxPref,
  TierGovernor,
  tierToIndex,
} from "../lib/fx/controller.ts";

test("isFxPref solo acepta auto|on|off", () => {
  assert.equal(isFxPref("auto"), true);
  assert.equal(isFxPref("on"), true);
  assert.equal(isFxPref("off"), true);
  assert.equal(isFxPref("maybe"), false);
  assert.equal(isFxPref(null), false);
});

test("decide: off del usuario manda", () => {
  assert.deepEqual(decide("off", { reduced: false, saveData: false }), {
    mode: "off",
    reason: "user-off",
  });
  assert.deepEqual(decide("off", { reduced: true, saveData: true }), {
    mode: "off",
    reason: "user-off",
  });
});

test("decide: Save-Data con auto → off; con on → animated", () => {
  assert.deepEqual(decide("auto", { reduced: false, saveData: true }), {
    mode: "off",
    reason: "save-data",
  });
  assert.deepEqual(decide("on", { reduced: false, saveData: true }), {
    mode: "animated",
    reason: "ok",
  });
});

test("decide: reduced-motion con auto → static; con on → animated", () => {
  assert.deepEqual(decide("auto", { reduced: true, saveData: false }), {
    mode: "static",
    reason: "reduced-motion",
  });
  assert.deepEqual(decide("on", { reduced: true, saveData: false }), {
    mode: "animated",
    reason: "ok",
  });
});

test("decide: auto sin restricciones → animated/ok", () => {
  assert.deepEqual(decide("auto", { reduced: false, saveData: false }), {
    mode: "animated",
    reason: "ok",
  });
});

test("TierGovernor baja tras 2 s lentos y recupera tras 10 s rápidos", () => {
  const g = new TierGovernor(3, 3);
  assert.equal(g.tier, 3);
  // ~2.1 s a 25 ms/frame
  for (let i = 0; i < 85; i++) g.frame(25);
  assert.equal(g.tier, 2);
  // 10 s estables a 16 ms
  for (let i = 0; i < 630; i++) g.frame(16);
  assert.equal(g.tier, 3);
});

test("TierGovernor no supera el techo max", () => {
  const g = new TierGovernor(1, 2);
  for (let i = 0; i < 700; i++) g.frame(16);
  assert.equal(g.tier, 2);
});

test("initialTierIndex: pocos núcleos → techo Q1 (índice 2)", () => {
  assert.equal(initialTierIndex(1440, 8), 0);
  assert.equal(initialTierIndex(1440, 4), 2);
  assert.equal(initialTierIndex(800, 8), 1);
  assert.equal(initialTierIndex(360, 8), 2);
});

test("tierToIndex / indexToTier son inversos", () => {
  for (const t of [1, 2, 3] as const) {
    assert.equal(indexToTier(tierToIndex(t)), t);
  }
});
