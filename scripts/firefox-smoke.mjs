#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { firefox } from "playwright";
import { isBenignConsoleNoise } from "./e2e-console-noise.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(REPO_ROOT, "artifacts", "firefox-smoke");
const PORT = process.env.E2E_PORT || "4175";
const BASE = process.env.FIREFOX_SMOKE_URL || `http://127.0.0.1:${PORT}/`;
const TIMEOUT_MS = Number(process.env.FIREFOX_SMOKE_TIMEOUT_MS || 45000);

const CRITICAL_PATHS = [
  { id: "home", path: "/" },
  { id: "herramientas-ohm", path: "/herramientas" },
  { id: "herramientas-nicokit", path: "/herramientas?tab=nicokit" },
  { id: "compatibilidad", path: "/compatibilidad" },
  { id: "comparar", path: "/comparar" },
];

function fail(message, extra = {}) {
  console.error(JSON.stringify({ ok: false, blocked: false, error: message, ...extra }, null, 2));
  process.exit(1);
}

function blocked(reason) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        blocked: true,
        estado: "BLOQUEADO",
        reason,
        matrix: [],
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

if (!existsSync(join(REPO_ROOT, ".output", "server", "index.mjs"))) {
  fail("sin build previo; ejecuta pnpm run build");
}

mkdirSync(OUT_DIR, { recursive: true });

let browser;
try {
  browser = await firefox.launch({ headless: true });
} catch (err) {
  blocked(String(err?.message || err));
}

const matrix = [];
let launchError = null;

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
    localStorage.setItem("vapelog-theme", "light");
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isBenignConsoleNoise(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    const text = String(err);
    if (!isBenignConsoleNoise(text)) consoleErrors.push(text);
  });

  for (const route of CRITICAL_PATHS) {
    const url = new URL(route.path, BASE).href;
    const row = { id: route.id, url, ok: false, status: 0, consoleErrors: [] };
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      row.status = resp?.status() ?? 0;
      await page.waitForTimeout(400);
      const shot = join(OUT_DIR, `${route.id}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      row.screenshot = shot;
      row.consoleErrors = [...consoleErrors];
      consoleErrors.length = 0;
      row.ok = row.status === 200 && /Vapelog/i.test(await page.title());
    } catch (err) {
      row.error = String(err?.message || err);
    }
    matrix.push(row);
  }
  await context.close();
} catch (err) {
  launchError = String(err?.message || err);
} finally {
  await browser?.close();
}

const failures = matrix.filter((row) => !row.ok);
const summary = {
  ok: failures.length === 0 && !launchError,
  blocked: false,
  base: BASE,
  browser: "firefox",
  matrix,
  failures: failures.map((row) => row.id),
  launchError,
};

writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.ok ? 0 : 1;
