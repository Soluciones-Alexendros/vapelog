import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

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

// --- Humo: --smoke-rgb (triplete sRGB) + --smoke-alpha ----------------------

type Smoke = { rgb: [number, number, number]; alpha: number };

function smokeIn(block: string): Smoke | null {
  const rgb = block.match(/--smoke-rgb:\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/);
  const alpha = block.match(/--smoke-alpha:\s*([\d.]+)/);
  if (!rgb || !alpha) return null;
  return {
    rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
    alpha: Number(alpha[1]),
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
});
