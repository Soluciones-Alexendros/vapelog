import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  evaluateLockfileAdvisories,
  isInVulnerableRange,
  resolvedVersions,
} from "./supply-chain-audit.mjs";
import { scanSecrets } from "./secret-scan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_LOCK = join(ROOT, "scripts/fixtures/lockfile-ghsa-qx66-vulnerable.txt");
const FIXTURE_SECRET = join(ROOT, "scripts/fixtures/secrets-synthetic.txt");

test("VAL-005-01: fixture con start-server-core vulnerable falla el evaluador", () => {
  const text = readFileSync(FIXTURE_LOCK, "utf8");
  const versions = resolvedVersions(text, "@tanstack/start-server-core");
  assert.ok(versions.includes("1.169.20"));
  assert.equal(
    isInVulnerableRange("1.169.20", {
      vulnerableFrom: "1.143.12",
      vulnerableToExclusive: "1.169.39",
    }),
    true,
  );
  const { ok, hits } = evaluateLockfileAdvisories(text);
  assert.equal(ok, false);
  assert.ok(hits.some((h) => h.package === "@tanstack/start-server-core"));
});

test("VAL-005-01: lockfile real de v0.12.0 no incluye el rango vulnerable", () => {
  const text = readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf8");
  const { ok, hits } = evaluateLockfileAdvisories(text);
  assert.equal(ok, true, `hits inesperados: ${JSON.stringify(hits)}`);
  const cores = resolvedVersions(text, "@tanstack/start-server-core");
  assert.ok(
    cores.every(
      (v) =>
        !isInVulnerableRange(v, {
          vulnerableFrom: "1.143.12",
          vulnerableToExclusive: "1.169.39",
        }),
    ),
  );
});

test("VAL-005-02: fixture con credencial sintética es detectada", () => {
  const text = readFileSync(FIXTURE_SECRET, "utf8");
  const { ok, findings } = scanSecrets(text);
  assert.equal(ok, false);
  assert.ok(findings.some((f) => f.id === "aws-access-key-id"));
  assert.ok(findings.some((f) => f.id === "generic-api-token"));
});

test("VAL-005-02: texto limpio no dispara hallazgos", () => {
  const { ok, findings } = scanSecrets("sin secretos aquí\n");
  assert.equal(ok, true);
  assert.deepEqual(findings, []);
});
