#!/usr/bin/env node
// Autorelease: semver desde Conventional Commits + CHANGELOG + tag + GitHub Release.
// Decisiones:
// - feat! / BREAKING CHANGE → major; feat → minor; fix → patch; el resto no releasea.
// - Sin tag previo, parte del `version` de package.json (0.0.0 → 0.1.0 en minor).
// - Mueve el cuerpo de `## [Unreleased]` a la nueva versión (Keep a Changelog);
//   si está vacío, sintetiza una sección «Cambios» con los asuntos de los commits.
// - No hace push a main: el bump entra por PR (chore/release-vX.Y.Z); el tag se
//   publica solo cuando package.json ya tiene esa versión en main.
// - `--dry-run` calcula y muestra todo sin escribir ni publicar nada.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CHANGELOG = "CHANGELOG.md";
const UNRELEASED = "## [Unreleased]";

function isDryRun() {
  return process.argv.includes("--dry-run");
}

/**
 * @param {string} cmd
 * @param {string[]} args
 */
function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

/**
 * @param {{ run?: typeof run }} [deps]
 */
export function latestTag(deps = {}) {
  const exec = deps.run ?? run;
  try {
    return exec("git", ["describe", "--tags", "--abbrev=0"]);
  } catch {
    return null;
  }
}

/**
 * @param {string} base
 * @param {"major" | "minor" | "patch"} bump
 */
export function nextVersion(base, bump) {
  const [major, minor, patch] = base.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * @param {string} log
 * @returns {"major" | "minor" | "patch" | null}
 */
export function detectBump(log) {
  const commits = log
    .split("----END----")
    .map((block) => block.trim())
    .filter(Boolean);

  /** @type {"major" | "minor" | "patch" | null} */
  let bump = null;
  for (const block of commits) {
    const subject = block.split("\n", 1)[0];
    if (/BREAKING CHANGE/.test(block) || /^[a-zA-Z]+(\([^)]*\))?!:/.test(subject)) {
      bump = "major";
    } else if (/^feat(\([^)]*\))?:/.test(subject) && bump !== "major") {
      bump = "minor";
    } else if (/^fix(\([^)]*\))?:/.test(subject) && bump !== "major" && bump !== "minor") {
      bump = "patch";
    }
  }
  return bump;
}

/**
 * @param {string} changelog
 * @param {string} version
 * @param {string} date
 * @param {string} notes
 */
export function buildChangelog(changelog, version, date, notes) {
  const start = changelog.indexOf(UNRELEASED);
  if (start < 0) throw new Error(`no se encuentra "${UNRELEASED}" en ${CHANGELOG}`);
  const bodyStart = start + UNRELEASED.length;
  const nextHeading = changelog.indexOf("\n## [", bodyStart);
  const end = nextHeading === -1 ? changelog.length : nextHeading;
  const section = `## [${version}] - ${date}\n\n${notes}\n`;
  const updated =
    changelog.slice(0, start) +
    UNRELEASED +
    "\n\n" +
    section +
    "\n" +
    changelog.slice(end).trimStart();
  return { section, updated };
}

/**
 * @param {string} message
 */
function isGhReleaseNotFound(message) {
  return /not found|release not found|http 404/i.test(message);
}

/**
 * @param {typeof run} exec
 * @param {string} tag
 * @returns {{ status: "present" } | { status: "absent" } | { status: "error"; message: string }}
 */
export function queryGitHubRelease(exec, tag) {
  try {
    exec("gh", ["release", "view", tag, "--json", "tagName"]);
    return { status: "present" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isGhReleaseNotFound(message)) return { status: "absent" };
    return { status: "error", message };
  }
}

/**
 * @param {typeof run} exec
 * @param {string} tag
 * @returns {string | null}
 */
export function getTagCommitSha(exec, tag) {
  try {
    return exec("git", ["rev-parse", `${tag}^{commit}`]);
  } catch {
    return null;
  }
}

/**
 * Reconcilia tag y GitHub Release para la versión ya declarada en package.json.
 * Debe ejecutarse antes de cualquier skip por falta de commits releasables.
 *
 * @param {{
 *   packageVersion: string;
 *   tagExists: boolean;
 *   tagCommitSha: string | null;
 *   githubRelease: ReturnType<typeof queryGitHubRelease>;
 *   testedSha: string;
 *   publishCandidate?: boolean;
 * }} input
 * @returns {{
 *   action: "none" | "noop" | "create-release" | "error" | "retryable-error";
 *   reason: string;
 *   tag?: string;
 * }}
 */
export function reconcilePublishedVersion(input) {
  const tag = `v${input.packageVersion}`;

  if (!input.tagExists) {
    return { action: "none", reason: `sin tag local ${tag}` };
  }

  if (input.githubRelease.status === "error") {
    return {
      action: "retryable-error",
      reason: `no se pudo leer GitHub Release de ${tag}: ${input.githubRelease.message}`,
    };
  }

  if (
    input.publishCandidate &&
    input.tagCommitSha &&
    input.testedSha &&
    input.testedSha !== "unknown" &&
    input.tagCommitSha !== input.testedSha
  ) {
    return {
      action: "error",
      reason: `tag ${tag} apunta a ${input.tagCommitSha}; candidato autorizado ${input.testedSha} (el tag no se mueve)`,
      tag,
    };
  }

  if (input.githubRelease.status === "present") {
    return {
      action: "noop",
      reason: `v${input.packageVersion} coherente (package.json, tag y GitHub Release)`,
      tag,
    };
  }

  return {
    action: "create-release",
    reason: `tag ${tag} presente sin GitHub Release; crear release sin mover el tag`,
    tag,
  };
}

/**
 * @param {typeof run} exec
 * @param {string} packageVersion
 * @param {string} testedSha
 * @param {boolean} [publishCandidate]
 */
export function gatherReconcileState(exec, packageVersion, testedSha, publishCandidate = false) {
  const tag = `v${packageVersion}`;
  const tagExists = Boolean(exec("git", ["tag", "--list", tag]));
  const tagCommitSha = tagExists ? getTagCommitSha(exec, tag) : null;
  const githubRelease = tagExists ? queryGitHubRelease(exec, tag) : { status: "absent" };
  return reconcilePublishedVersion({
    packageVersion,
    tagExists,
    tagCommitSha,
    githubRelease,
    testedSha,
    publishCandidate,
  });
}

/**
 * @param {string} changelog
 * @param {string} version
 */
export function changelogSectionForVersion(changelog, version) {
  const heading = `## [${version}]`;
  const headingAt = changelog.indexOf(heading);
  if (headingAt < 0) return null;
  const bodyStart = changelog.indexOf("\n", headingAt);
  const nextHeading = changelog.indexOf("\n## [", bodyStart);
  const end = nextHeading === -1 ? changelog.length : nextHeading;
  return changelog.slice(bodyStart, end).trim();
}

/**
 * @param {typeof run} exec
 * @param {string} tag
 * @param {string} notes
 * @param {string} testedSha
 */
function createGitHubRelease(exec, tag, notes, testedSha) {
  const releaseNotes = `${notes}\n\n---\nTested-SHA: ${testedSha}\n`;
  exec("gh", ["release", "create", tag, "--title", tag, "--notes", releaseNotes]);
}

/**
 * Plan puro: no ejecuta git ni escribe ficheros.
 *
 * @param {{
 *   bump: "major" | "minor" | "patch" | null;
 *   latestTag: string | null;
 *   packageVersion: string;
 *   tagExists: boolean;
 *   version: string;
 *   releaseCoherent?: boolean;
 * }} input
 * @returns {{ action: "skip" | "open-pr" | "publish"; reason: string }}
 */
export function planRelease(input) {
  if (!input.bump) {
    return {
      action: "skip",
      reason: `sin cambios releasables desde ${input.latestTag ?? "el inicio"}`,
    };
  }
  if (input.packageVersion === input.version) {
    if (input.tagExists && input.releaseCoherent) {
      return {
        action: "skip",
        reason: `v${input.version} ya está publicada (package.json, tag y release)`,
      };
    }
    return {
      action: "publish",
      reason: `package.json ya es ${input.version}; publicar tag y GitHub Release`,
    };
  }
  if (input.tagExists) {
    return {
      action: "skip",
      reason: `el tag v${input.version} ya existe y package.json es ${input.packageVersion}`,
    };
  }
  return {
    action: "open-pr",
    reason: `abrir PR chore/release-v${input.version} (package.json ${input.packageVersion} → ${input.version})`,
  };
}

/**
 * @param {string} version
 */
function releaseBranch(version) {
  return `chore/release-v${version}`;
}

/**
 * @param {string} version
 * @param {{ run?: typeof run }} [deps]
 */
function ensureReleasePr(version, deps = {}) {
  const exec = deps.run ?? run;
  const branch = releaseBranch(version);
  const title = `chore(release): v${version}`;
  /** @type {string} */
  let existing;
  try {
    existing = exec("gh", [
      "pr",
      "list",
      "--head",
      branch,
      "--base",
      "main",
      "--state",
      "open",
      "--json",
      "url",
      "--jq",
      ".[0].url // empty",
    ]);
  } catch {
    existing = "";
  }
  if (existing) {
    console.log(`PR de release ya abierto: ${existing}`);
    return existing;
  }
  const body = [
    `## Summary`,
    `- Bump a v${version} (CHANGELOG + package.json).`,
    `- Generado por el job \`release\` sin push directo a \`main\` (ADR-0015).`,
    ``,
    `## Test plan`,
    `- [ ] CI verde en este PR (incluye \`release-ready\`).`,
    `- [ ] Tras el merge con token de usuario: tag \`v${version}\` y GitHub Release.`,
    ``,
    `## Alejandro`,
    `- No hace falta cambiar protección de ramas, Vercel ni DNS.`,
  ].join("\n");
  return exec("gh", [
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body,
  ]);
}

/**
 * @param {{ run?: typeof run; readFile?: typeof readFileSync; writeFile?: typeof writeFileSync; now?: () => Date; env?: NodeJS.ProcessEnv }} [deps]
 */
export function main(deps = {}) {
  const exec = deps.run ?? run;
  const read = deps.readFile ?? readFileSync;
  const write = deps.writeFile ?? writeFileSync;
  const env = deps.env ?? process.env;
  const now = deps.now ?? (() => new Date());

  const tag = latestTag({ run: exec });
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const log = exec("git", ["log", range, "--pretty=format:%s%n%b%n----END----%n"]);
  const bump = detectBump(log);
  const commits = log
    .split("----END----")
    .map((block) => block.trim())
    .filter(Boolean);

  const pkg = JSON.parse(read("package.json", "utf8"));
  const base = tag ? tag.replace(/^v/, "") : pkg.version;
  const version = bump ? nextVersion(base, bump) : pkg.version;
  const targetTagExists = Boolean(exec("git", ["tag", "--list", `v${version}`]));

  const testedSha =
    env.GITHUB_SHA ||
    (() => {
      try {
        return exec("git", ["rev-parse", "HEAD"]);
      } catch {
        return "unknown";
      }
    })();

  const publishCandidate = pkg.version === version && targetTagExists && Boolean(bump);
  const reconcile = gatherReconcileState(exec, pkg.version, testedSha, publishCandidate);

  if (reconcile.action === "retryable-error") {
    console.error(`reconcile: ${reconcile.reason}`);
    process.exitCode = 2;
    return { action: "retryable-error", reason: reconcile.reason };
  }
  if (reconcile.action === "error") {
    console.error(`reconcile: ${reconcile.reason}`);
    process.exitCode = 1;
    return { action: "error", reason: reconcile.reason };
  }

  const releaseCoherentForTarget =
    version === pkg.version &&
    targetTagExists &&
    queryGitHubRelease(exec, `v${version}`).status === "present";

  let plan = planRelease({
    bump,
    latestTag: tag,
    packageVersion: pkg.version,
    tagExists: targetTagExists,
    version,
    releaseCoherent: releaseCoherentForTarget,
  });

  console.log(
    bump
      ? `release: ${tag ?? "(sin tag)"} → v${version} (${bump}) con ${commits.length} commits`
      : `release: sin bump (${reconcile.action})`,
  );
  console.log(`reconcile: ${reconcile.action} — ${reconcile.reason}`);
  console.log(`plan: ${plan.action} — ${plan.reason}`);

  if (reconcile.action === "create-release") {
    const relTag = reconcile.tag ?? `v${pkg.version}`;
    const changelog = read(CHANGELOG, "utf8");
    const section =
      changelogSectionForVersion(changelog, pkg.version) ??
      `### Cambios\n\n- Release reconciliado para ${relTag}`;
    if (isDryRun()) {
      console.log("--- dry-run: reconciliar GitHub Release ---");
      console.log(section);
      process.exitCode = 0;
      return { action: "reconcile-release", reason: reconcile.reason };
    }
    try {
      createGitHubRelease(exec, relTag, section, testedSha);
      console.log(
        `reconciliado ${relTag} (solo GitHub Release; tag sin mover; Tested-SHA=${testedSha})`,
      );
    } catch (err) {
      const again = queryGitHubRelease(exec, relTag);
      if (again.status === "present") {
        console.log(`reconciliado ${relTag} (release ya existía tras reintento)`);
        process.exitCode = 0;
        return { action: "reconcile-release", reason: reconcile.reason };
      }
      throw err;
    }
    if (!bump) {
      process.exitCode = 0;
      return { action: "reconcile-release", reason: reconcile.reason };
    }
    if (
      version === pkg.version &&
      targetTagExists &&
      queryGitHubRelease(exec, `v${version}`).status === "present" &&
      plan.action === "publish"
    ) {
      plan = {
        action: "skip",
        reason: `v${version} ya publicada tras reconciliar GitHub Release`,
      };
      console.log(`plan: ${plan.action} — ${plan.reason}`);
    }
  }

  if (plan.action === "skip") {
    process.exitCode = 0;
    return plan;
  }

  const changelog = read(CHANGELOG, "utf8");
  const subjects = commits.map((block) => block.split("\n", 1)[0]);
  const date = now().toISOString().slice(0, 10);

  if (plan.action === "open-pr") {
    const start = changelog.indexOf(UNRELEASED);
    if (start < 0) throw new Error(`no se encuentra "${UNRELEASED}" en ${CHANGELOG}`);
    const bodyStart = start + UNRELEASED.length;
    const nextHeading = changelog.indexOf("\n## [", bodyStart);
    const end = nextHeading === -1 ? changelog.length : nextHeading;
    const body = changelog.slice(bodyStart, end).trim();
    const notes = body.length
      ? body
      : ["### Cambios", "", ...subjects.map((subject) => `- ${subject}`)].join("\n");
    const { section, updated } = buildChangelog(changelog, version, date, notes);

    if (isDryRun()) {
      console.log("--- dry-run: vista previa de la sección del CHANGELOG ---");
      console.log(section);
      process.exitCode = 0;
      return plan;
    }

    const branch = releaseBranch(version);
    exec("git", ["checkout", "-B", branch]);
    pkg.version = version;
    write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
    write(CHANGELOG, updated);
    exec("git", ["add", CHANGELOG, "package.json"]);
    exec("git", ["commit", "-m", `chore(release): v${version}`]);
    // Solo force-with-lease en la rama de release (rehacer changelog si main avanzó).
    exec("git", ["push", "--force-with-lease", "origin", `HEAD:${branch}`]);
    const prUrl = ensureReleasePr(version, { run: exec });
    console.log(
      `abierto bump v${version} en ${branch} (sin push a main; Tested-SHA=${testedSha})${prUrl ? `\n${prUrl}` : ""}`,
    );
    process.exitCode = 0;
    return plan;
  }

  // publish: package.json ya tiene la versión; notas desde la sección del CHANGELOG.
  const heading = `## [${version}]`;
  const headingAt = changelog.indexOf(heading);
  let notes;
  if (headingAt >= 0) {
    const bodyStart = changelog.indexOf("\n", headingAt);
    const nextHeading = changelog.indexOf("\n## [", bodyStart);
    const end = nextHeading === -1 ? changelog.length : nextHeading;
    notes = changelog.slice(bodyStart, end).trim();
  } else {
    notes = ["### Cambios", "", ...subjects.map((subject) => `- ${subject}`)].join("\n");
  }

  if (isDryRun()) {
    console.log("--- dry-run: notas de GitHub Release ---");
    console.log(notes);
    process.exitCode = 0;
    return plan;
  }

  const publishTag = `v${version}`;
  const tagSha = getTagCommitSha(exec, publishTag);
  if (tagSha && testedSha !== "unknown" && tagSha !== testedSha) {
    const msg = `tag ${publishTag} apunta a ${tagSha}; candidato autorizado ${testedSha} (el tag no se mueve)`;
    console.error(msg);
    process.exitCode = 1;
    return { action: "error", reason: msg };
  }

  if (!tagSha) {
    exec("git", ["tag", publishTag]);
    exec("git", ["push", "origin", publishTag]);
  }

  const gh = queryGitHubRelease(exec, publishTag);
  if (gh.status === "error") {
    console.error(`no se pudo leer GitHub Release de ${publishTag}: ${gh.message}`);
    process.exitCode = 2;
    return { action: "retryable-error", reason: gh.message };
  }
  if (gh.status === "absent") {
    try {
      createGitHubRelease(exec, publishTag, notes, testedSha);
    } catch {
      const retry = queryGitHubRelease(exec, publishTag);
      if (retry.status !== "present") throw new Error(`fallo al crear release ${publishTag}`);
    }
  }
  console.log(`publicado v${version} (tag y GitHub Release; Tested-SHA=${testedSha})`);
  process.exitCode = 0;
  return plan;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("release.mjs") || process.argv[1].endsWith("/release.mjs"));

if (isDirect) {
  main();
}
