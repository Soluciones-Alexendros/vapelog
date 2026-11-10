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
      "git tag --list v0.13.0": "",
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
    if (cmd === "git" && args[0] === "rev-parse") {
      if (String(args[1]).includes("v0.14.0") && !tags.has("v0.14.0")) {
        throw new Error(`unknown revision ${args[1]}`);
      }
      return "sha1";
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      if (releases.has(args[2])) return '{"tagName":"v0.14.0"}';
      throw new Error("HTTP 404");
    }
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
      releaseCoherent: true,
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

test("reconcile sin bump: tag presente y release ausente crea gh sin mover tag", () => {
  const tags = new Set(["v0.14.0"]);
  const releases = new Set();
  /** @type {string[][]} */
  const calls = [];
  const run = (cmd, args) => {
    calls.push([cmd, ...args]);
    if (cmd === "git" && args[0] === "describe") return "v0.14.0";
    if (cmd === "git" && args[0] === "log") return "chore: nada\n\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") {
      return tags.has(args[2]) ? args[2] : "";
    }
    if (cmd === "git" && args[0] === "rev-parse") {
      if (args[1] === "HEAD") return "newmainsha";
      if (String(args[1]).includes("v0.14.0")) return "oldtags";
      return "newmainsha";
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      if (releases.has(args[2])) return '{"tagName":"v0.14.0"}';
      throw new Error("HTTP 404");
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "create") {
      releases.add(args[2]);
      return `https://example.test/${args[2]}`;
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };

  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.14.0" }, null, 2) + "\n");
  writeFileSync(
    join(dir, "CHANGELOG.md"),
    `# Changelog\n\n## [Unreleased]\n\n## [0.14.0] - 2026-10-30\n\n### Cambios\n\n- fix\n`,
  );
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const result = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      writeFile: () => {
        throw new Error("no debe escribir");
      },
      env: { GITHUB_SHA: "newmainsha" },
    });
    assert.equal(result.action, "reconcile-release");
    assert.ok(releases.has("v0.14.0"));
    assert.ok(!calls.some((c) => c[0] === "git" && c.includes("push")));
    assert.ok(!calls.some((c) => c[0] === "git" && c[2] === "v0.14.0" && c[1] === "tag"));
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fallo lectura GitHub no se interpreta como release ausente", () => {
  const run = (cmd, args) => {
    if (cmd === "git" && args[0] === "describe") return "v0.14.0";
    if (cmd === "git" && args[0] === "log") return "\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") return "v0.14.0";
    if (cmd === "git" && args[0] === "rev-parse") return "sha1";
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      throw new Error("connection reset by peer");
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.14.0" }, null, 2) + "\n");
  writeFileSync(join(dir, "CHANGELOG.md"), `# Changelog\n\n## [Unreleased]\n\n`);
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const result = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      env: { GITHUB_SHA: "sha1" },
    });
    assert.equal(result.action, "retryable-error");
    assert.equal(process.exitCode, 2);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("dry-run reconciliación no llama gh create", () => {
  const prev = process.argv;
  process.argv = [prev[0], prev[1], "--dry-run"];
  const run = (cmd, args) => {
    if (cmd === "git" && args[0] === "describe") return "v0.14.0";
    if (cmd === "git" && args[0] === "log") return "\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") return "v0.14.0";
    if (cmd === "git" && args[0] === "rev-parse") return "sha1";
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      throw new Error("HTTP 404");
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "create") {
      throw new Error("dry-run no debe crear release");
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.14.0" }, null, 2) + "\n");
  writeFileSync(
    join(dir, "CHANGELOG.md"),
    `# Changelog\n\n## [Unreleased]\n\n## [0.14.0] - 2026-10-30\n\n- x\n`,
  );
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const result = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      env: { GITHUB_SHA: "sha1" },
    });
    assert.equal(result.action, "reconcile-release");
  } finally {
    process.argv = prev;
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publish: tag en otro commit aborta sin mover tag", () => {
  const run = (cmd, args) => {
    if (cmd === "git" && args[0] === "describe") return "v0.14.0";
    if (cmd === "git" && args[0] === "log") return "feat: x\n\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") {
      return args[2] === "v0.15.0" ? "v0.15.0" : "";
    }
    if (cmd === "git" && args[0] === "rev-parse") {
      if (String(args[1]).includes("v0.15.0")) return "oldtagsha";
      return "newcandidatesha";
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      throw new Error("HTTP 404");
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.15.0" }, null, 2) + "\n");
  writeFileSync(
    join(dir, "CHANGELOG.md"),
    `# Changelog\n\n## [Unreleased]\n\n## [0.15.0] - 2026-10-30\n\n### Cambios\n\n- fix\n`,
  );
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const result = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      env: { GITHUB_SHA: "newcandidatesha" },
    });
    assert.equal(result.action, "error");
    assert.equal(process.exitCode, 1);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reconcile idempotente: fallo create seguido de release presente", () => {
  const releases = new Set();
  let viewAfterCreate = false;
  let createAttempts = 0;
  const run = (cmd, args) => {
    if (cmd === "git" && args[0] === "describe") return "v0.14.0";
    if (cmd === "git" && args[0] === "log") return "\n----END----\n";
    if (cmd === "git" && args[0] === "tag" && args[1] === "--list") return "v0.14.0";
    if (cmd === "git" && args[0] === "rev-parse") return "sha1";
    if (cmd === "gh" && args[0] === "release" && args[1] === "view") {
      if (releases.has(args[2]) || viewAfterCreate) return '{"tagName":"v0.14.0"}';
      throw new Error("HTTP 404");
    }
    if (cmd === "gh" && args[0] === "release" && args[1] === "create") {
      createAttempts += 1;
      viewAfterCreate = true;
      throw new Error("timeout after partial create");
    }
    throw new Error(`unexpected ${cmd} ${args.join(" ")}`);
  };
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: "0.14.0" }, null, 2) + "\n");
  writeFileSync(
    join(dir, "CHANGELOG.md"),
    `# Changelog\n\n## [Unreleased]\n\n## [0.14.0] - 2026-10-30\n\n- x\n`,
  );
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const result = main({
      run,
      readFile: (p, enc) => readFileSync(join(dir, String(p)), /** @type {BufferEncoding} */ (enc)),
      env: { GITHUB_SHA: "sha1" },
    });
    assert.equal(result.action, "reconcile-release");
    assert.equal(createAttempts, 1);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  }
});
