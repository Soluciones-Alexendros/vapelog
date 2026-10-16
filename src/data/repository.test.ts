import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileCatalogRepository } from "./repository.ts";

describe("fileCatalogRepository", () => {
  it("lista líquidos con límite", () => {
    const rows = fileCatalogRepository.list("liquid", {}, 5);
    assert.equal(rows.length, 5);
    assert.ok(rows.every((row) => row.domain === "liquid" && row.brandName.length > 0));
  });

  it("ficha por slug incluye marca", () => {
    const sheet = fileCatalogRepository.getBySlug("liquid", "herrera-abarra-freebase");
    assert.ok(sheet);
    assert.match(sheet!.brandName, /Herrera/i);
  });

  it("evalúa compatibilidad por slugs", () => {
    const dto = fileCatalogRepository.evaluate("vaporesso-xros-4", "xros-corex-0-8");
    assert.ok(dto);
    assert.equal(dto!.evaluation.legacyKind, "nativa");
  });

  it("índices por id y plataforma", () => {
    const { byId, byPlatform } = fileCatalogRepository.indexes();
    assert.ok(byId.size > 0);
    assert.ok(byPlatform.size > 0);
  });
});
