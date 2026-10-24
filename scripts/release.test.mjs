import assert from "node:assert/strict";
import test from "node:test";
import { buildChangelog, detectBump, nextVersion, planRelease } from "./release.mjs";

test("nextVersion aplica major/minor/patch", () => {
  assert.equal(nextVersion("1.2.3", "major"), "2.0.0");
  assert.equal(nextVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(nextVersion("1.2.3", "patch"), "1.2.4");
});

test("detectBump prioriza breaking > feat > fix", () => {
  assert.equal(detectBump("fix: a\n----END----\n"), "patch");
  assert.equal(detectBump("feat: a\n----END----\nfix: b\n----END----\n"), "minor");
  assert.equal(detectBump("feat!: a\n----END----\nfeat: b\n----END----\n"), "major");
  assert.equal(detectBump("chore: a\n----END----\ndocs: b\n----END----\n"), null);
});

test("planRelease: skip sin bump releasable", () => {
  const plan = planRelease({
    bump: null,
    latestTag: "v0.12.0",
    packageVersion: "0.12.0",
    tagExists: false,
    version: "0.12.0",
  });
  assert.equal(plan.action, "skip");
  assert.match(plan.reason, /sin cambios releasables/);
});

test("planRelease: open-pr cuando package.json aún no tiene la versión", () => {
  const plan = planRelease({
    bump: "minor",
    latestTag: "v0.12.0",
    packageVersion: "0.12.0",
    tagExists: false,
    version: "0.13.0",
  });
  assert.equal(plan.action, "open-pr");
  assert.match(plan.reason, /chore\/release-v0\.13\.0/);
  assert.doesNotMatch(plan.reason, /HEAD:main|refs\/heads\/main/);
});

test("planRelease: publish cuando package.json ya es la versión y el tag no existe", () => {
  const plan = planRelease({
    bump: "minor",
    latestTag: "v0.12.0",
    packageVersion: "0.13.0",
    tagExists: false,
    version: "0.13.0",
  });
  assert.equal(plan.action, "publish");
  assert.doesNotMatch(plan.reason, /HEAD:main|refs\/heads\/main/);
});

test("planRelease: skip idempotente si el tag ya existe y package.json coincide", () => {
  const plan = planRelease({
    bump: "minor",
    latestTag: "v0.12.0",
    packageVersion: "0.13.0",
    tagExists: true,
    version: "0.13.0",
  });
  assert.equal(plan.action, "skip");
  assert.match(plan.reason, /ya está publicada/);
});

test("planRelease nunca describe push a main", () => {
  const cases = [
    {
      bump: "patch",
      latestTag: "v1.0.0",
      packageVersion: "1.0.0",
      tagExists: false,
      version: "1.0.1",
    },
    {
      bump: "patch",
      latestTag: "v1.0.0",
      packageVersion: "1.0.1",
      tagExists: false,
      version: "1.0.1",
    },
    {
      bump: null,
      latestTag: "v1.0.0",
      packageVersion: "1.0.0",
      tagExists: false,
      version: "1.0.0",
    },
  ];
  for (const input of cases) {
    const plan = planRelease(input);
    assert.doesNotMatch(JSON.stringify(plan), /HEAD:main|refs\/heads\/main/);
  }
});

test("buildChangelog inserta sección tras Unreleased", () => {
  const src = `# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-01-01\n\n### Cambios\n\n- old\n`;
  const { section, updated } = buildChangelog(src, "0.2.0", "2026-10-25", "### Cambios\n\n- nuevo");
  assert.match(section, /## \[0\.2\.0\] - 2026-10-25/);
  assert.match(updated, /## \[Unreleased\]\n\n## \[0\.2\.0\]/);
  assert.match(updated, /## \[0\.1\.0\]/);
});
