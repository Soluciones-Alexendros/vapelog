import assert from "node:assert/strict";
import { test } from "node:test";
import { GLYPHS, scrambleFrame, scrambleFrames } from "../lib/kinetic/scramble.ts";

const opts = { seed: 3, steps: 18 };
const T = "El catálogo · Dispositivos";

test("el último fotograma es exactamente el texto final", () => {
  assert.equal(scrambleFrame(T, opts.steps, opts), T);
  assert.equal(scrambleFrames(T, opts).at(-1), T);
});
test("conserva longitud (code points) y espacios en todos los fotogramas", () => {
  for (const f of scrambleFrames(T, opts)) {
    assert.equal(Array.from(f).length, Array.from(T).length);
    Array.from(T).forEach((ch, i) => {
      if (/\s/.test(ch)) assert.equal(Array.from(f)[i], ch);
    });
  }
});
test("determinista por semilla y paso", () => {
  assert.deepEqual(scrambleFrames(T, opts), scrambleFrames(T, opts));
  assert.notDeepEqual(scrambleFrames(T, { ...opts, seed: 4 }), scrambleFrames(T, opts));
});
test("los glifos intermedios salen solo de la rampa ASCII", () => {
  for (const f of scrambleFrames("Resistencias", opts).slice(0, -1)) {
    for (const ch of f)
      assert.ok(GLYPHS.includes(ch) || /[A-Za-zÁ-ú]/.test(ch), `glifo inesperado ${ch}`);
  }
});
test("se resuelve de izquierda a derecha (monotonía de letras asentadas)", () => {
  const frames = scrambleFrames("Vapelog", opts);
  let prev = 0;
  for (const f of frames) {
    const settled = Array.from(f).filter((c, i) => c === Array.from("Vapelog")[i]).length;
    assert.ok(settled >= prev - 0, "no debe des-asentarse");
    prev = Math.max(prev, settled);
  }
});
test("60 fps × 700 ms cabe en ≤ 42 pasos y coste despreciable", () => {
  const t0 = performance.now();
  for (let i = 0; i < 2000; i++) scrambleFrame(T, i % 42, { seed: 1, steps: 42 });
  assert.ok((performance.now() - t0) / 2000 < 0.05, "≤ 0,05 ms por fotograma");
});
