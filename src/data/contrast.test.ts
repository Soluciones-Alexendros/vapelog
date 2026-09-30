import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createSmoke, stepSmoke } from "../lib/smoke/model.ts";

type Oklch = { l: number; c: number; h: number };
type TokenMap = Map<string, Oklch>;

function css(): string {
  return readFileSync(new URL("../styles.css", import.meta.url), "utf8");
}

function blockBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  assert.ok(start >= 0, startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(end > start, endMarker);
  return source.slice(start, end);
}

function collectTokens(block: string): TokenMap {
  const tokens: TokenMap = new Map();
  for (const m of block.matchAll(/--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
    tokens.set(`--${m[1]}`, { l: Number(m[2]), c: Number(m[3]), h: Number(m[4]) });
  }
  return tokens;
}

function requireToken(tokens: TokenMap, name: string): Oklch {
  const token = tokens.get(name);
  assert.ok(token, `${name} definido`);
  return token;
}

function srgbChannel(value: number): number {
  const abs = Math.abs(value);
  const encoded = abs > 0.0031308 ? 1.055 * abs ** (1 / 2.4) - 0.055 : 12.92 * value;
  return Math.min(1, Math.max(0, encoded));
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Oklch): number {
  const hue = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hue);
  const b = color.c * Math.sin(hue);
  const l_ = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = color.l - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const red = linearize(srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
  const green = linearize(srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s));
  const blue = linearize(srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(a: Oklch, b: Oklch): number {
  const left = luminance(a);
  const right = luminance(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function srgbChannels(o: Oklch): [number, number, number] {
  const hue = (o.h * Math.PI) / 180;
  const a = o.c * Math.cos(hue);
  const b = o.c * Math.sin(hue);
  const l_ = o.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = o.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = o.l - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    Math.round(255 * srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    Math.round(255 * srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    Math.round(255 * srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

function srgbToHex(o: Oklch): string {
  return srgbChannels(o)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

// Pares de tinta sobre superficie: texto pequeño, WCAG AA exige 4,5:1.
const TEXT_PAIRS: Array<[string, string]> = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--card-foreground", "--card"],
  ["--popover-foreground", "--popover"],
  ["--muted-foreground", "--background"],
  ["--muted-foreground", "--card"],
  ["--primary", "--background"],
  ["--primary", "--card"],
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--accent-foreground", "--accent"],
  ["--destructive-foreground", "--destructive"],
];

// Acentos como tinta sobre fondo: uso no textual, WCAG exige 3:1.
const ACCENT_PAIRS: Array<[string, string]> = [
  ["--destructive", "--background"],
  ["--destructive", "--card"],
];

// Bordes de control medidos sobre el fondo de la aplicación. Desde F1
// (ADR-0005) `--border` es un hairline decorativo, sin requisito de contraste
// WCAG 1.4.11; el borde accesible de controles es `--border-strong`, al que
// `--input` referencia su valor.
const BORDER_TOKENS = ["--border-strong", "--input", "--ring"];

function assertTheme(label: string, tokens: TokenMap) {
  it(`${label}: texto pequeño supera 4,5:1 sobre sus fondos`, () => {
    for (const [inkName, surfaceName] of TEXT_PAIRS) {
      const ink = requireToken(tokens, inkName);
      const surface = requireToken(tokens, surfaceName);
      assert.ok(
        contrast(ink, surface) >= 4.5,
        `${label} ${inkName}/${surfaceName} ${contrast(ink, surface)}`,
      );
    }
  });

  it(`${label}: acentos y controles superan 3:1`, () => {
    // destructive como tinta sobre fondo es uso gráfico (iconos, acentos):
    // con fondo oscuro no puede cumplir 4,5:1 a la vez que
    // destructive-foreground/destructive; WCAG exige 3:1 para no texto.
    for (const [inkName, surfaceName] of ACCENT_PAIRS) {
      const ink = requireToken(tokens, inkName);
      const surface = requireToken(tokens, surfaceName);
      assert.ok(
        contrast(ink, surface) >= 3,
        `${label} ${inkName}/${surfaceName} ${contrast(ink, surface)}`,
      );
    }
    for (const name of BORDER_TOKENS) {
      const ink = requireToken(tokens, name);
      const surface = requireToken(tokens, "--background");
      assert.ok(contrast(ink, surface) >= 3, `${label} ${name} ${contrast(ink, surface)}`);
    }
  });

  return { background: requireToken(tokens, "--background") };
}

// --- Tokens previstos en F1 (ADR-0005): superficies, estados, borde fuerte ---

/**
 * Contrato de tokens nuevo del design system v2. F0 no define estos tokens:
 * cada categoría se ACTIVA automáticamente en cuanto aparece al menos uno de
 * sus tokens (`triggers`) en `src/styles.css`, y al activarse exige el
 * contrato COMPLETO (F1 no puede añadir `--surface-1` sin `--surface-2/3` ni
 * `--success` sin `--success-foreground`). Los `triggers` solo listan tokens
 * nuevos: las superficies existentes (`--background`, `--card`) no activan
 * nada por sí solas. Mientras ningún trigger exista, el chequeo se omite y la
 * línea base F0 permanece verde.
 */
type F1Category = {
  name: string;
  min: number;
  triggers: string[];
  pairs: Array<[string, string]>;
};

const F1_CATEGORIES: F1Category[] = [
  {
    name: "texto",
    min: 4.5,
    triggers: [
      "--surface-1",
      "--surface-2",
      "--surface-3",
      "--success",
      "--warning",
      "--info",
      "--success-foreground",
      "--warning-foreground",
      "--info-foreground",
    ],
    pairs: [
      ["--foreground", "--surface-1"],
      ["--foreground", "--surface-2"],
      ["--foreground", "--surface-3"],
      ["--muted-foreground", "--surface-1"],
      ["--muted-foreground", "--surface-2"],
      ["--muted-foreground", "--surface-3"],
      ["--success-foreground", "--success"],
      ["--warning-foreground", "--warning"],
      ["--info-foreground", "--info"],
    ],
  },
  {
    name: "acentos",
    min: 3,
    triggers: ["--success", "--warning", "--info"],
    pairs: [
      ["--success", "--background"],
      ["--success", "--card"],
      ["--warning", "--background"],
      ["--warning", "--card"],
      ["--info", "--background"],
      ["--info", "--card"],
    ],
  },
  {
    name: "bordes",
    min: 3,
    triggers: ["--border-strong"],
    pairs: [
      ["--border-strong", "--background"],
      ["--border-strong", "--card"],
    ],
  },
];

function assertF1Category(label: string, tokens: TokenMap, category: F1Category): void {
  const active = category.triggers.some((name) => tokens.has(name));
  if (!active) return; // F1 aún no define estos tokens: chequeo omitido.
  for (const [inkName, surfaceName] of category.pairs) {
    const ink = requireToken(tokens, inkName);
    const surface = requireToken(tokens, surfaceName);
    assert.ok(
      contrast(ink, surface) >= category.min,
      `${label} ${category.name} ${inkName}/${surfaceName} ${contrast(ink, surface)}`,
    );
  }
}

// --- Humo: --smoke-rgb (triplete sRGB) + --smoke-alpha + --smoke-k ----------

type Smoke = { rgb: [number, number, number]; alpha: number; k: number };

function smokeIn(block: string): Smoke | null {
  const rgb = block.match(/--smoke-rgb:\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/);
  const alpha = block.match(/--smoke-alpha:\s*([\d.]+)/);
  const k = block.match(/--smoke-k:\s*([\d.]+)/);
  if (!rgb || !alpha || !k) return null;
  return {
    rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
    alpha: Number(alpha[1]),
    k: Number(k[1]),
  };
}

function luminanceSrgb(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => linearize(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function blendOver(
  fg: [number, number, number],
  bg: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [
    alpha * fg[0] + (1 - alpha) * bg[0],
    alpha * fg[1] + (1 - alpha) * bg[1],
    alpha * fg[2] + (1 - alpha) * bg[2],
  ];
}

function contrastSrgb(a: [number, number, number], b: [number, number, number]): number {
  const la = luminanceSrgb(a);
  const lb = luminanceSrgb(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// --- N2 neo-brutalista: kinds por tipo, tinta y ΔE OKLab --------------------

const KIND_TOKENS = [
  "--kind-dispositivo",
  "--kind-resistencia",
  "--kind-liquido",
  "--kind-componente",
] as const;

function oklab(color: Oklch): [number, number, number] {
  const hue = (color.h * Math.PI) / 180;
  return [color.l, color.c * Math.cos(hue), color.c * Math.sin(hue)];
}

function deltaEok(a: Oklch, b: Oklch): number {
  const [la, aa, ba] = oklab(a);
  const [lb, ab, bb] = oklab(b);
  return Math.sqrt((la - lb) ** 2 + (aa - ab) ** 2 + (ba - bb) ** 2) * 100;
}

function minDeltaE(colors: Oklch[]): { min: number; pair: string } {
  let min = Number.POSITIVE_INFINITY;
  let pair = "";
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const d = deltaEok(colors[i], colors[j]);
      if (d < min) {
        min = d;
        pair = `${KIND_TOKENS[i]}/${KIND_TOKENS[j]}`;
      }
    }
  }
  return { min, pair };
}

function assertBrutTokens(source: string): void {
  assert.ok(source.includes("--brut-border: 3px"), "--brut-border 3px");
  assert.ok(source.includes("--brut-offset: 6px"), "--brut-offset 6px");
}

describe("contraste de los tokens", () => {
  const source = css();
  const light = blockBetween(source, ":root {", ".dark {");
  const dark = blockBetween(source, ".dark {", "@theme inline");
  const pcMedia = blockBetween(
    source,
    "@media (prefers-contrast: more)",
    "@media (forced-colors: active)",
  );
  const pcLightBlock = blockBetween(pcMedia, ":root {", ".dark {");
  const pcDarkBlock = blockBetween(pcMedia, ".dark {", "}");

  const lightTokens = collectTokens(light);
  const darkTokens = collectTokens(dark);
  // prefers-contrast: more hereda los tokens base y aplica sus overrides.
  const pcLightTokens = new Map([...lightTokens, ...collectTokens(pcLightBlock)]);
  const pcDarkTokens = new Map([...darkTokens, ...collectTokens(pcDarkBlock)]);

  const lightTheme = assertTheme("claro", lightTokens);
  const darkTheme = assertTheme("oscuro", darkTokens);
  assertTheme("prefers-contrast claro", pcLightTokens);
  assertTheme("prefers-contrast oscuro", pcDarkTokens);

  it("el meta theme-color está acoplado a los tokens de fondo", () => {
    const toggle = readFileSync(
      new URL("../components/ui/theme-toggle.tsx", import.meta.url),
      "utf8",
    );
    const hexes = [...toggle.matchAll(/#([0-9a-fA-F]{6})/g)].map((m) => m[1].toLowerCase());
    assert.deepEqual(
      [srgbToHex(lightTheme.background), srgbToHex(darkTheme.background)].sort(),
      [...hexes].sort(),
    );
  });

  describe("tokens previstos F1 (se activan al existir el token)", () => {
    const variants = [
      { label: "claro", tokens: lightTokens, smokeBlock: light },
      { label: "oscuro", tokens: darkTokens, smokeBlock: dark },
      // Si el bloque prefers-contrast no redefine humo, se lee el del tema base.
      { label: "prefers-contrast claro", tokens: pcLightTokens, smokeBlock: pcLightBlock + light },
      { label: "prefers-contrast oscuro", tokens: pcDarkTokens, smokeBlock: pcDarkBlock + dark },
    ];

    for (const variant of variants) {
      for (const category of F1_CATEGORIES) {
        it(`${variant.label}: ${category.name} F1 supera ${category.min}:1`, () => {
          assertF1Category(variant.label, variant.tokens, category);
        });
      }

      it(`${variant.label}: humo no degrada el texto (peor caso)`, () => {
        const smoke = smokeIn(variant.smokeBlock);
        if (!smoke) return; // F1/F5 aún no definen humo: chequeo omitido.
        // Peor caso de lectura: --foreground sobre fondo teñido con cobertura
        // total del humo (mezcla sRGB directa, sin espacio de composición).
        const background = requireToken(variant.tokens, "--background");
        const foreground = requireToken(variant.tokens, "--foreground");
        const blended = blendOver(smoke.rgb, srgbChannels(background), smoke.alpha);
        const ratio = contrastSrgb(srgbChannels(foreground), blended);
        assert.ok(ratio >= 4.5, `${variant.label} foreground/humo ${ratio}`);
      });
    }
  });

  describe("humo S4: peor caso de cobertura (--smoke-alpha)", () => {
    const variants = [
      { label: "claro", tokens: lightTokens, smokeBlock: light },
      { label: "oscuro", tokens: darkTokens, smokeBlock: dark },
      { label: "prefers-contrast claro", tokens: pcLightTokens, smokeBlock: pcLightBlock + light },
      { label: "prefers-contrast oscuro", tokens: pcDarkTokens, smokeBlock: pcDarkBlock + dark },
    ];
    for (const variant of variants) {
      it(`${variant.label}: foreground y muted-foreground superan 4,5:1 sobre humo`, () => {
        const smoke = smokeIn(variant.smokeBlock);
        assert.ok(smoke, `${variant.label} define --smoke-rgb/--smoke-alpha/--smoke-k`);
        const surface = blendOver(
          smoke.rgb,
          srgbChannels(requireToken(variant.tokens, "--background")),
          smoke.alpha,
        );
        for (const ink of ["--foreground", "--muted-foreground"]) {
          const ratio = contrastSrgb(srgbChannels(requireToken(variant.tokens, ink)), surface);
          assert.ok(ratio >= 4.5, `${variant.label} ${ink}/humo ${ratio}`);
        }
      });
    }
  });

  describe("humo S1: K·densidad_max ≤ alpha por bloque (11 semillas × 120 s)", () => {
    const smokeBlocks = [
      { label: "claro", smokeBlock: light },
      { label: "oscuro", smokeBlock: dark },
      { label: "prefers-contrast claro", smokeBlock: pcLightBlock + light },
      { label: "prefers-contrast oscuro", smokeBlock: pcDarkBlock + dark },
    ];
    // 11 semillas desplegadas (ADR-0007): cubren el peor caso conocido
    // (Q3 semilla 8 = 6.374 con el modelo anterior) más la unión de
    // smoke-model.test.ts (3,11,29,57 cota; 5 determinismo; 9 rejilla).
    const SEEDS = [2, 3, 4, 5, 8, 9, 10, 11, 20, 29, 57];
    const STEPS = 120 * 30;
    const DT = 1 / 30;
    type Grid = {
      label: string;
      cfg: { width: number; height: number; pad: number; count: number; cell: number };
    };
    // Configs DESPLEGADAS (ADR-0007): Q3 escritorio, Q2 medio, Q1 móvil
    // (Q1 sin ASCII). Márgenes finales con el modelo r 26..56 / growth 1.4 /
    // life 11..17 (K=0.02/alpha=0.1 claro, K=0.028/alpha=0.14 oscuro):
    // - Q3 worst 4.293 (semilla 20): K·d = 0.0859 claro / 0.1202 oscuro → margen 14.1 %.
    // - Q2 worst 3.498 (semilla 20): K·d = 0.0700 claro / 0.0980 oscuro → margen 30.0 %.
    // - Q1 worst 3.212 (semilla 20): K·d = 0.0642 claro / 0.0899 oscuro → margen 35.8 %.
    // Cota exigida con margen ≥10 %: densidad_max ≤ 4.5.
    const GRIDS: Grid[] = [
      { label: "Q3 escritorio", cfg: { width: 1280, height: 720, pad: 120, count: 87, cell: 16 } },
      { label: "Q2 medio", cfg: { width: 1000, height: 800, pad: 120, count: 54, cell: 20 } },
      { label: "Q1 móvil", cfg: { width: 390, height: 844, pad: 120, count: 32, cell: 24 } },
    ];
    function maxDensity(grid: Grid): number {
      let worst = 0;
      for (const seed of SEEDS) {
        const s = createSmoke({ ...grid.cfg, seed });
        for (let i = 0; i < STEPS; i++) {
          stepSmoke(s, DT);
          for (const v of s.density) if (v > worst) worst = v;
        }
      }
      return worst;
    }
    for (const grid of GRIDS) {
      it(
        `${grid.label}: K_bloque × densidad_max ≤ alpha_bloque en los 4 bloques`,
        { timeout: 180_000 },
        () => {
          const density = maxDensity(grid);
          for (const b of smokeBlocks) {
            const smoke = smokeIn(b.smokeBlock);
            assert.ok(smoke, `${b.label} define --smoke-rgb/--smoke-alpha/--smoke-k`);
            const bound = smoke.k * density;
            assert.ok(
              bound <= smoke.alpha,
              `${grid.label} ${b.label}: K=${smoke.k} × densidad=${density.toFixed(3)} = ${bound.toFixed(4)} > alpha=${smoke.alpha}`,
            );
          }
        },
      );
    }
  });

  describe("N2 neo-brutalista: kinds, tinta y ΔE", () => {
    it("tokens brut existen con 3px/6px", () => {
      assertBrutTokens(source);
      for (const name of KIND_TOKENS) {
        assert.ok(lightTokens.has(name), `claro define ${name}`);
        assert.ok(darkTokens.has(name), `oscuro define ${name}`);
      }
      assert.ok(lightTokens.has("--ink"), "claro define --ink");
      // --ink vive en :root y se hereda en oscuro (sin override en .dark).
      assert.ok(darkTokens.has("--ink") || lightTokens.has("--ink"), "oscuro hereda --ink");
    });

    it("oscuro: kinds neón ≥3:1 sobre card y background", () => {
      const card = requireToken(darkTokens, "--card");
      const background = requireToken(darkTokens, "--background");
      for (const name of KIND_TOKENS) {
        const kind = requireToken(darkTokens, name);
        for (const [surfaceName, surface] of [
          ["--card", card],
          ["--background", background],
        ] as const) {
          assert.ok(
            contrast(kind, surface) >= 3,
            `oscuro ${name}/${surfaceName} ${contrast(kind, surface)}`,
          );
        }
      }
    });

    it("claro: tinta sobre hueso ≥7:1", () => {
      const ink = requireToken(lightTokens, "--ink");
      const background = requireToken(lightTokens, "--background");
      const ratio = contrast(ink, background);
      assert.ok(ratio >= 7, `claro --ink/--background ${ratio}`);
    });

    it("ΔE OKLab mínimo entre los 4 kinds ≥15 (claro y oscuro)", () => {
      for (const [label, tokens] of [
        ["claro", lightTokens],
        ["oscuro", darkTokens],
      ] as const) {
        const colors = KIND_TOKENS.map((name) => requireToken(tokens, name));
        const { min, pair } = minDeltaE(colors);
        assert.ok(min >= 15, `${label} ΔE mín ${pair} ${min}`);
      }
    });

    it("prefers-contrast:more mantiene kinds ≥3:1 en oscuro y ΔE ≥15", () => {
      const card = requireToken(pcDarkTokens, "--card");
      const background = requireToken(pcDarkTokens, "--background");
      for (const name of KIND_TOKENS) {
        const base = requireToken(darkTokens, name);
        const override = pcDarkTokens.get(name) ?? base;
        for (const [surfaceName, surface] of [
          ["--card", card],
          ["--background", background],
        ] as const) {
          assert.ok(
            contrast(override, surface) >= 3,
            `pc-oscuro ${name}/${surfaceName} ${contrast(override, surface)}`,
          );
        }
      }
      for (const [label, tokens] of [
        ["pc-claro", pcLightTokens],
        ["pc-oscuro", pcDarkTokens],
      ] as const) {
        const colors = KIND_TOKENS.map(
          (name) =>
            tokens.get(name) ?? requireToken(label === "pc-claro" ? lightTokens : darkTokens, name),
        );
        const { min, pair } = minDeltaE(colors);
        assert.ok(min >= 15, `${label} ΔE mín ${pair} ${min}`);
      }
    });
  });
});
