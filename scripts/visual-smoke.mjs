#!/usr/bin/env node
// Visual smoke: recorre las rutas del rediseño en claro y oscuro a 360/768/1280
// px y falla (exit 1) si hay desbordamiento horizontal (scrollWidth >
// clientWidth) o errores de consola/página. Determinista, sin capturas: las
// imágenes de referencia viven en docs/guides/baseline/ (F0).
//
// Uso:
//   node scripts/visual-smoke.mjs [url]     # contra un servidor ya en marcha
//   pnpm run visual-smoke                   # arranca el build de producción
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- target guard (mismo criterio que browser-smoke.mjs) ---
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function checkedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`not a valid URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`only http/https URLs are allowed, got ${parsed.protocol} in ${url}`);
  }
  if (!LOOPBACK_HOSTNAMES.has(parsed.hostname) && process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1") {
    fail(
      `${parsed.hostname} is not a loopback host; this script drives the ` +
        "local production server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.",
    );
  }
  return url;
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}
// --- end target guard ---

const ROUTES = [
  "/",
  "/dispositivos",
  "/dispositivos/vaporesso-xros-4",
  "/resistencias",
  "/comparar",
];
const THEMES = [
  { name: "claro", colorScheme: "light" },
  { name: "oscuro", colorScheme: "dark" },
];
const WIDTHS = [360, 768, 1280];
const HEIGHTS = { 360: 800, 768: 1024, 1280: 900 };
const TIMEOUT_MS = Number(process.env.VISUAL_SMOKE_TIMEOUT_MS || 45000);

const argUrl = process.argv[2] || process.env.VISUAL_SMOKE_URL || "";
const PORT = process.env.VISUAL_SMOKE_PORT || "4174";
const BASE = argUrl || `http://127.0.0.1:${PORT}/`;
// S7: permite forzar el humo on/off con VISUAL_SMOKE_FX=on|off (por defecto,
// sin valor, se respeta la preferencia del navegador = on sin reduced-motion).
const FX =
  process.env.VISUAL_SMOKE_FX === "on" || process.env.VISUAL_SMOKE_FX === "off"
    ? process.env.VISUAL_SMOKE_FX
    : null;
checkedUrl(BASE);

let serverPid = null;

async function ensureServer() {
  if (argUrl) return; // el operador pasa la URL: no tocamos su servidor
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) {
    fail("sin build previo; ejecuta pnpm run build antes (como hace scripts/smoke.sh)");
  }
  const child = spawn(process.execPath, [entry], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PORT,
      HOST: "127.0.0.1",
      NITRO_HOST: "127.0.0.1",
      NITRO_PORT: PORT,
    },
    stdio: "ignore",
  });
  serverPid = child.pid;
  const base = new URL(BASE);
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) {
      fail("el servidor murió al arrancar");
    }
    try {
      const res = await fetch(base);
      if (res.ok) return;
    } catch {
      // aún no listo
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`timeout esperando ${base}`);
}

async function stopServer() {
  if (!serverPid) return;
  try {
    process.kill(serverPid, "SIGTERM");
  } catch {
    // ya terminado
  }
}

async function checkRoute(browser, route, theme, width) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHTS[width] },
    colorScheme: theme.colorScheme,
  });
  // Tema oscuro vía prefers-color-scheme (themeBootScript lee matchMedia) y
  // puerta de edad saltada, igual que la captura de línea base F0.
  await context.addInitScript(
    ({ fx: fxValue }) => {
      sessionStorage.setItem("vapelog-edad", "ok");
      if (fxValue) {
        try {
          localStorage.setItem("vapelog-fx", fxValue);
        } catch {
          // almacenamiento no disponible
        }
      }
    },
    { fx: FX },
  );
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));
  const url = new URL(route, BASE).href;
  const resp = await page.goto(url, { waitUntil: "load", timeout: TIMEOUT_MS });
  const status = resp?.status() ?? 0;
  await page.waitForTimeout(400);
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  await context.close();
  return {
    ruta: route,
    tema: theme.name,
    ancho: width,
    fx: FX ?? "auto",
    status,
    horizontalOverflow,
    consoleErrors,
    pageErrors,
  };
}

await ensureServer();

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
try {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        results.push(await checkRoute(browser, route, theme, width));
      }
    }
  }
} finally {
  await browser.close();
  await stopServer();
}

const failures = [];
for (const r of results) {
  if (r.status >= 400 || r.status === 0)
    failures.push(`${r.ruta} ${r.tema} ${r.ancho}: HTTP ${r.status}`);
  if (r.horizontalOverflow)
    failures.push(`${r.ruta} ${r.tema} ${r.ancho}: desbordamiento horizontal`);
  for (const e of r.consoleErrors) failures.push(`${r.ruta} ${r.tema} ${r.ancho}: console ${e}`);
  for (const e of r.pageErrors) failures.push(`${r.ruta} ${r.tema} ${r.ancho}: pageerror ${e}`);
}

const summary = {
  ok: failures.length === 0,
  base: BASE,
  fx: FX ?? "auto",
  combinaciones: results.length,
  fallos: failures,
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = failures.length === 0 ? 0 : 1;
