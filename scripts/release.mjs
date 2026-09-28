#!/usr/bin/env node
// Autorelease: semver desde Conventional Commits + CHANGELOG + tag + GitHub Release.
// Decisiones:
// - feat! / BREAKING CHANGE → major; feat → minor; fix → patch; el resto no releasea.
// - Sin tag previo, parte del `version` de package.json (0.0.0 → 0.1.0 en minor).
// - Mueve el cuerpo de `## [Unreleased]` a la nueva versión (Keep a Changelog);
//   si está vacío, sintetiza una sección «Cambios» con los asuntos de los commits.
// - `--dry-run` calcula y muestra todo sin escribir ni publicar nada.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const CHANGELOG = "CHANGELOG.md";
const UNRELEASED = "## [Unreleased]";

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

function latestTag() {
  try {
    return run("git", ["describe", "--tags", "--abbrev=0"]);
  } catch {
    return null;
  }
}

function nextVersion(base, bump) {
  const [major, minor, patch] = base.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const tag = latestTag();
const range = tag ? `${tag}..HEAD` : "HEAD";
const log = run("git", ["log", range, "--pretty=format:%s%n%b%n----END----%n"]);
const commits = log
  .split("----END----")
  .map((block) => block.trim())
  .filter(Boolean);

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

if (!bump) {
  console.log(`sin cambios releasables desde ${tag ?? "el inicio"}; no se publica versión`);
  process.exit(0);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const base = tag ? tag.replace(/^v/, "") : pkg.version;
const version = nextVersion(base, bump);
const date = new Date().toISOString().slice(0, 10);

const changelog = readFileSync(CHANGELOG, "utf8");
const start = changelog.indexOf(UNRELEASED);
if (start < 0) throw new Error(`no se encuentra "${UNRELEASED}" en ${CHANGELOG}`);
const bodyStart = start + UNRELEASED.length;
const nextHeading = changelog.indexOf("\n## [", bodyStart);
const end = nextHeading === -1 ? changelog.length : nextHeading;
const body = changelog.slice(bodyStart, end).trim();

const subjects = commits.map((block) => block.split("\n", 1)[0]);
const notes = body.length
  ? body
  : ["### Cambios", "", ...subjects.map((subject) => `- ${subject}`)].join("\n");

const section = `## [${version}] - ${date}\n\n${notes}\n`;
const updated =
  changelog.slice(0, start) + UNRELEASED + "\n\n" + section + changelog.slice(end).trimStart();

console.log(`release: ${tag ?? "(sin tag)"} → v${version} (${bump}) con ${commits.length} commits`);

if (dryRun) {
  console.log("--- dry-run: vista previa de la sección del CHANGELOG ---");
  console.log(section);
  process.exit(0);
}

if (run("git", ["tag", "--list", `v${version}`])) {
  throw new Error(`el tag v${version} ya existe`);
}

pkg.version = version;
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync(CHANGELOG, updated);

run("git", ["add", CHANGELOG, "package.json"]);
run("git", ["commit", "-m", `chore(release): v${version}`]);
run("git", ["tag", `v${version}`]);
run("git", ["push", "origin", "HEAD:main"]);
run("git", ["push", "origin", `v${version}`]);
run("gh", ["release", "create", `v${version}`, "--title", `v${version}`, "--notes", notes]);
console.log(`publicado v${version} (commit, tag y GitHub Release)`);
