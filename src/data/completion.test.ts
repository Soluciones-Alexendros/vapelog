import assert from "node:assert/strict";
import { test } from "node:test";
import { coils, devices, liquids, parts } from "./catalog.ts";
import { completion, specApplies } from "./completion.ts";
import { defsFor } from "./spec-def.ts";

test("un pod integrado no cuenta la celda en el denominador", () => {
  const item = devices.find((row) => row.slug === "vaporesso-xros-4");
  assert.ok(item);
  const cell = defsFor("device").find((def) => def.key === "cell");
  assert.ok(cell);
  assert.equal(specApplies(item, cell), false);
  const score = completion(item);
  assert.equal(
    score.missing.some((gap) => gap.key === "cell"),
    false,
  );
  assert.ok(score.total > 0);
  assert.ok(score.pct >= 0 && score.pct <= 100);
});

test("un mod de celda externa no cuenta los mAh integrados", () => {
  const item = devices.find((row) => row.batteryKind === "externa");
  assert.ok(item);
  const mah = defsFor("device").find((def) => def.key === "battery_mah");
  assert.ok(mah);
  assert.equal(specApplies(item, mah), false);
});

test("un líquido a 0 mg no trata la nicotina como hueco", () => {
  const item = liquids.find((row) => row.variations.every((variation) => !variation.hasNicotine));
  assert.ok(item);
  const nic = defsFor("liquid").find((def) => def.key === "nicotine_mg");
  assert.ok(nic);
  assert.equal(specApplies(item, nic), false);
  assert.equal(
    completion(item).missing.some((gap) => gap.key === "nicotine_mg"),
    false,
  );
});

test("una boquilla pide diámetro y no química de celda", () => {
  const item = parts.find((row) => row.familyId === "boquilla");
  assert.ok(item);
  const drip = defsFor("part").find((def) => def.key === "drip_mm");
  const chem = defsFor("part").find((def) => def.key === "chemistry");
  assert.ok(drip && chem);
  assert.equal(specApplies(item, drip), true);
  assert.equal(specApplies(item, chem), false);
  const score = completion(item);
  assert.equal(score.hasPhoto, false);
  assert.ok(score.missing.some((gap) => gap.key === "photo"));
  assert.ok(score.missing.some((gap) => gap.key === "drip_mm"));
});

test("una resistencia con foto y ohmios tiene cobertura alta", () => {
  const item = coils[0];
  assert.ok(item);
  const score = completion(item);
  assert.equal(score.hasPhoto, true);
  assert.ok(score.pct >= 70);
});
