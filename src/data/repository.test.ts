import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileCatalogRepository, normalizeListLimit } from "./repository.ts";

describe("fileCatalogRepository", () => {
  it("lista líquidos con límite", () => {
    const rows = fileCatalogRepository.list("liquid", {}, 5);
    assert.equal(rows.length, 5);
    assert.ok(rows.every((row) => row.domain === "liquid" && row.brandName.length > 0));
  });

  it("VAL-016-01: ordena por nombre antes de paginar", () => {
    const page = fileCatalogRepository.listPage("device", { orden: "nombre" }, 10);
    assert.ok(page.items.length > 1);
    const names = page.items.map((row) => row.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "es"));
    assert.deepEqual(names, sorted);
    assert.ok(page.total >= page.items.length);
  });

  it("VAL-016-02: limit inválido se rechaza", () => {
    assert.throws(() => normalizeListLimit(Number.NaN), /entero finito/);
    assert.throws(() => normalizeListLimit(-1), /rango/);
    assert.throws(() => normalizeListLimit(1.5), /entero finito/);
    assert.throws(() => fileCatalogRepository.list("liquid", {}, Number.POSITIVE_INFINITY));
  });

  it("VAL-016-03: mutar índices devueltos no altera consultas posteriores", () => {
    const first = fileCatalogRepository.indexes();
    first.byId.clear();
    first.byPlatform.clear();
    const second = fileCatalogRepository.indexes();
    assert.ok(second.byId.size > 0);
    assert.ok(second.byPlatform.size > 0);
  });

  it("ficha por slug incluye marca y copia aislada", () => {
    const sheet = fileCatalogRepository.getBySlug("liquid", "herrera-abarra-freebase");
    assert.ok(sheet);
    assert.match(sheet!.brandName, /Herrera/i);
    if (sheet!.item.domain === "liquid") {
      sheet!.item.name = "MUTATED";
    }
    const again = fileCatalogRepository.getBySlug("liquid", "herrera-abarra-freebase");
    assert.notEqual(again!.item.name, "MUTATED");
  });

  it("evalúa compatibilidad por slugs", () => {
    const dto = fileCatalogRepository.evaluate("vaporesso-xros-4", "xros-corex-0-8");
    assert.ok(dto);
    assert.equal(dto!.evaluation.legacyKind, "nativa");
  });
});
