#!/usr/bin/env node
/**
 * Gate U8-B: node --test con umbral nativo (--test-coverage-lines), artefacto LCOV
 * y comprobación de informe ausente/vacío (Node 22.23.x).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  COVERAGE_EXCLUDE_GLOBS,
  COVERAGE_INCLUDE_GLOBS,
  COVERAGE_LINE_THRESHOLD,
  discoverUnitTestFiles,
  isInCoverageUniverse,
  normalizeLcovPath,
  childTestEnv,
  repoRoot,
} from "./unit-test-contract.mjs";

export { childTestEnv } from "./unit-test-contract.mjs";

/**
 * @typedef {{ linesFound: number, linesHit: number, branchesFound: number, branchesHit: number, functionsFound: number, functionsHit: number, files: number }} CoverageMetrics
 */

/**
 * @param {string} lcovText
 * @param {(rel: string) => boolean} [inUniverse]
 * @returns {CoverageMetrics}
 */
export function aggregateLcovMetrics(lcovText, inUniverse = isInCoverageUniverse) {
  /** @type {CoverageMetrics} */
  const totals = {
    linesFound: 0,
    linesHit: 0,
    branchesFound: 0,
    branchesHit: 0,
    functionsFound: 0,
    functionsHit: 0,
    files: 0,
  };
  let track = false;
  for (const raw of lcovText.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("SF:")) {
      const rel = normalizeLcovPath(line.slice(3));
      track = inUniverse(rel);
      if (track) totals.files += 1;
      continue;
    }
    if (!track) continue;
    if (line.startsWith("LF:")) totals.linesFound += Number.parseInt(line.slice(3), 10) || 0;
    if (line.startsWith("LH:")) totals.linesHit += Number.parseInt(line.slice(3), 10) || 0;
    if (line.startsWith("BRF:")) totals.branchesFound += Number.parseInt(line.slice(4), 10) || 0;
    if (line.startsWith("BRH:")) totals.branchesHit += Number.parseInt(line.slice(4), 10) || 0;
    if (line.startsWith("FNF:")) totals.functionsFound += Number.parseInt(line.slice(4), 10) || 0;
    if (line.startsWith("FNH:")) totals.functionsHit += Number.parseInt(line.slice(4), 10) || 0;
    if (line === "end_of_record") track = false;
  }
  return totals;
}

/**
 * @param {CoverageMetrics} m
 */
export function formatCoverageMetrics(m) {
  const pct = (hit, found) => (found > 0 ? ((hit / found) * 100).toFixed(2) : "n/a");
  return {
    lines: pct(m.linesHit, m.linesFound),
    branches: pct(m.branchesHit, m.branchesFound),
    functions: pct(m.functionsHit, m.functionsFound),
    files: m.files,
  };
}

/**
 * @param {string} lcovPath
 */
export function validateLcovArtifact(lcovPath) {
  try {
    const st = statSync(lcovPath);
    if (!st.isFile() || st.size === 0) {
      return { ok: false, reason: "informe LCOV vacío o ausente" };
    }
  } catch {
    return { ok: false, reason: `informe LCOV no encontrado: ${lcovPath}` };
  }
  const text = readFileSync(lcovPath, "utf8").trim();
  if (!text.includes("SF:")) {
    return { ok: false, reason: "informe LCOV sin registros SF:" };
  }
  return { ok: true, text };
}

/**
 * @param {string[]} testFiles rel paths
 * @param {{ lineThreshold?: number, lcovPath?: string, root?: string, execPath?: string }} [options]
 * @returns {string[]}
 */
export function buildCoverageNodeArgs(testFiles, options = {}) {
  const root = options.root ?? repoRoot();
  const lineThreshold = options.lineThreshold ?? COVERAGE_LINE_THRESHOLD;
  const lcovPath = options.lcovPath ?? join(root, "coverage", "lcov.info");
  const absTests = testFiles.map((rel) => join(root, rel));
  return [
    "--experimental-test-coverage",
    `--test-coverage-lines=${lineThreshold}`,
    ...COVERAGE_INCLUDE_GLOBS.flatMap((g) => [`--test-coverage-include=${g}`]),
    ...COVERAGE_EXCLUDE_GLOBS.flatMap((g) => [`--test-coverage-exclude=${g}`]),
    "--test-reporter=spec",
    "--test-reporter=lcov",
    "--test-reporter-destination=stdout",
    `--test-reporter-destination=${lcovPath}`,
    "--test",
    ...absTests,
  ];
}

/**
 * @param {{ root?: string, lineThreshold?: number, lcovPath?: string, execPath?: string, spawn?: typeof spawnSync }} [options]
 * @returns {{ status: number, metrics?: ReturnType<typeof formatCoverageMetrics> }}
 */
export function runCoverageGate(options = {}) {
  const root = options.root ?? repoRoot();
  const lineThreshold = options.lineThreshold ?? COVERAGE_LINE_THRESHOLD;
  const lcovPath = options.lcovPath ?? join(root, "coverage", "lcov.info");
  const execPath = options.execPath ?? process.execPath;
  const spawn = options.spawn ?? spawnSync;

  mkdirSync(dirname(lcovPath), { recursive: true });
  const testFiles = discoverUnitTestFiles(root);
  if (testFiles.length === 0) {
    console.error("coverage-gate: sin archivos de prueba");
    return { status: 2 };
  }

  const nodeArgs = buildCoverageNodeArgs(testFiles, { lineThreshold, lcovPath, root });
  const run = spawn(execPath, nodeArgs, {
    cwd: root,
    encoding: "utf8",
    env: childTestEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);

  const testStatus = run.status ?? 1;
  const artifact = validateLcovArtifact(lcovPath);
  if (!artifact.ok) {
    console.error(`coverage-gate: ${artifact.reason}`);
    return { status: testStatus !== 0 ? testStatus : 1 };
  }

  const metrics = formatCoverageMetrics(aggregateLcovMetrics(artifact.text));
  console.error(
    `coverage-gate (universo src/data + scripts): líneas ${metrics.lines}%, ramas ${metrics.branches}%, funciones ${metrics.functions}% (${metrics.files} ficheros en LCOV)`,
  );

  if (testStatus !== 0) {
    return { status: testStatus, metrics };
  }

  return { status: 0, metrics };
}

const isMain =
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === pathToFileURL(fileURLToPath(import.meta.url)).href;

if (isMain) {
  const { status } = runCoverageGate();
  process.exit(status);
}
