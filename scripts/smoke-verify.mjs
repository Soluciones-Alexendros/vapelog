#!/usr/bin/env node
// smoke-verify: verificación en navegador real de la fase S7 (plan v2 §7).
//
// Checks Playwright/CDP contra el build de producción local:
//   memory   — 3 muestras de heap separadas N s (GC forzado antes de medir);
//              vigila crecimiento sostenido (fuga retenida).
//   cls-lcp  — suma de `layout-shift` sin `hadRecentInput` y `LCP`, con el humo
//              on y off (vapelog-fx), para detectar regresión.
//   reduced  — `prefers-reduced-motion: reduce`: ausencia del hook del humo y
//              `.smoke-layer { display:none }`; instrumenta rAF para comparar
//              el conteo de callbacks con/sin reducción (evidencia de apoyo).
//
// Reutiliza los patrones de scripts/smoke-bench.mjs/visual-smoke.mjs (guard
// loopback, ensureServer, salto de puerta de edad, Chromium headless).
//
// Uso:
//   node scripts/smoke-verify.mjs [--checks memory,cls,reduced] [--route /]
//     [--theme light] [--width 1280] [--memory-samples 3]
//     [--memory-interval 60] [--memory-warmup 20] [--lcp-wait 4] [--strict]
// Por defecto exit 0 (arnés de evidencias); con --strict falla si el check
// reduced-motion incumple sus aserciones duras.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(0);
}

function parseArgs(argv) {
  const opts = {
    checks: ["memory", "cls", "reduced"],
    route: "/",
    theme: "light",
    width: 1280,
    memorySamples: 3,
    memoryInterval: 60,
    memoryWarmup: 20,
    lcpWait: 4,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--checks")
      opts.checks = String(argv[++i])
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (arg === "--route") opts.route = String(argv[++i]);
    else if (arg === "--theme") opts.theme = String(argv[++i]);
    else if (arg === "--width") opts.width = Number(argv[++i]);
    else if (arg === "--memory-samples") opts.memorySamples = Number(argv[++i]);
    else if (arg === "--memory-interval") opts.memoryInterval = Number(argv[++i]);
    else if (arg === "--memory-warmup") opts.memoryWarmup = Number(argv[++i]);
    else if (arg === "--lcp-wait") opts.lcpWait = Number(argv[++i]);
    else if (arg === "--strict") opts.strict = true;
    else if (!arg.startsWith("--") && i === argv.length - 1 && /^\//.test(arg))
      opts.route = String(arg);
  }
  if (!Number.isFinite(opts.memorySamples) || opts.memorySamples < 2) opts.memorySamples = 3;
  if (!Number.isFinite(opts.memoryInterval) || opts.memoryInterval <= 0) opts.memoryInterval = 60;
  if (!Number.isFinite(opts.memoryWarmup) || opts.memoryWarmup < 0) opts.memoryWarmup = 20;
  if (!Number.isFinite(opts.lcpWait) || opts.lcpWait <= 0) opts.lcpWait = 4;
  if (opts.theme !== "dark" && opts.theme !== "light") opts.theme = "light";
  if (!Number.isFinite(opts.width) || opts.width <= 0) opts.width = 1280;
  if (!opts.route.startsWith("/")) opts.route = `/${opts.route}`;
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const PORT = process.env.SMOKE_VERIFY_PORT || "4177";
const BASE = checkedUrl(process.env.SMOKE_VERIFY_URL || `http://127.0.0.1:${PORT}/`);
const TIMEOUT_MS = Number(process.env.SMOKE_VERIFY_TIMEOUT_MS || 45000);
const HEIGHTS = { 360: 800, 768: 1024, 1280: 900 };
const height = HEIGHTS[opts.width] ?? 900;
const ROUTE_URL = () => new URL(opts.route, BASE).href;
const MB = 1024 * 1024;

let serverPid = null;

async function ensureServer() {
  const entry = join(REPO_ROOT, ".output", "server", "index.mjs");
  if (!existsSync(entry)) {
    fail("sin build previo; ejecuta pnpm run build antes");
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

function makeContext(browser, { fx, reducedMotion } = {}) {
  return browser
    .newContext({
      viewport: { width: opts.width, height },
      colorScheme: opts.theme === "dark" ? "dark" : "light",
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    })
    .then(async (context) => {
      await context.addInitScript(
        ({ theme, fx: fxValue }) => {
          sessionStorage.setItem("vapelog-edad", "ok");
          try {
            localStorage.setItem("vapelog-theme", theme);
            if (fxValue) localStorage.setItem("vapelog-fx:v2", fxValue === "off" ? "off" : "on");
          } catch {
            // almacenamiento no disponible
          }
          document.documentElement?.classList.toggle("dark", theme === "dark");
        },
        { theme: opts.theme, fx: fx ?? null },
      );
      return context;
    });
}

async function memoryCheck(browser) {
  const context = await makeContext(browser, { fx: "on" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable").catch(() => {});
  await page.goto(ROUTE_URL(), { waitUntil: "load", timeout: TIMEOUT_MS });
  await page
    .waitForFunction(() => Boolean(window.__vapelogSmoke), null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(opts.memoryWarmup * 1000);
  const samples = [];
  for (let i = 0; i < opts.memorySamples; i++) {
    if (i > 0) await page.waitForTimeout(opts.memoryInterval * 1000);
    // GC forzado para medir memoria RETENIDA, no basura pendiente.
    await cdp.send("HeapProfiler.collectGarbage").catch(() => {});
    await page.waitForTimeout(300);
    const performanceMemory = await page.evaluate(() =>
      typeof performance !== "undefined" && performance.memory
        ? performance.memory.usedJSHeapSize
        : null,
    );
    const metrics = await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }));
    const jsHeapUsedSize = metrics.metrics.find((m) => m.name === "JSHeapUsedSize")?.value ?? null;
    samples.push({
      t: i,
      elapsedS: Math.round((opts.memoryWarmup + i * opts.memoryInterval) * 10) / 10,
      usedJSHeapSize: performanceMemory,
      cdpJsHeapUsedSize: jsHeapUsedSize,
    });
  }
  // Se prefiere el valor CDP (preciso). `performance.memory.usedJSHeapSize`
  // viene cuantizado (p. ej. 10 MB) salvo `--enable-precise-memory-info`, así
  // que solo se usa como respaldo.
  const used = samples.map((s) => s.cdpJsHeapUsedSize ?? s.usedJSHeapSize).filter((v) => v != null);
  const first = used[0] ?? null;
  const last = used[used.length - 1] ?? null;
  const growthBytes = first != null && last != null ? last - first : null;
  const growthPct = first ? (growthBytes / first) * 100 : null;
  const monotonic = used.every((v, i) => i === 0 || v >= used[i - 1]);
  // Veredicto: retención estable si la última muestra no supera en >10% (ni
  // +8 MB) la primera. El umbral es heurístico; se documentan los valores crudos.
  const sustainedGrowth = growthBytes != null && growthBytes > Math.max(8 * MB, first * 0.1);
  const tier = await page.evaluate(() =>
    window.__vapelogSmoke && typeof window.__vapelogSmoke.tier === "number"
      ? window.__vapelogSmoke.tier
      : null,
  );
  await context.close();
  return {
    check: "memory",
    route: opts.route,
    warmupS: opts.memoryWarmup,
    intervalS: opts.memoryInterval,
    samples,
    usedBytes: used,
    usedMB: used.map((v) => Math.round((v / MB) * 100) / 100),
    growthBytes,
    growthMB: growthBytes != null ? Math.round((growthBytes / MB) * 100) / 100 : null,
    growthPct: growthPct != null ? Math.round(growthPct * 100) / 100 : null,
    monotonic,
    sustainedGrowth,
    verdict: sustainedGrowth ? "FAIL (crecimiento sostenido)" : "PASS (retención estable)",
    smokeTier: tier,
  };
}

async function clsLcpCheck(browser, fx) {
  const context = await makeContext(browser, { fx });
  await context.addInitScript(() => {
    window.__perf = { cls: 0, lcp: 0, shifts: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__perf.cls += entry.value;
            window.__perf.shifts += 1;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // layout-shift no soportado
    }
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__perf.lcp = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP no soportado
    }
  });
  const page = await context.newPage();
  await page.goto(ROUTE_URL(), { waitUntil: "load", timeout: TIMEOUT_MS });
  await page.waitForTimeout(opts.lcpWait * 1000);
  // Un poco de scroll para disparar posibles shifts tardíos.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const perf = await page.evaluate(() => ({
    cls: window.__perf?.cls ?? null,
    shifts: window.__perf?.shifts ?? null,
    lcp: window.__perf?.lcp ?? null,
    hook: Boolean(window.__vapelogSmoke),
    tier: window.__vapelogSmoke?.tier ?? null,
    lcpElement: (() => {
      try {
        const entries = performance.getEntriesByType("largest-contentful-paint");
        const last = entries[entries.length - 1];
        return last?.element ? last.element.tagName : null;
      } catch {
        return null;
      }
    })(),
  }));
  await context.close();
  return {
    check: "cls-lcp",
    fx,
    cls: perf.cls != null ? Math.round(perf.cls * 100000) / 100000 : null,
    shifts: perf.shifts,
    lcpMs: perf.lcp != null ? Math.round(perf.lcp * 10) / 10 : null,
    lcpElement: perf.lcpElement,
    hook: perf.hook,
    tier: perf.tier,
  };
}

async function reducedMotionCheck(browser) {
  // Contexto con reducción de movimiento: se instrumenta rAF antes de cargar
  // para contar callbacks; se busca el hook del humo y el display de la capa.
  const context = await makeContext(browser, { reducedMotion: true });
  await context.addInitScript(() => {
    window.__raf = { count: 0, stacks: [] };
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      window.__raf.count += 1;
      if (window.__raf.stacks.length < 40) {
        try {
          const line = (new Error().stack || "").split("\n").slice(2, 4).join(" | ");
          window.__raf.stacks.push(line);
        } catch {
          // sin stack
        }
      }
      return orig(cb);
    };
  });
  const page = await context.newPage();
  await page.goto(ROUTE_URL(), { waitUntil: "load", timeout: TIMEOUT_MS });
  await page.waitForTimeout(2000);
  const reduced = await page.evaluate(() => {
    const layer = document.querySelector(".smoke-layer");
    return {
      hook: Boolean(window.__vapelogSmoke),
      layerPresent: Boolean(layer),
      display: layer ? window.getComputedStyle(layer).display : null,
      ready: layer ? (layer.dataset.ready ?? null) : null,
      rafCount: window.__raf.count,
      rafStacks: window.__raf.stacks,
    };
  });
  await context.close();

  // Control: mismo tiempo y ruta pero con movimiento permitido (fx on).
  const controlContext = await makeContext(browser, { fx: "on" });
  await controlContext.addInitScript(() => {
    window.__raf = { count: 0 };
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      window.__raf.count += 1;
      return orig(cb);
    };
  });
  const controlPage = await controlContext.newPage();
  await controlPage.goto(ROUTE_URL(), { waitUntil: "load", timeout: TIMEOUT_MS });
  await controlPage.waitForTimeout(2000);
  const control = await controlPage.evaluate(() => ({
    hook: Boolean(window.__vapelogSmoke),
    rafCount: window.__raf.count,
  }));
  await controlContext.close();

  const smokeStackHint = reduced.rafStacks.some((s) => /smoke/i.test(s));
  const pass = reduced.hook === false && reduced.display === "none";
  return {
    check: "reduced-motion",
    hook: reduced.hook,
    layerPresent: reduced.layerPresent,
    display: reduced.display,
    ready: reduced.ready,
    rafCountReduced: reduced.rafCount,
    rafCountControl: control.rafCount,
    controlHook: control.hook,
    smokeStackHint,
    rafStacksSample: reduced.rafStacks.slice(0, 5),
    verdict: pass ? "PASS (sin hook, display:none)" : "FAIL",
    // Límite: en el build de producción los nombres de función están
    // minificados; la atribución por pila de rAF no es concluyente. La
    // evidencia dura es la ausencia de hook + display:none.
    attributionNote:
      "paquete de producción minificado: la pila de rAF no identifica con " +
      "fiabilidad el callback del humo; se usa ausencia de hook + display:none.",
  };
}

await ensureServer();
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const report = { ok: true, route: opts.route, theme: opts.theme, width: opts.width, checks: {} };
try {
  if (opts.checks.includes("memory")) {
    report.checks.memory = await memoryCheck(browser);
  }
  if (opts.checks.includes("cls")) {
    report.checks.clsLcp = {
      on: await clsLcpCheck(browser, "on"),
      off: await clsLcpCheck(browser, "off"),
    };
  }
  if (opts.checks.includes("reduced")) {
    report.checks.reducedMotion = await reducedMotionCheck(browser);
  }
} finally {
  await browser.close();
  await stopServer();
}

const m = report.checks.memory;
if (m && m.sustainedGrowth) report.ok = false;
const rm = report.checks.reducedMotion;
if (rm && rm.verdict.startsWith("FAIL")) report.ok = false;
const cls = report.checks.clsLcp;
if (cls) {
  const clsOn = cls.on.cls ?? 0;
  const clsOff = cls.off.cls ?? 0;
  if (clsOn > 0.05 || clsOff > 0.05) report.ok = false;
}

console.log(JSON.stringify(report, null, 2));
if (m) {
  console.log(
    `memoria ${opts.route}: heap ${m.usedMB.join(" → ")} MB ` +
      `(Δ ${m.growthMB} MB / ${m.growthPct}%, monotónico=${m.monotonic}) → ${m.verdict}`,
  );
}
if (cls) {
  console.log(
    `cls-lcp ${opts.route}: CLS humo=${cls.on.cls} sin-humo=${cls.off.cls}; ` +
      `LCP humo=${cls.on.lcpMs}ms sin-humo=${cls.off.lcpMs}ms (elemento ${cls.on.lcpElement})`,
  );
}
if (rm) {
  console.log(
    `reduced-motion ${opts.route}: hook=${rm.hook} display=${rm.display} ` +
      `raf(reduced=${rm.rafCountReduced} control=${rm.rafCountControl}) → ${rm.verdict}`,
  );
}
process.exitCode = opts.strict && !report.ok ? 1 : 0;
