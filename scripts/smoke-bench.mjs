#!/usr/bin/env node
// smoke-bench: banco de pruebas del humo (S0 create, S7 ampliado a coste propio).
//
// Mide DOS magnitudes durante N segundos en una ruta:
//   1. rAF de la página (deltas entre frames) — salud global / jank.
//   2. coste PROPIO del humo: muestrea `window.__vapelogSmoke.lastFrameCostMs`
//      por cada fotograma que dibuja el componente (deduplicado por frameId).
//      Ese valor es el `performance.now()` de `stepSmoke` + `draw`, es decir el
//      trabajo real del humo, no el vsync de la página. Si el humo está off o
//      desmontado, el coste es N/A.
// Además registra tareas largas (`PerformanceObserver('longtask')`).
//
// Reutiliza los patrones de scripts/visual-smoke.mjs y scripts/a11y-pass.mjs:
// guard loopback (checkedUrl), ensureServer (spawn process.execPath
// .output/server/index.mjs con PORT/HOST=127.0.0.1), context.addInitScript para
// saltar la puerta de edad, chromium headless con --no-sandbox
// --disable-dev-shm-usage. S7 añade CDP `Emulation.setCPUThrottlingRate` para
// la pasada a CPU ×N y controles de `vapelog-fx` y `prefers-reduced-motion`.
//
// Uso:
//   node scripts/smoke-bench.mjs [--seconds 10] [--route /] [--theme light|dark]
//     [--width 1280] [--dpr 1] [--cpu 1] [--fx on|off] [--reduced-motion]
// Sale siempre con exit 0 (en CI es informativo, no puerta).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- target guard (mismo criterio que visual-smoke.mjs) ---
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function checkedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return fail(`not a valid URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return fail(`only http/https URLs are allowed, got ${parsed.protocol} in ${url}`);
  }
  if (!LOOPBACK_HOSTNAMES.has(parsed.hostname) && process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1") {
    return fail(
      `${parsed.hostname} is not a loopback host; this script drives the ` +
        "local production server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.",
    );
  }
  return url;
}

function fail(message) {
  // Informativo: exit 0 siempre aunque falle la medición.
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(0);
}
// --- end target guard ---

function parseArgs(argv) {
  const opts = {
    seconds: 10,
    route: "/",
    theme: "light",
    width: 1280,
    dpr: 1,
    cpu: 1,
    fx: "on",
    reducedMotion: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--seconds") opts.seconds = Number(argv[++i]);
    else if (arg === "--route") opts.route = String(argv[++i]);
    else if (arg === "--theme") opts.theme = String(argv[++i]);
    else if (arg === "--width") opts.width = Number(argv[++i]);
    else if (arg === "--dpr") opts.dpr = Number(argv[++i]);
    else if (arg === "--cpu") opts.cpu = Number(argv[++i]);
    else if (arg === "--fx") opts.fx = String(argv[++i]);
    else if (arg === "--reduced-motion") opts.reducedMotion = true;
    else if (!arg.startsWith("--") && i === argv.length - 1 && /^\//.test(arg)) opts.route = arg;
  }
  if (!Number.isFinite(opts.seconds) || opts.seconds <= 0) opts.seconds = 10;
  if (opts.seconds > 120) opts.seconds = 120;
  if (opts.theme !== "dark" && opts.theme !== "light") opts.theme = "light";
  if (!Number.isFinite(opts.width) || opts.width <= 0) opts.width = 1280;
  if (!Number.isFinite(opts.dpr) || opts.dpr <= 0) opts.dpr = 1;
  if (!Number.isFinite(opts.cpu) || opts.cpu < 1) opts.cpu = 1;
  if (opts.cpu > 20) opts.cpu = 20;
  if (opts.fx !== "off") opts.fx = "on";
  if (!opts.route.startsWith("/")) opts.route = `/${opts.route}`;
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const PORT = process.env.SMOKE_BENCH_PORT || "4176";
const BASE = checkedUrl(process.env.SMOKE_BENCH_URL || `http://127.0.0.1:${PORT}/`);
const TIMEOUT_MS = Number(process.env.SMOKE_BENCH_TIMEOUT_MS || 45000);
const HEIGHTS = { 360: 800, 768: 1024, 1280: 900 };
const height = HEIGHTS[opts.width] ?? 900;

let serverPid = null;

async function ensureServer() {
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) {
    fail("sin build previo; ejecuta pnpm run build antes (como hace scripts/smoke.sh)");
    return;
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
      return;
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

const round2 = (n) => Math.round(n * 100) / 100;
function summarize(values) {
  if (!values.length) return { mean: null, p95: null, max: null, n: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  return {
    mean: round2(mean),
    p95: round2(p95),
    max: round2(sorted[sorted.length - 1]),
    n: values.length,
  };
}

async function runBench() {
  await ensureServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: opts.width, height },
      colorScheme: opts.theme === "dark" ? "dark" : "light",
      deviceScaleFactor: opts.dpr,
      reducedMotion: opts.reducedMotion ? "reduce" : "no-preference",
    });
    // Puerta de edad saltada + tema + preferencia de efectos fijados.
    await context.addInitScript(
      ({ theme, fx }) => {
        sessionStorage.setItem("vapelog-edad", "ok");
        try {
          localStorage.setItem("vapelog-theme", theme);
          localStorage.setItem("vapelog-fx", fx);
        } catch {
          // almacenamiento no disponible: el colorScheme sigue aplicando
        }
        document.documentElement?.classList.toggle("dark", theme === "dark");
      },
      { theme: opts.theme, fx: opts.fx },
    );
    const page = await context.newPage();
    if (opts.cpu > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: opts.cpu });
    }
    const url = new URL(opts.route, BASE).href;
    await page.goto(url, { waitUntil: "load", timeout: TIMEOUT_MS });
    await page.waitForTimeout(600);
    const stats = await page.evaluate(async (seconds) => {
      const pageDeltas = [];
      const smokeCosts = [];
      let longtasks = 0;
      let observer;
      let lastFrameId = -1;
      try {
        observer = new PerformanceObserver((list) => {
          longtasks += list.getEntries().length;
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        // PerformanceObserver/longtask no disponible: se mide sin longtasks.
      }
      await new Promise((resolve) => {
        let last = performance.now();
        const start = last;
        function frame(now) {
          pageDeltas.push(now - last);
          const h = window.__vapelogSmoke;
          if (h && typeof h.frameId === "number" && h.frameId !== lastFrameId) {
            lastFrameId = h.frameId;
            if (typeof h.lastFrameCostMs === "number") smokeCosts.push(h.lastFrameCostMs);
          }
          last = now;
          if (now - start < seconds * 1000) window.requestAnimationFrame(frame);
          else resolve();
        }
        window.requestAnimationFrame(frame);
      });
      if (observer) observer.disconnect();
      const h = window.__vapelogSmoke;
      return {
        pageDeltas,
        smokeCosts,
        longtasks,
        hook: Boolean(h),
        tier: h && typeof h.tier === "number" ? h.tier : null,
        emaMs: h && typeof h.emaMs === "number" ? Math.round(h.emaMs * 100) / 100 : null,
      };
    }, opts.seconds);
    const pageStats = summarize(stats.pageDeltas);
    const smoke = summarize(stats.smokeCosts);
    const result = {
      route: opts.route,
      theme: opts.theme,
      width: opts.width,
      dpr: opts.dpr,
      cpu: opts.cpu,
      fx: opts.fx,
      reducedMotion: opts.reducedMotion,
      seconds: opts.seconds,
      hook: stats.hook,
      tier: stats.tier,
      emaMs: stats.emaMs,
      smokeMeanMs: smoke.mean,
      smokeP95Ms: smoke.p95,
      smokeMaxMs: smoke.max,
      smokeFrames: smoke.n,
      pageMeanMs: pageStats.mean,
      pageP95Ms: pageStats.p95,
      longtasks: stats.longtasks,
      pageFrames: pageStats.n,
    };
    console.log(JSON.stringify(result));
    const smokeLine = stats.hook
      ? `humo: mean=${smoke.mean ?? "N/A"}ms p95=${smoke.p95 ?? "N/A"}ms ` +
        `max=${smoke.max ?? "N/A"}ms frames=${smoke.n} tier=${stats.tier} ema=${stats.emaMs}ms`
      : `humo: N/A (hook ausente; fx=${opts.fx})`;
    console.log(
      `bench ${result.route} ${result.theme} ${result.width}px dpr=${result.dpr}` +
        `${opts.cpu > 1 ? ` cpu=${opts.cpu}x` : ""}${opts.reducedMotion ? " reduced-motion" : ""} ` +
        `${result.seconds}s: ${smokeLine} | página: mean=${pageStats.mean}ms p95=${pageStats.p95}ms ` +
        `frames=${pageStats.n} longtasks=${stats.longtasks}`,
    );
    await context.close();
  } finally {
    await browser.close();
    await stopServer();
  }
}

try {
  await runBench();
  process.exitCode = 0;
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
  process.exitCode = 0;
}
