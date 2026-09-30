// Modelo puro del humo (sin DOM ni canvas): determinista, testable con node --test.
// Solo sintaxis TS "borrable" (sin enums ni alias @/), como el resto de src/data.

export type SmokeConfig = {
  width: number; // px CSS del viewport
  height: number;
  pad: number; // sobredimensión del lienzo (evita el borde del blur)
  count: number; // nº de volutas
  cell: number; // ancho de celda de la rejilla ASCII (px)
  seed: number;
};

export type Puff = {
  x: number;
  y: number;
  r: number;
  t: number;
  life: number;
  vy: number;
  k: number;
  rot: number;
  squash: number;
  env: number;
  size: number;
};

export type SmokeState = {
  cfg: SmokeConfig;
  t: number;
  puffs: Puff[];
  emits: Puff[]; // bocanadas efímeras de la UI (≤ EMIT_MAX, vida corta)
  cols: number;
  rows: number;
  cellY: number;
  density: Float32Array; // Σ env·perfil(d): cota superior de la alfa acumulada / K
  rnd: () => number;
};

/** Máximo de bocanadas simultáneas: al superarlo se descarta la más antigua. */
export const EMIT_MAX = 3;
/** Vida de una bocanada (s): corta, para que no acumule consumo de alfa. */
export const EMIT_LIFE_MIN = 1.5;
export const EMIT_LIFE_MAX = 2.2;
/**
 * Pico de densidad de una bocanada. Cota de alfa garantizada:
 * densidad_ambiental_max (≤4,5, contrato `contrast.test.ts`) + EMIT_MAX · EMIT_ENV
 * = 4,5 + 3·0,16 = 4,98 ≤ 0,14/0,028 = 5,0 (cap de densidad del tema oscuro).
 * Así K·densidad_max ≤ --smoke-alpha incluso con 3 bocanadas solapadas.
 */
export const EMIT_ENV = 0.16;

// N7 — tinte por ruta SOLO en oscuro, dentro de los topes vigentes.
// Solo cambia el matiz (`--smoke-rgb` vía override inline en el canvas);
// `--smoke-alpha` y `--smoke-k` no se tocan. En claro siempre gris-tinta
// tenue sin tinte. Los cuatro tintes son grises cálidos/fríos desaturados
// (luminancia próxima al gris por defecto 200 196 188) para que el peor caso
// de contraste apenas se mueva respecto al medido en `contrast.test.ts`.
export const SMOKE_RGB_LIGHT = "120 108 92";
export const SMOKE_RGB_DARK_DEFAULT = "200 196 188";
export const SMOKE_TINT_BY_ROUTE_DARK: Record<string, string> = {
  "/dispositivos": "226 186 132", // ámbar
  "/resistencias": "140 198 205", // cian
  "/liquidos": "214 156 184", // magenta
  "/componentes": "172 164 216", // violeta
};

/**
 * Matiz del humo (`--smoke-rgb` como "r g b") para una ruta y tema.
 * Pura y testeable: en claro siempre el gris-tinta; en oscuro, el tinte de
 * la familia si el pathname es la sección o una ficha suya (`/x` o `/x/...`),
 * si no el gris por defecto. Nunca devuelve alfa ni K.
 */
export function smokeTintForRoute(pathname: string, isDark: boolean): string {
  if (!isDark) return SMOKE_RGB_LIGHT;
  for (const prefix of Object.keys(SMOKE_TINT_BY_ROUTE_DARK)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return SMOKE_TINT_BY_ROUTE_DARK[prefix] as string;
    }
  }
  return SMOKE_RGB_DARK_DEFAULT;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(x - xi),
    v = s(y - yi),
    w = s(z - zi);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

/** Perfil radial del sprite (1 en el centro, .5 en .4·r, 0 en r). */
export function profile(d: number): number {
  if (d >= 1) return 0;
  return d < 0.4 ? 1 - 1.25 * d : (0.5 * (1 - d)) / 0.6;
}

function spawn(s: SmokeState, initial: boolean): Puff {
  const { width: W, height: H, pad } = s.cfg;
  const r = s.rnd;
  const fromBottom = r() < 0.8;
  return {
    x: fromBottom ? r() * (W + pad) - pad / 2 : r() < 0.5 ? -pad / 2 : W + pad / 2,
    y: initial ? r() * (H + pad) : H + pad / 2 + r() * 40,
    r: 26 + r() * 30,
    t: initial ? r() * 14 : 0,
    life: 11 + r() * 6,
    vy: 26 + r() * 26, // px/s: 8–15× más rápido que el humo actual (0,9–3,6 px/s)
    k: 0.7 + r() * 0.7,
    rot: r() * Math.PI * 2,
    squash: 0.38 + r() * 0.22,
    env: 0,
    size: 0,
  };
}

export function createSmoke(cfg: SmokeConfig): SmokeState {
  const cellY = cfg.cell * 1.7;
  const cols = Math.ceil((cfg.width + 2 * cfg.pad) / cfg.cell);
  const rows = Math.ceil((cfg.height + 2 * cfg.pad) / cellY);
  const s: SmokeState = {
    cfg,
    t: 0,
    puffs: [],
    emits: [],
    cols,
    rows,
    cellY,
    density: new Float32Array(cols * rows),
    rnd: mulberry32(cfg.seed),
  };
  s.puffs = Array.from({ length: cfg.count }, () => spawn(s, true));
  return s;
}

/** Splat de una bocanada en la rejilla de densidad (mismo cálculo que las volutas). */
function splat(s: SmokeState, p: Puff): void {
  const { pad, cell } = s.cfg;
  const gx = (p.x + pad) / cell,
    gy = (p.y + pad) / s.cellY;
  const Rx = Math.ceil(p.size / cell),
    Ry = Math.ceil(p.size / s.cellY);
  for (let j = -Ry; j <= Ry; j++) {
    for (let i = -Rx; i <= Rx; i++) {
      const cxi = Math.floor(gx) + i,
        cyj = Math.floor(gy) + j;
      if (cxi < 0 || cyj < 0 || cxi >= s.cols || cyj >= s.rows) continue;
      const dx = (cxi + 0.5 - gx) * cell,
        dy = (cyj + 0.5 - gy) * s.cellY;
      const d = Math.hypot(dx, dy) / p.size;
      if (d < 1) s.density[cyj * s.cols + cxi] += p.env * profile(d);
    }
  }
}

/**
 * Inyecta una bocanada de vida corta en (x, y) — coordenadas de viewport, como
 * las volutas ambientales. No consume `s.rnd`: el ruido de las volutas
 * ambientales sigue siendo determinista con o sin emisiones. Si ya hay
 * EMIT_MAX activas, descarta la más antigua (FIFO) para acotar la suma.
 */
export function emit(s: SmokeState, x: number, y: number): void {
  const h = hash3(Math.round(x), Math.round(y), Math.round(s.t * 1000));
  if (s.emits.length >= EMIT_MAX) s.emits.shift();
  s.emits.push({
    x,
    y,
    r: 20 + h * 20, // 20–40 px: nítida, pero sin gran huella en la rejilla
    t: 0,
    life: EMIT_LIFE_MIN + h * (EMIT_LIFE_MAX - EMIT_LIFE_MIN),
    vy: 16 + h * 16,
    k: 0.6 + h * 0.6,
    rot: h * Math.PI * 2,
    squash: 0.6 + ((h * 7) % 1) * 0.25,
    env: 0,
    size: 0,
  });
}

export function stepSmoke(s: SmokeState, dt: number): void {
  const { pad } = s.cfg;
  s.t += dt;
  s.density.fill(0);
  const f = 0.0016,
    e = 2,
    tz = s.t * 0.11;
  for (const p of s.puffs) {
    // curl 2D del ruido de valor: flujo sin divergencia (remolinos, no deriva uniforme)
    const n = (a: number, b: number) => vnoise(a * f, b * f, tz);
    const cx = ((n(p.x, p.y + e) - n(p.x, p.y - e)) / (2 * e)) * f * 1400 * p.k * 0.9;
    const cy = (-(n(p.x + e, p.y) - n(p.x - e, p.y)) / (2 * e)) * f * 1400 * p.k * 0.9;
    p.x += (cx * 40 + (p.k - 1) * 6) * dt;
    p.y += (-p.vy + cy * 40) * dt;
    p.t += dt;
    p.rot += dt * 0.04;
    const u = p.t / p.life;
    if (u >= 1 || p.y < -pad) {
      Object.assign(p, spawn(s, false));
      continue;
    }
    p.env = Math.sin(Math.PI * u) ** 1.25;
    p.size = p.r * (1 + u * 1.4);
    splat(s, p);
  }
  // Bocanadas de la UI: misma rejilla y splat, sin tocar s.puffs ni s.rnd.
  for (let i = s.emits.length - 1; i >= 0; i--) {
    const p = s.emits[i];
    p.x += (p.k - 1) * 6 * dt;
    p.y += -p.vy * dt;
    p.t += dt;
    p.rot += dt * 0.25;
    const u = p.t / p.life;
    if (u >= 1) {
      s.emits.splice(i, 1);
      continue;
    }
    p.env = EMIT_ENV * Math.sin(Math.PI * u) ** 1.25;
    p.size = p.r * (1 + u * 1.0);
    splat(s, p);
  }
}

/** Cota superior de la alfa acumulada del humo suave: K · max(densidad). */
export function softAlphaBound(s: SmokeState, k: number): number {
  let m = 0;
  for (const v of s.density) if (v > m) m = v;
  return Math.min(1, k * m);
}

/** Glifo ASCII para una densidad, o null: solo la banda baja (estela que se disuelve).
 *  `bayer` ∈ [0,1) tramado ordenado por celda: rompe las bandas y da contorno orgánico. */
export const ASCII_RAMP = [".", "·", ":", "~", "="] as const;
export const ASCII_LOW = 0.1;
export const ASCII_HIGH = 1.5;
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(col: number, row: number): number {
  return (BAYER4[(row & 3) * 4 + (col & 3)] + 0.5) / 16;
}
export function glyphFor(d: number, dither = 0.5): { ch: string; strength: number } | null {
  if (d < ASCII_LOW || d > ASCII_HIGH) return null;
  const t = (d - ASCII_LOW) / (ASCII_HIGH - ASCII_LOW); // 0..1 dentro de la banda
  const presence = Math.sin(Math.PI * t) ** 0.8; // 0 en los extremos, 1 en el centro
  if (presence < dither) return null; // tramado: menos celdas en los bordes de la banda
  const idx = Math.min(ASCII_RAMP.length - 2, Math.floor(t * (ASCII_RAMP.length - 1))); // "=" reservado
  return { ch: ASCII_RAMP[idx], strength: presence };
}
