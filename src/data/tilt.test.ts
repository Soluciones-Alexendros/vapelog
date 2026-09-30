import assert from "node:assert/strict";
import { test } from "node:test";
import { tiltFromPointer } from "../lib/fx/tilt.ts";

const rect = { x: 10, y: 20, width: 200, height: 100 };

test("centro → rx 0, ry 0 y mx/my al centro", () => {
  const r = tiltFromPointer(rect, 110, 70);
  assert.equal(r.rx, 0);
  assert.equal(r.ry, 0);
  assert.equal(r.mx, 100);
  assert.equal(r.my, 50);
});

test("bordes izquierdo/derecho → ry ∓maxDeg con maxDeg por defecto", () => {
  const left = tiltFromPointer(rect, 10, 70);
  const right = tiltFromPointer(rect, 210, 70);
  assert.equal(left.ry, -4);
  assert.equal(right.ry, 4);
  assert.equal(left.rx, 0);
  assert.equal(right.rx, 0);
});

test("bordes superior/inferior → rx ±maxDeg con maxDeg por defecto", () => {
  const top = tiltFromPointer(rect, 110, 20);
  const bottom = tiltFromPointer(rect, 110, 120);
  assert.equal(top.rx, 4);
  assert.equal(bottom.rx, -4);
  assert.equal(top.ry, 0);
  assert.equal(bottom.ry, 0);
});

test("esquinas → ±maxDeg combinados", () => {
  assert.deepEqual(tiltFromPointer(rect, 10, 20), { rx: 4, ry: -4, mx: 0, my: 0 });
  assert.deepEqual(tiltFromPointer(rect, 210, 20), { rx: 4, ry: 4, mx: 200, my: 0 });
  assert.deepEqual(tiltFromPointer(rect, 10, 120), { rx: -4, ry: -4, mx: 0, my: 100 });
  assert.deepEqual(tiltFromPointer(rect, 210, 120), { rx: -4, ry: 4, mx: 200, my: 100 });
});

test("puntero fuera del rect → rx/ry con clamp a ±maxDeg", () => {
  const farLeft = tiltFromPointer(rect, -1000, 70);
  const farRight = tiltFromPointer(rect, 1000, 70);
  const farTop = tiltFromPointer(rect, 110, -1000);
  const farBottom = tiltFromPointer(rect, 110, 1000);
  assert.equal(farLeft.ry, -4);
  assert.equal(farRight.ry, 4);
  assert.equal(farTop.rx, 4);
  assert.equal(farBottom.rx, -4);
  for (const r of [farLeft, farRight, farTop, farBottom]) {
    assert.ok(Math.abs(r.rx) <= 4 && Math.abs(r.ry) <= 4);
  }
});

test("maxDeg personalizado y mx/my en px relativos", () => {
  const r = tiltFromPointer(rect, 210, 20, 10);
  assert.equal(r.rx, 10);
  assert.equal(r.ry, 10);
  assert.equal(r.mx, 200);
  assert.equal(r.my, 0);
  const half = tiltFromPointer(rect, 60, 45, 8);
  assert.equal(half.ry, -4);
  assert.equal(half.rx, 4);
  assert.equal(half.mx, 50);
  assert.equal(half.my, 25);
});
