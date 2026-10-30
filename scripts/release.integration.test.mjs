/**
 * Ensayos de release con deps inyectadas (sin red ni escritura remota).
 * Cubre dry-run, idempotencia de tag/release y ausencia de push a main.
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { main, planRelease } from "./release.mjs";

/**
 * @param {Record<string, string | ((args: string[]) => string)>} handlers
 */
function fakeRun(handlers) {
  /** @type {string[][]} */
  const calls = [];
  /**
   * @param {string} cmd
   * @param {string[]} args
   */
  const run = (cmd, args) => {
    calls.push([cmd, ...args]);
    const key = `${cmd} ${args.join(" ")}`;
    for (const [pattern, value] of Object.entries(handlers)) {
      if (key === pattern || key.startsWith(pattern)) {
        return typeof value === "function" ? value(args) : value;
      }
    }
    throw new Error(`fakeRun: comando no mockeado: ${key}`);
  };
  return { run, calls };
}

test("dry-run open-pr no escribe package.json ni llama a git push/gh", () => {
  const prev = process.argv;
  process.argv = [prev[0], prev[1], "--dry-run"];
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "vapelog", version: "0.13.0" }, null, 2) + "\n",
    );
    writeFileSync(
      join(dir, "CHANGELOG.md"),
      `# Changelog\n\n## [Unreleased]\n\n### Cambios\n\n- feat: algo\n\n## [0.13.0] - 2026-10-24\n\n- old\n`,
    );
    const { run, calls } = fakeRun({
      "git describe --tags --abbrev=0": "v0.13.0",
      "git log v0.13.0..HEAD": "feat: algo\n\n----END----\n",
      "git tag --list v0.14.0": "",
      "git rev-parse HEAD": "deadbeef",
    });
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      const plan = main({
        run,
        readFile: (p, enc) =>
          readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
        writeFile: () => {
          throw new Error("dry-run no debe escribir");
        },
        env: { GITHUB_SHA: "deadbeef" },
        now: () => new Date("2026-10-30T12:00:00Z"),
      });
      assert.equal(plan.action, "open-pr");
      assert.ok(!calls.some((c) => c[0] === "gh"));
      assert.ok(!calls.some((c) => c.includes("push")));
      assert.equal(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version, "0.13.0");
    } finally {
      process.chdir(cwd);
    }
  } finally {
    process.argv = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publish: tag ausente crea tag y gh release; segunda pasada skip", () => {
  const tags = new Set();
  const releases = new Set();
  /** @type {string[][]} */
  const calls = [];
  /**
   * @param {string} cmd
   * @param {string[]} args
   */
  const run = (cmd, args) => {
    calls.push([cmd, ...args]);
    if (cmd === "git" && args[0] === "describe") return "v0.13.0";
    if (cmd === "git" && args[0] === "log") return "feat: bump\n\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") {
      return tags.has(args[2]) ? args[2] : "";
    }
    if (cmd === "git" && args[0] === "tag" && args[1]?.startsWith("v")) {
      tags.add(args[1]);
      return "";
    }
    if (cmd === "git" && args[0] === "push") return "";
    if (cmd === "git" && args[0] === "rev-parse") return "sha1";
    if (cmd === "gh" && args[0] === "release" && args[1] === "create") {
      if (releases.has(args[2])) throw new Error("release duplicada");
      releases.add(args[2]);
      return `https://example.test/${args[2]}`;
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };

  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  const changelog = `# Changelog\n\n## [Unreleased]\n\n## [0.14.0] - 2026-10-30\n\n### Cambios\n\n- feat: bump\n`;
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.14.0" }, null, 2) + "\n");
  writeFileSync(join(dir, "CHANGELOG.md"), changelog);
  const cwd = process.cwd();
  process.chdir(dir);
  const prev = process.argv;
  process.argv = [prev[0], prev[1]];
  try {
    const first = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      writeFile: (p, data) => writeFileSync(join(dir, String(p)), data),
      env: { GITHUB_SHA: "sha1" },
    });
    assert.equal(first.action, "publish");
    assert.ok(tags.has("v0.14.0"));
    assert.ok(releases.has("v0.14.0"));

    const second = planRelease({
      bump: "minor",
      latestTag: "v0.13.0",
      packageVersion: "0.14.0",
      tagExists: true,
      version: "0.14.0",
    });
    assert.equal(second.action, "skip");
  } finally {
    process.argv = prev;
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planRelease: main avanzó con bump pendiente sigue en open-pr (sin push a main)", () => {
  const plan = planRelease({
    bump: "patch",
    latestTag: "v0.13.0",
    packageVersion: "0.13.0",
    tagExists: false,
    version: "0.13.1",
  });
  assert.equal(plan.action, "open-pr");
  assert.doesNotMatch(plan.reason, /HEAD:main|refs\/heads\/main/);
});

test("planRelease: tag existe pero package.json aún no coincide → skip (no republish)", () => {
  const plan = planRelease({
    bump: "minor",
    latestTag: "v0.13.0",
    packageVersion: "0.13.0",
    tagExists: true,
    version: "0.14.0",
  });
  assert.equal(plan.action, "skip");
  assert.match(plan.reason, /ya existe/);
});
