#!/usr/bin/env node
/**
 * build-icons: genera los PNG de identidad (favicon 32, apple-touch 180,
 * PWA 192/512) y `public/site.webmanifest` a partir de los SVG de marca.
 * Idempotente: sobrescribe las salidas existentes sin estado intermedio.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC = join(ROOT, "public");

const BG = "#FCFAF6";
const FG = "#100D08";
const MARK_VIEWBOX = 32;
const ICON_INSET = 0.68;

const markSource = await readFile(join(PUBLIC, "logo-mark.svg"), "utf8");
const markInner = markSource
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replaceAll("currentColor", FG);

function markSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}" width="${size}" height="${size}">${markInner}</svg>`,
  );
}

async function solidIcon(size, out) {
  const inset = Math.round(size * ICON_INSET);
  const mark = await sharp(markSvg(inset), { density: 384 })
    .resize(inset, inset, { fit: "contain" })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(out);
  return out;
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });

  const faviconSvg = await readFile(join(PUBLIC, "favicon.svg"), "utf8");
  const favicon32 = join(PUBLIC, "favicon-32.png");
  await sharp(Buffer.from(faviconSvg), { density: 384 }).resize(32, 32).png().toFile(favicon32);

  const apple = await solidIcon(180, join(PUBLIC, "apple-touch-icon.png"));
  const icon192 = await solidIcon(192, join(PUBLIC, "icon-192.png"));
  const icon512 = await solidIcon(512, join(PUBLIC, "icon-512.png"));

  const manifest = {
    name: "Vapelog",
    short_name: "Vapelog",
    theme_color: BG,
    background_color: BG,
    display: "standalone",
    start_url: "/",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  const manifestPath = join(PUBLIC, "site.webmanifest");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  for (const p of [favicon32, apple, icon192, icon512, manifestPath]) {
    console.log(relative(ROOT, p));
  }
}

await main();
