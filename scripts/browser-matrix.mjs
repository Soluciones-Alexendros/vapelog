#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.E2E_PORT || "4175";
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = join(REPO_ROOT, "artifacts", "browser-matrix");

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exit ${code}`));
    });
  });
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}

if (!existsSync(join(REPO_ROOT, ".output", "server", "index.mjs"))) {
  fail("sin build previo; ejecuta pnpm run build");
}

mkdirSync(OUT_DIR, { recursive: true });

const server = spawn(process.execPath, [join(REPO_ROOT, ".output", "server", "index.mjs")], {
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

let ready = false;
for (let i = 0; i < 60; i++) {
  if (server.exitCode != null) fail("el servidor murió al arrancar");
  try {
    if ((await fetch(`${BASE}/`)).ok) {
      ready = true;
      break;
    }
  } catch {
    void 0;
  }
  await new Promise((r) => setTimeout(r, 500));
}
if (!ready) fail(`timeout esperando ${BASE}/`);

let exitCode = 0;
const started = new Date().toISOString();
try {
  await run("pnpm", ["exec", "playwright", "test", "-c", "playwright.matrix.config.ts"], {
    E2E_BASE_URL: `${BASE}/`,
    E2E_PORT: PORT,
  });
} catch {
  exitCode = 1;
}

try {
  process.kill(server.pid, "SIGTERM");
} catch {
  void 0;
}

const summary = {
  ok: exitCode === 0,
  started,
  base: BASE,
  config: "playwright.matrix.config.ts",
  projects: [
    "chromium-desktop-light",
    "chromium-desktop-dark",
    "chromium-mobile-light",
    "chromium-mobile-dark",
  ],
  artifacts: join(OUT_DIR, "..", "playwright-matrix"),
};
writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(exitCode);
