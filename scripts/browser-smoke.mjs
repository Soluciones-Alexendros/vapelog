#!/usr/bin/env node
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { computeBrandWarnings } from "./brand-check.mjs";
import {
  baselineComparison,
  bodyTextPrefix,
  derivedPaths,
  exitCodeFor,
  normalizeBodyText,
  normalizedBodyTextHash,
  parseSmokeArgs,
} from "./browser-smoke-verdict.mjs";

// --- target guards (inlined from the retired browser-guard.mjs) ---
// Both this script and a11y-pass.mjs run Chromium with `--no-sandbox` and take
// their URL and output path from argv, so unchecked they would render
// file:///secrets into a PNG and write it anywhere.
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** http/https loopback only, else exit 1. `BROWSER_ALLOW_EXTERNAL_HOST=1` opts out. */
function checkedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    failGuard(`not a valid URL: ${url}`);
  }
  // Rules out file:, data:, chrome:, view-source:.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    failGuard(`only http/https URLs are allowed, got ${parsed.protocol} in ${url}`);
  }
  if (!LOOPBACK_HOSTNAMES.has(parsed.hostname) && process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1") {
    failGuard(
      `${parsed.hostname} is not a loopback host; this script screenshots the ` +
        `local dev server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.`,
    );
  }
  return url;
}

/** Absolute `target` if it is strictly inside `allowedDirs`, else exit 1. */
function checkedOutputPath(target, allowedDirs, label = "screenshot") {
  // Resolve first so `..` cannot slip past the prefix check.
  const abs = resolve(target);
  const allowed = allowedDirs.some((dir) => abs.startsWith(dir.endsWith(sep) ? dir : dir + sep));
  if (!allowed) {
    failGuard(`${label} path must be under ${allowedDirs.join(" or ")}, got ${abs}`);
  }
  return abs;
}

function failGuard(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}
// --- end target guards ---

const args = parseSmokeArgs(process.argv.slice(2), process.env);
if (args.error) {
  console.error(JSON.stringify({ ok: false, error: args.error }, null, 2));
  process.exit(1);
}

const url = checkedUrl(args.url);
const outPng = checkedOutputPath(args.outPng, [REPO_ROOT]);
const derived = derivedPaths(outPng);
const mobilePng = checkedOutputPath(derived.mobilePng, [REPO_ROOT]);
const outJson = checkedOutputPath(derived.verdictJson, [REPO_ROOT], "verdict JSON");

const MAX_BASELINE_BYTES = 1024 * 1024;
const baselineRequested = Boolean(args.baseline);
let baselinePath = null;
let baselineResolveError = null;
if (baselineRequested) {
  try {
    baselinePath = checkedOutputPath(realpathSync(args.baseline), [REPO_ROOT], "baseline");
  } catch (err) {
    baselineResolveError = err?.code ?? "unresolvable path";
  }
  if (baselinePath === outJson) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error:
            `--baseline ${args.baseline} is this run's own verdict output; ` +
            "pass a distinct output PNG (e.g. built.png) so the baseline is not overwritten",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 45000);

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, screenshot: outPng },
  { name: "mobile", width: 390, height: 844, screenshot: mobilePng },
];

/** Rutas de ficha (un dominio cada una) para el pase extendido. */
const SHEET_PATHS = [
  "/dispositivos/vaporesso-xros-6",
  "/dispositivos/geekvape-aegis-hero-5",
  "/dispositivos/voopoo-argus-g4",
  "/dispositivos/oxva-xlim-pro-3",
  "/resistencias/xros-corex-0-4",
  "/liquidos/vampire-vape-heisenberg-sales",
  "/componentes/celda-18650-alto-drenaje",
];

mkdirSync(dirname(outPng), { recursive: true });

async function captureViewport(browser, vp, pageUrl, theme) {
  const errors = { consoleErrors: [], pageErrors: [] };
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.pageErrors.push(String(err?.message || err)));
  if (theme === "dark") {
    await page.addInitScript(() => {
      localStorage.setItem("vapelog-theme", "dark");
      document.documentElement.classList.add("dark");
    });
  } else if (theme === "light") {
    await page.addInitScript(() => {
      localStorage.setItem("vapelog-theme", "light");
      document.documentElement.classList.remove("dark");
    });
  }
  const resp = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  const status = resp?.status() ?? 0;
  await page.waitForTimeout(1000);

  const title = await page.title();
  const hasCanvas = (await page.locator("canvas").count()) > 0;
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  const horizontalOverflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 1;
  });
  const hasVapelog = /Vapelog/i.test(bodyText);
  const screenshotPath =
    theme === "dark" ? vp.screenshot.replace(/\.png$/i, `.dark.png`) : vp.screenshot;
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await page.close();

  return {
    width: vp.width,
    height: vp.height,
    status,
    title,
    hasCanvas,
    hasVapelog,
    theme: theme ?? "default",
    bodyTextLen: normalizeBodyText(bodyText).length,
    bodyTextHash: normalizedBodyTextHash(bodyText),
    bodyTextPrefix: bodyTextPrefix(bodyText),
    horizontalOverflow,
    consoleErrors: errors.consoleErrors,
    pageErrors: errors.pageErrors,
    screenshot: screenshotPath,
  };
}

function compareAgainstBaseline(verdict) {
  if (!baselinePath) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${baselineResolveError ?? "unresolvable path"}`],
    };
  }
  try {
    if (statSync(baselinePath).size > MAX_BASELINE_BYTES) {
      return { divergesFromBaseline: true, reasons: ["baseline unreadable: too large"] };
    }
    return baselineComparison(verdict, readFileSync(baselinePath, "utf8"));
  } catch (err) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${err?.code ?? "read error"}`],
    };
  }
}

let browser = null;
try {
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const viewports = {};
  for (const vp of VIEWPORTS) {
    viewports[vp.name] = await captureViewport(browser, vp, url, "light");
  }

  // Pase extendido: tema oscuro (desktop) + una ficha por dominio.
  const extended = { darkDesktop: null, sheets: {} };
  extended.darkDesktop = await captureViewport(browser, VIEWPORTS[0], url, "dark");
  const base = new URL(url);
  for (const path of SHEET_PATHS) {
    const sheetUrl = new URL(path, base).href;
    try {
      extended.sheets[path] = await captureViewport(
        browser,
        {
          name: "sheet",
          width: 1280,
          height: 800,
          screenshot: join(dirname(outPng), `sheet${path.replaceAll("/", "-")}.png`),
        },
        sheetUrl,
        "light",
      );
    } catch (err) {
      extended.sheets[path] = { status: 0, error: String(err?.message || err) };
    }
  }

  const brandWarnings = computeBrandWarnings({ hasCanvas: viewports.desktop.hasCanvas });
  const verdict = { url, viewports, extended, brandWarnings, verdictFile: outJson };
  if (baselineRequested) {
    const { divergesFromBaseline, reasons } = compareAgainstBaseline(verdict);
    verdict.divergesFromBaseline = divergesFromBaseline;
    verdict.baselineReasons = reasons;
  }

  writeFileSync(outJson, JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
  for (const w of brandWarnings) console.error(w);
  // Set the code rather than aborting the process so the `finally` browser
  // teardown always runs (agents typically smoke twice per turn; leaking
  // Chromium accumulates across retries).
  process.exitCode = exitCodeFor(viewports);
} catch (err) {
  const failure = { ok: false, url, error: String(err?.message || err) };
  try {
    writeFileSync(outJson, JSON.stringify(failure, null, 2));
  } catch (writeErr) {
    failure.verdictWriteError = String(writeErr?.message || writeErr);
  }
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
