import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

type Oklch = { l: number; c: number; h: number };

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

function tokenIn(block: string, name: string): Oklch {
  const match = block.match(
    new RegExp(`${name}:\\s*oklch\\(\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*\\)`),
  );
  assert.ok(match, `${name} en bloque`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
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

function srgbToHex(o: Oklch): string {
  const hue = (o.h * Math.PI) / 180;
  const a = o.c * Math.cos(hue);
  const b = o.c * Math.sin(hue);
  const l_ = o.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = o.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = o.l - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const red = Math.round(255 * srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
  const green = Math.round(
    255 * srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
  );
  const blue = Math.round(
    255 * srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  );
  return [red, green, blue].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function assertTheme(label: string, block: string) {
  const background = tokenIn(block, "--background");
  const card = tokenIn(block, "--card");
  const foreground = tokenIn(block, "--foreground");
  const cardForeground = tokenIn(block, "--card-foreground");
  const popover = tokenIn(block, "--popover");
  const popoverForeground = tokenIn(block, "--popover-foreground");
  const mutedForeground = tokenIn(block, "--muted-foreground");
  const primary = tokenIn(block, "--primary");
  const primaryForeground = tokenIn(block, "--primary-foreground");
  const secondary = tokenIn(block, "--secondary");
  const secondaryForeground = tokenIn(block, "--secondary-foreground");
  const accent = tokenIn(block, "--accent");
  const accentForeground = tokenIn(block, "--accent-foreground");
  const destructive = tokenIn(block, "--destructive");
  const destructiveForeground = tokenIn(block, "--destructive-foreground");
  const input = tokenIn(block, "--input");
  const border = tokenIn(block, "--border");
  const ring = tokenIn(block, "--ring");

  it(`${label}: texto pequeño supera 4,5:1 sobre sus fondos`, () => {
    const pairs: Array<[string, Oklch, Oklch]> = [
      ["foreground/background", foreground, background],
      ["foreground/card", foreground, card],
      ["card-foreground/card", cardForeground, card],
      ["popover-foreground/popover", popoverForeground, popover],
      ["muted-foreground/background", mutedForeground, background],
      ["muted-foreground/card", mutedForeground, card],
      ["primary/background", primary, background],
      ["primary/card", primary, card],
      ["primary-foreground/primary", primaryForeground, primary],
      ["secondary-foreground/secondary", secondaryForeground, secondary],
      ["accent-foreground/accent", accentForeground, accent],
      ["destructive-foreground/destructive", destructiveForeground, destructive],
    ];
    for (const [name, ink, surface] of pairs) {
      assert.ok(contrast(ink, surface) >= 4.5, `${label} ${name} ${contrast(ink, surface)}`);
    }
  });

  it(`${label}: acentos y controles superan 3:1`, () => {
    // destructive como tinta sobre fondo es uso gráfico (iconos, acentos):
    // con fondo oscuro no puede cumplir 4,5:1 a la vez que
    // destructive-foreground/destructive; WCAG exige 3:1 para no texto.
    for (const [name, ink] of [
      ["destructive/background", destructive],
      ["destructive/card", destructive],
    ] as Array<[string, Oklch]>) {
      const surface = name.endsWith("/card") ? card : background;
      assert.ok(contrast(ink, surface) >= 3, `${label} ${name} ${contrast(ink, surface)}`);
    }
    assert.ok(contrast(border, background) >= 3, `${label} borde ${contrast(border, background)}`);
    assert.ok(contrast(input, background) >= 3, `${label} input ${contrast(input, background)}`);
    assert.ok(contrast(ring, background) >= 3, `${label} ring ${contrast(ring, background)}`);
  });

  return { background };
}

describe("contraste de los tokens", () => {
  const source = css();
  const light = blockBetween(source, ":root {", ".dark {");
  const dark = blockBetween(source, ".dark {", "@theme inline");
  const lightTheme = assertTheme("claro", light);
  const darkTheme = assertTheme("oscuro", dark);

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
});
