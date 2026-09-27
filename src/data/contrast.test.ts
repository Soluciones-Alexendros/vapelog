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

function assertTheme(label: string, block: string) {
  const background = tokenIn(block, "--background");
  const card = tokenIn(block, "--card");
  const foreground = tokenIn(block, "--foreground");
  const mutedForeground = tokenIn(block, "--muted-foreground");
  const primary = tokenIn(block, "--primary");
  const primaryForeground = tokenIn(block, "--primary-foreground");
  const destructive = tokenIn(block, "--destructive");
  const border = tokenIn(block, "--border");
  const ring = tokenIn(block, "--ring");

  it(`${label}: texto pequeño supera 4,5:1 sobre fondo y card`, () => {
    for (const ink of [foreground, mutedForeground, primary, destructive]) {
      assert.ok(
        contrast(ink, background) >= 4.5,
        `${label} ink/fondo ${contrast(ink, background)}`,
      );
      assert.ok(contrast(ink, card) >= 4.5, `${label} ink/card ${contrast(ink, card)}`);
    }
    assert.ok(contrast(primaryForeground, primary) >= 4.5);
  });

  it(`${label}: borde y anillo superan 3:1`, () => {
    assert.ok(contrast(border, background) >= 3, `${label} borde ${contrast(border, background)}`);
    assert.ok(contrast(ring, background) >= 3, `${label} ring ${contrast(ring, background)}`);
  });
}

describe("contraste de los tokens", () => {
  const source = css();
  const light = blockBetween(source, ":root {", ".dark {");
  const dark = blockBetween(source, ".dark {", "@theme inline");
  assertTheme("claro", light);
  assertTheme("oscuro", dark);
});
