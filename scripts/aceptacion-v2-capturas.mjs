#!/usr/bin/env node
// Capturas de la matriz mínima de aceptación visual v2 (ADR-0017 / U9).
// Genera PNGs + índice bajo docs/cierre/aceptacion-v2/capturas/.
// No marca casillas del expediente: la aprobación sigue siendo humana.
//
// Uso:
//   pnpm run build && pnpm run aceptacion:capturas
//   node scripts/aceptacion-v2-capturas.mjs [url]   # servidor ya en marcha
//   ACEPTACION_URL=https://… BROWSER_ALLOW_EXTERNAL_HOST=1 pnpm run aceptacion:capturas
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(REPO_ROOT, "docs", "cierre", "aceptacion-v2", "capturas");
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

const THEMES = [
  { name: "claro", colorScheme: "light", storage: "light" },
  { name: "oscuro", colorScheme: "dark", storage: "dark" },
];
const VIEWPORTS = [
  { name: "movil", width: 390, height: 844 },
  { name: "escritorio", width: 1280, height: 800 },
];
const TIMEOUT_MS = Number(process.env.ACEPTACION_TIMEOUT_MS || 45000);
const PORT = process.env.ACEPTACION_PORT || "4178";
const argUrl = process.argv[2] || process.env.ACEPTACION_URL || "";
const BASE = argUrl || `http://127.0.0.1:${PORT}/`;

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}

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

function checkedOutputDir(dir) {
  const abs = resolve(dir);
  const root = REPO_ROOT.endsWith(sep) ? REPO_ROOT : REPO_ROOT + sep;
  if (!abs.startsWith(root) && abs !== REPO_ROOT) {
    fail(`output path must be under ${REPO_ROOT}, got ${abs}`);
  }
  return abs;
}

checkedUrl(BASE);
const outDir = checkedOutputDir(OUT_DIR);
mkdirSync(outDir, { recursive: true });

/** @typedef {{ id: string, label: string, path: string, prepare?: (page: import('playwright').Page) => Promise<void> }} Scenario */

/** @type {Scenario[]} */
const SCENARIOS = [
  { id: "inicio", label: "Inicio", path: "/" },
  { id: "catalogo", label: "Catálogo / lista", path: "/dispositivos" },
  { id: "ficha", label: "Ficha", path: "/dispositivos/vaporesso-xros-4" },
  { id: "comparar-0", label: "Comparador (vacío)", path: "/comparar" },
  {
    id: "comparar-1",
    label: "Comparador (1 ficha)",
    path: "/comparar?dominio=device&fichas=vaporesso-xros-4",
  },
  {
    id: "comparar-n",
    label: "Comparador (N fichas)",
    path: "/comparar?dominio=device&fichas=vaporesso-xros-4,vaporesso-xros-5",
  },
  { id: "buscar", label: "Buscar", path: "/buscar" },
  { id: "buscar-resultados", label: "Buscar (resultados)", path: "/buscar?q=xros" },
  {
    id: "ohm",
    // Coma decimal en la URL: no sustituye por un ohmio del archivo (U8).
    label: "Herramientas Ohm",
    path: "/herramientas?tab=ohm&ohms=0,804&watts=14",
    prepare: async (page) => {
      await page.locator("#ohms").waitFor({ state: "visible", timeout: TIMEOUT_MS });
      const value = await page.locator("#ohms").inputValue();
      if (value !== "0,804") {
        throw new Error(`esperado ohms=0,804 en el input, got ${JSON.stringify(value)}`);
      }
    },
  },
  {
    id: "nicokit",
    label: "Herramientas Nicokit",
    path: "/herramientas?tab=nicokit",
  },
  {
    id: "teclado-foco",
    label: "Teclado (foco Buscar)",
    path: "/",
    prepare: async (page) => {
      // Avanzar Tab hasta un control cuyo nombre/accesible mencione Buscar.
      for (let i = 0; i < 24; i++) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return "";
          const label =
            el.getAttribute("aria-label") ||
            el.getAttribute("title") ||
            el.textContent ||
            el.getAttribute("placeholder") ||
            "";
          return label.trim();
        });
        if (/buscar|resultados|⌘|ctrl/i.test(focused)) break;
      }
      await page.waitForTimeout(200);
    },
  },
];

let serverPid = null;

async function ensureServer() {
  if (argUrl) return;
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) {
    fail("sin build previo; ejecuta pnpm run build antes");
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
    if (child.exitCode !== null) fail("el servidor murió al arrancar");
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

/**
 * @param {import('playwright').Browser} browser
 * @param {Scenario} scenario
 * @param {(typeof THEMES)[number]} theme
 * @param {(typeof VIEWPORTS)[number]} viewport
 */
async function captureOne(browser, scenario, theme, viewport) {
  const fileName = `${scenario.id}-${theme.name}-${viewport.name}.png`;
  const filePath = join(outDir, fileName);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: theme.colorScheme,
  });
  await context.addInitScript((storageTheme) => {
    sessionStorage.setItem("vapelog-edad", "ok");
    localStorage.setItem("vapelog-theme", storageTheme);
  }, theme.storage);

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));

  const url = new URL(scenario.path, BASE).href;
  const resp = await page.goto(url, { waitUntil: "load", timeout: TIMEOUT_MS });
  const status = resp?.status() ?? 0;
  await page.waitForTimeout(400);
  if (scenario.prepare) {
    try {
      await scenario.prepare(page);
    } catch (err) {
      await context.close();
      return {
        fileName,
        filePath,
        scenario: scenario.id,
        label: scenario.label,
        tema: theme.name,
        viewport: viewport.name,
        status,
        ok: false,
        error: `prepare: ${err instanceof Error ? err.message : String(err)}`,
        consoleErrors,
        pageErrors,
      };
    }
  }
  await page.screenshot({ path: filePath, fullPage: false });
  await context.close();

  const noise = (msg) => /Transition was skipped\. New ViewTransition started/i.test(msg);
  const failures = [];
  if (status >= 400 || status === 0) failures.push(`HTTP ${status}`);
  for (const e of consoleErrors) {
    if (!noise(e)) failures.push(`console ${e}`);
  }
  for (const e of pageErrors) {
    if (!noise(e)) failures.push(`pageerror ${e}`);
  }

  return {
    fileName,
    filePath,
    scenario: scenario.id,
    label: scenario.label,
    tema: theme.name,
    viewport: viewport.name,
    status,
    ok: failures.length === 0,
    error: failures.join("; ") || undefined,
    consoleErrors,
    pageErrors,
  };
}

function writeIndex(results) {
  const lines = [
    "# Índice de capturas — aceptación visual v2",
    "",
    "### Propósito de este documento",
    "",
    "- **Objetivos:** Enlazar PNGs generados por `pnpm run aceptacion:capturas`",
    "  con la matriz de [aceptacion-v2-visual.md](../aceptacion-v2-visual.md).",
    "- **Estructura:** Cómo regenerar → tabla archivo → nota humana.",
    "- **Contenido a integrar según contexto:** Regenerar con el script; no",
    "  inventa datos de ficha. Las casillas ☐ del expediente las marca el",
    "  operador tras revisar estas imágenes.",
    "",
    "## Cómo regenerar",
    "",
    "```bash",
    "pnpm run build",
    "pnpm run aceptacion:capturas",
    "```",
    "",
    `Base usada: \`${BASE}\``,
    "",
    "## Archivos",
    "",
    "| Superficie | Tema | Viewport | Archivo |",
    "| --- | --- | --- | --- |",
  ];
  for (const r of results) {
    lines.push(`| ${r.label} | ${r.tema} | ${r.viewport} | [${r.fileName}](./${r.fileName}) |`);
  }
  lines.push("", `Total: ${results.length} capturas.`, "");
  writeFileSync(join(outDir, "indice.md"), `${lines.join("\n")}\n`, "utf8");
}

await ensureServer();

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
try {
  for (const scenario of SCENARIOS) {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        results.push(await captureOne(browser, scenario, theme, viewport));
      }
    }
  }
} finally {
  await browser.close();
  await stopServer();
}

writeIndex(results);

const fallos = results.filter((r) => !r.ok).map((r) => `${r.fileName}: ${r.error}`);
const summary = {
  ok: fallos.length === 0,
  base: BASE,
  outDir,
  capturas: results.length,
  fallos,
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = fallos.length === 0 ? 0 : 1;
