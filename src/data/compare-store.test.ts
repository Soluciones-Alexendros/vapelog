import assert from "node:assert/strict";
import { test } from "node:test";
import type { Domain } from "./types.ts";
import { parseCompareJson, sanitizeCompare, shouldPersistCompare } from "../lib/compare-store.ts";

const catalog = new Set([
  "device:xros-4",
  "device:aegis-legend-2",
  "coil:z-0-2",
  "liquid:heisenberg",
]);

function exists(domain: Domain, slug: string): boolean {
  return catalog.has(`${domain}:${slug}`);
}

test("sanitizeCompare: vacío e ilegible", () => {
  assert.deepEqual(sanitizeCompare(null, exists), []);
  assert.deepEqual(sanitizeCompare("x", exists), []);
  assert.deepEqual(sanitizeCompare({}, exists), []);
  assert.deepEqual(sanitizeCompare([], exists), []);
});

test("sanitizeCompare: descarta duplicados y slugs ausentes", () => {
  assert.deepEqual(
    sanitizeCompare(
      [
        { domain: "device", slug: "xros-4" },
        { domain: "device", slug: "xros-4" },
        { domain: "device", slug: "fantasma" },
        { domain: "device", slug: "aegis-legend-2" },
      ],
      exists,
    ),
    [
      { domain: "device", slug: "xros-4" },
      { domain: "device", slug: "aegis-legend-2" },
    ],
  );
});

test("sanitizeCompare: un solo dominio, el del primer elemento válido", () => {
  assert.deepEqual(
    sanitizeCompare(
      [
        { domain: "device", slug: "fantasma" },
        { domain: "coil", slug: "z-0-2" },
        { domain: "device", slug: "xros-4" },
        { domain: "liquid", slug: "heisenberg" },
      ],
      exists,
    ),
    [{ domain: "coil", slug: "z-0-2" }],
  );
});

test("sanitizeCompare: tope de cuatro", () => {
  const many = [
    { domain: "device", slug: "xros-4" },
    { domain: "device", slug: "aegis-legend-2" },
    { domain: "device", slug: "a" },
    { domain: "device", slug: "b" },
    { domain: "device", slug: "c" },
  ];
  const withExtras = new Set([...catalog, "device:a", "device:b", "device:c"]);
  const result = sanitizeCompare(many, (domain, slug) => withExtras.has(`${domain}:${slug}`));
  assert.equal(result.length, 4);
  assert.deepEqual(
    result.map((item) => item.slug),
    ["xros-4", "aegis-legend-2", "a", "b"],
  );
});

test("parseCompareJson tolera JSON inválido", () => {
  assert.deepEqual(parseCompareJson("{", exists), []);
  assert.deepEqual(
    parseCompareJson(JSON.stringify([{ domain: "device", slug: "xros-4" }]), exists),
    [{ domain: "device", slug: "xros-4" }],
  );
});

test("shouldPersistCompare solo tras hidratar", () => {
  assert.equal(shouldPersistCompare(false), false);
  assert.equal(shouldPersistCompare(true), true);
});
