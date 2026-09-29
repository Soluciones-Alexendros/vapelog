#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const AXE_FAILING_IMPACTS = new Set(["serious", "critical"]);
const AXE_RULE_IDS_NOT_APPLICABLE_PAGE_FRAGMENTS = new Set(["region"]);
const AXE_EXCLUDE_SELECTORS_PLAYWRIGHT_TRANSIENT_GATE = ["[role='dialog']"];
const ROUTES = [
  "/",
  "/dispositivos",
  "/dispositivos/vaporesso-xros-4",
  "/resistencias",
  "/liquidos",
  "/comparar",
  "/compatibilidad",
  "/herramientas",
];
const DARK_MODE_ROUTES = new Set(["/", "/dispositivos/vaporesso-xros-4"]);
const THEME_STORAGE_KEY = "vapelog-theme";
const AGE_GATE_STORAGE_KEY = "vapelog-edad";
const AGE_GATE_BUTTON = "Tengo 18 años o más";
const PORT = process.env.A11Y_PORT || "4175";
const TIMEOUT_MS = Number(process.env.A11Y_TIMEOUT_MS || 45000);
const VIEWPORT = { width: 1280, height: 800 };

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
      `${parsed.hostname} is not a loopback host; this script drives the local ` +
        "production server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.",
    );
  }
  return url;
}

const argUrl = process.argv[2] || process.env.A11Y_URL || "";
const BASE = checkedUrl(argUrl || `http://127.0.0.1:${PORT}/`);

let serverPid = null;

async function ensureServer() {
  if (argUrl) return;
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) {
    fail("sin build previo; ejecuta pnpm run build antes (como hace scripts/smoke.sh)");
  }
  const child = spawn(process.execPath, [entry], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT, HOST: "127.0.0.1", NITRO_HOST: "127.0.0.1", NITRO_PORT: PORT },
    stdio: "ignore",
  });
  serverPid = child.pid;
  const base = new URL(BASE);
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) fail("el servidor murió al arrancar");
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      void 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(`timeout esperando ${base}`);
}

function stopServer() {
  if (!serverPid) return;
  try {
    process.kill(serverPid, "SIGTERM");
  } catch {
    void 0;
  }
}

async function dismissAgeGate(page) {
  const dialog = page.getByRole("dialog");
  const shown = await dialog
    .waitFor({ timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (!shown) return "ausente";
  if (!(await dialog.isVisible().catch(() => false))) return "ausente";
  const confirm = page.getByRole("button", { name: AGE_GATE_BUTTON });
  await confirm.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  if (await dialog.isVisible().catch(() => false)) return "bloqueada";
  return "cerrada";
}

async function axeViolations(page, exclusions) {
  const builder = new AxeBuilder({ page });
  for (const selector of exclusions) builder.exclude(selector);
  const results = await builder.analyze();
  return results.violations
    .filter((violation) => AXE_FAILING_IMPACTS.has(violation.impact))
    .filter((violation) => !AXE_RULE_IDS_NOT_APPLICABLE_PAGE_FRAGMENTS.has(violation.id))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      target: violation.nodes[0]?.target ?? [],
    }));
}

async function scanTheme(browser, theme, routes, consoleErrors, pageErrors) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await context.addInitScript(
    ({ themeKey, themeValue }) => {
      localStorage.setItem(themeKey, themeValue);
      document.documentElement?.classList.toggle("dark", themeValue === "dark");
    },
    { themeKey: THEME_STORAGE_KEY, themeValue: theme },
  );
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  const results = [];
  for (const route of routes) {
    await page.goto(new URL(route, BASE).href, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });
    await page.waitForTimeout(400);
    const gate = await dismissAgeGate(page);
    const exclusions = gate === "bloqueada" ? AXE_EXCLUDE_SELECTORS_PLAYWRIGHT_TRANSIENT_GATE : [];
    const violations = await axeViolations(page, exclusions);
    results.push({ route, theme, gate, violations });
  }
  await context.close();
  return results;
}

async function behaviorChecks(browser, consoleErrors, pageErrors) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: "light" });
  await context.addInitScript(
    ({ gateKey, themeKey }) => {
      sessionStorage.setItem(gateKey, "ok");
      localStorage.setItem(themeKey, "light");
      document.documentElement?.classList.remove("dark");
    },
    { gateKey: AGE_GATE_STORAGE_KEY, themeKey: THEME_STORAGE_KEY },
  );
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto(new URL("/resistencias", BASE).href, {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUT_MS,
  });
  await page.waitForTimeout(400);
  const live = page.locator("[aria-live='polite']");
  await live.waitFor();
  const before = await live.innerText();
  const radio = page.locator("form").getByRole("radio").first();
  let after = before;
  for (let attempt = 0; attempt < 20 && after === before; attempt++) {
    await radio.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    after = await live.innerText();
  }
  if (before === after) throw new Error(`el recuento no cambió: ${after}`);

  const sheet = page.getByRole("link", { name: "Abrir ficha" }).first();
  await sheet.click();
  await page.waitForTimeout(500);
  const heading = page.getByRole("heading", { level: 1 });
  await heading.waitFor();
  const name = (await heading.innerText()).trim();
  if (!name) throw new Error("la ficha no tiene nombre accesible");
  const alts = await page
    .locator("main img")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("alt")));
  if (alts.length === 0 || alts.some((alt) => !alt || !alt.trim())) {
    throw new Error(`foto sin texto alternativo: ${JSON.stringify(alts)}`);
  }
  const external = page.getByRole("link", { name: /ventana nueva/ });
  if ((await external.count()) === 0) {
    throw new Error("el enlace de fuente no anuncia ventana nueva");
  }
  await context.close();
  return { count: after.trim(), sheet: name };
}

const consoleErrors = [];
const pageErrors = [];
const fallos = [];

await ensureServer();
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let axeResults = [];
let behavior = { count: "", sheet: "" };
try {
  axeResults = await scanTheme(browser, "light", ROUTES, consoleErrors, pageErrors);
  axeResults = axeResults.concat(
    await scanTheme(
      browser,
      "dark",
      ROUTES.filter((route) => DARK_MODE_ROUTES.has(route)),
      consoleErrors,
      pageErrors,
    ),
  );
  behavior = await behaviorChecks(browser, consoleErrors, pageErrors);
} catch (err) {
  fallos.push(String(err?.message || err));
} finally {
  await browser.close();
  stopServer();
}

for (const result of axeResults) {
  if (result.gate === "bloqueada") {
    fallos.push(
      `${result.route} ${result.theme}: la puerta de edad no se cerró; axe excluyó ${AXE_EXCLUDE_SELECTORS_PLAYWRIGHT_TRANSIENT_GATE.join(", ")}`,
    );
  }
  for (const violation of result.violations) {
    fallos.push(
      `${result.route} ${result.theme}: axe ${violation.impact} ${violation.id} (${violation.nodes}) ${JSON.stringify(violation.target)}`,
    );
  }
}

const noise = /favicon|Failed to load resource/i;
for (const line of consoleErrors) {
  if (!noise.test(line)) fallos.push(`console: ${line}`);
}
for (const line of pageErrors) {
  if (!noise.test(line)) fallos.push(`pageerror: ${line}`);
}

const seriousCritical = axeResults.flatMap((result) => result.violations);
const summary = {
  ok: fallos.length === 0,
  base: BASE,
  rutasAxe: ROUTES,
  rutasTemaOscuro: [...DARK_MODE_ROUTES],
  combinacionesAxe: axeResults.length,
  violacionesSerias: seriousCritical.length,
  reglasIgnoradas: [...AXE_RULE_IDS_NOT_APPLICABLE_PAGE_FRAGMENTS],
  ficha: behavior.sheet,
  recuento: behavior.count,
  fallos,
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = fallos.length === 0 ? 0 : 1;
