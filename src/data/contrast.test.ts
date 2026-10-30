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

const ACCENT_PAIRS: Array<[string, string]> = [
  ["--destructive", "--background"],
  ["--destructive", "--card"],
];

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
  if (!active) return;
  for (const [inkName, surfaceName] of category.pairs) {
    const ink = requireToken(tokens, inkName);
    const surface = requireToken(tokens, surfaceName);
    assert.ok(
      contrast(ink, surface) >= category.min,
      `${label} ${category.name} ${inkName}/${surfaceName} ${contrast(ink, surface)}`,
    );
  }
}

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

describe("contraste de los tokens", () => {
  const source = css();
  assert.equal(source.includes("--brut-border"), false, "sin --brut-border (ADR-0016)");
  assert.equal(source.includes("--smoke-rgb"), false, "sin --smoke-rgb (ADR-0016)");
  assert.equal(source.includes("led-breathe"), false, "sin led-breathe (ADR-0016)");

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

  describe("tokens de superficie y estado", () => {
    const variants = [
      { label: "claro", tokens: lightTokens },
      { label: "oscuro", tokens: darkTokens },
      { label: "prefers-contrast claro", tokens: pcLightTokens },
      { label: "prefers-contrast oscuro", tokens: pcDarkTokens },
    ];

    for (const variant of variants) {
      for (const category of F1_CATEGORIES) {
        it(`${variant.label}: ${category.name} supera ${category.min}:1`, () => {
          assertF1Category(variant.label, variant.tokens, category);
        });
      }
    }
  });

  describe("kinds por tipo y ΔE (ADR-0016)", () => {
    it("define los cuatro --kind-* en claro y oscuro", () => {
      for (const name of KIND_TOKENS) {
        assert.ok(lightTokens.has(name), `claro define ${name}`);
        assert.ok(darkTokens.has(name), `oscuro define ${name}`);
      }
    });

    it("oscuro: kinds ≥3:1 sobre card y background", () => {
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
