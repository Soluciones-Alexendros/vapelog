#!/usr/bin/env node
// smoke-bench: tras ADR-0016/U5 el humo ya no se monta. Este script comprueba
// la ausencia de canvas FX (mismo contrato que e2e/fx-smoke.spec.ts) y sale 0.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const PORT = process.env.SMOKE_BENCH_PORT || "4176";
const ROUTE = process.argv.includes("--route")
  ? process.argv[process.argv.indexOf("--route") + 1]
  : "/";
const THEME = process.argv.includes("--theme")
  ? process.argv[process.argv.indexOf("--theme") + 1]
  : "light";

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
}

let serverPid = null;

async function ensureServer() {
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) fail("sin build previo; ejecuta pnpm run build");
  const child = spawn(process.execPath, [entry], {
    cwd: REPO_ROOT,
    env: { ...process.env, HOST: "127.0.0.1", NITRO_HOST: "127.0.0.1", NITRO_PORT: PORT, PORT },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverPid = child.pid;
  const base = `http://127.0.0.1:${PORT}`;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base);
      if (res.ok || res.status === 404) return base;
    } catch {
      /* waiting */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail("servidor de preview no arrancó");
}

function stopServer() {
  if (serverPid) {
    try {
      process.kill(serverPid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

async function main() {
  const base = await ensureServer();
  const url = new URL(ROUTE, base).href;
  const host = new URL(url).hostname;
  if (!LOOPBACK.has(host)) fail(`host no loopback: ${host}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      colorScheme: THEME === "dark" ? "dark" : "light",
    });
    await context.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
      try {
        localStorage.setItem("vapelog-fx:v2", "on");
        localStorage.setItem("vapelog-fx", "on");
      } catch {
        /* ignore */
      }
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
    const canvasCount = await page.locator("canvas[data-fx]").count();
    const layerCount = await page.locator(".smoke-layer").count();
    const readyCount = await page.locator('[data-fx-ready="true"]').count();
    const row = {
      ok: canvasCount === 0 && layerCount === 0 && readyCount === 0,
      theme: THEME,
      route: ROUTE,
      canvasCount,
      layerCount,
      readyCount,
      smokeMeanMs: null,
      smokeP95Ms: null,
      cpu: 1,
      note: "humo retirado (ADR-0016/U5); contrato de ausencia",
    };
    console.log(JSON.stringify(row));
    if (!row.ok) fail("se detectó canvas o capa de humo");
  } finally {
    await browser.close();
    stopServer();
  }
}

main().catch((err) => {
  stopServer();
  fail(String(err?.message || err));
});
