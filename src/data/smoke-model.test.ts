import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSmoke,
  emit,
  EMIT_MAX,
  glyphFor,
  SMOKE_RGB_DARK_DEFAULT,
  SMOKE_RGB_LIGHT,
  SMOKE_TINT_BY_ROUTE_DARK,
  smokeTintForRoute,
  softAlphaBound,
  stepSmoke,
} from "../lib/smoke/model.ts";

const cfg = { width: 1280, height: 720, pad: 120, count: 72, cell: 16, seed: 11 };
const K_LIGHT = 0.02,
  K_DARK = 0.028,
  CAP_LIGHT = 0.1,
  CAP_DARK = 0.14; // CAP = --smoke-alpha (styles.css)

function run(seed: number, seconds: number) {
  const s = createSmoke({ ...cfg, seed });
  let worst = 0;
  for (let i = 0; i < seconds * 30; i++) {
    stepSmoke(s, 1 / 30);
    worst = Math.max(worst, softAlphaBound(s, K_DARK) * 1); // el tema oscuro es el más exigente
  }
  return { s, worst };
}

test("determinista: misma semilla, mismo estado", () => {
  const a = run(5, 20).s,
    b = run(5, 20).s;
  assert.deepEqual(
    a.puffs.map((p) => [p.x, p.y]),
    b.puffs.map((p) => [p.x, p.y]),
  );
});

test("la alfa acumulada nunca supera el tope por tema (4 semillas × 60 s)", () => {
  for (const seed of [3, 11, 29, 57]) {
    const s = createSmoke({ ...cfg, seed });
    let light = 0,
      dark = 0;
    for (let i = 0; i < 60 * 30; i++) {
      stepSmoke(s, 1 / 30);
      light = Math.max(light, softAlphaBound(s, K_LIGHT));
      dark = Math.max(dark, softAlphaBound(s, K_DARK));
    }
    assert.ok(light <= CAP_LIGHT, `claro ${light.toFixed(3)} > ${CAP_LIGHT} (semilla ${seed})`);
    assert.ok(dark <= CAP_DARK, `oscuro ${dark.toFixed(3)} > ${CAP_DARK} (semilla ${seed})`);
  }
});

test("hay movimiento perceptible: ≥ 15 px/s de ascenso medio", () => {
  const s = createSmoke({ ...cfg, seed: 1 });
  const before = s.puffs.map((p) => p.y);
  stepSmoke(s, 1);
  const rise = s.puffs.map((p, i) => before[i] - p.y).filter((d) => d > 0 && d < 200);
  const mean = rise.reduce((a, b) => a + b, 0) / rise.length;
  assert.ok(mean >= 15, `ascenso medio ${mean.toFixed(1)} px/s`);
});

test("sin NaN ni valores negativos en la rejilla", () => {
  const { s } = run(9, 30);
  for (const v of s.density) assert.ok(Number.isFinite(v) && v >= 0);
});

test("emit mantiene como máximo 3 bocanadas activas (FIFO)", () => {
  const s = createSmoke({ ...cfg, seed: 7 });
  for (let i = 0; i < 12; i++) emit(s, 100 + i * 10, 200);
  assert.equal(s.emits.length, EMIT_MAX);
  assert.equal(EMIT_MAX, 3);
  // La más antigua se va: la primera posición emitida ya no está.
  assert.equal(
    s.emits.some((p) => p.x === 100),
    false,
  );
});

test("emitir no supera la cota de alfa del tema oscuro (peor caso)", () => {
  // Se emite de forma adversarial SOBRE la celda de densidad máxima en cada
  // paso: densidad_ambiental + EMIT_MAX·EMIT_ENV = 4,5 + 0,48 = 4,98 ≤ 5,0.
  const s = createSmoke({ ...cfg, seed: 2 });
  let worst = 0;
  for (let step = 0; step < 10 * 30; step++) {
    let m = 0,
      arg = 0;
    for (let i = 0; i < s.density.length; i++) {
      if (s.density[i] > m) {
        m = s.density[i];
        arg = i;
      }
    }
    if (step % 2 === 0) {
      const cxi = arg % s.cols,
        cyj = Math.floor(arg / s.cols);
      emit(s, cxi * cfg.cell - cfg.pad, cyj * s.cellY - cfg.pad);
    }
    stepSmoke(s, 1 / 30);
    worst = Math.max(worst, softAlphaBound(s, K_DARK));
  }
  assert.ok(worst <= CAP_DARK, `oscuro ${worst.toFixed(4)} > ${CAP_DARK}`);
});

test("emit no altera el determinismo de las volutas ambientales", () => {
  const base = createSmoke({ ...cfg, seed: 33 });
  const withEmit = createSmoke({ ...cfg, seed: 33 });
  for (let i = 0; i < 120; i++) {
    stepSmoke(base, 1 / 30);
    if (i % 5 === 0) emit(withEmit, 400, 300);
    stepSmoke(withEmit, 1 / 30);
  }
  assert.deepEqual(
    base.puffs.map((p) => [p.x, p.y]),
    withEmit.puffs.map((p) => [p.x, p.y]),
  );
});

test("ASCII solo en la banda baja de densidad", () => {
  assert.equal(glyphFor(0.01), null);
  assert.equal(glyphFor(3), null);
  assert.ok(glyphFor(0.8, 0.2));
  assert.notEqual(glyphFor(1.4, 0.2)?.ch, "=");
});

test("N7: tinte por ruta solo en oscuro, sin tocar alfa ni K", () => {
  // En claro siempre gris-tinta tenue sin tinte.
  for (const path of ["/", "/dispositivos", "/resistencias/x", "/liquidos", "/componentes"]) {
    assert.equal(smokeTintForRoute(path, false), SMOKE_RGB_LIGHT);
  }
  // En oscuro cada familia (sección y ficha) tiñe su color.
  assert.equal(smokeTintForRoute("/dispositivos", true), SMOKE_TINT_BY_ROUTE_DARK["/dispositivos"]);
  assert.equal(
    smokeTintForRoute("/dispositivos/tal-cual", true),
    SMOKE_TINT_BY_ROUTE_DARK["/dispositivos"],
  );
  assert.equal(smokeTintForRoute("/resistencias", true), SMOKE_TINT_BY_ROUTE_DARK["/resistencias"]);
  assert.equal(smokeTintForRoute("/liquidos/algo", true), SMOKE_TINT_BY_ROUTE_DARK["/liquidos"]);
  assert.equal(smokeTintForRoute("/componentes", true), SMOKE_TINT_BY_ROUTE_DARK["/componentes"]);
  // Rutas sin familia: gris por defecto (el de styles.css).
  for (const path of ["/", "/buscar", "/comparar", "/dispositivos2"]) {
    assert.equal(smokeTintForRoute(path, true), SMOKE_RGB_DARK_DEFAULT);
  }
  // La función solo devuelve matiz "r g b": nunca alfa ni K.
  for (const tint of Object.values(SMOKE_TINT_BY_ROUTE_DARK)) {
    assert.match(tint, /^\d{1,3} \d{1,3} \d{1,3}$/);
  }
});
