import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fileCatalogRepository,
  normalizeListLimit,
  projectForPhysicalBrowse,
} from "./repository.ts";

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

  it("VAL-016-03: mutar campos anidados en índices no altera catálogo ni otro índice", () => {
    const liquidKey = "liquid:herrera-abarra-freebase";
    const { byId, bySlug } = fileCatalogRepository.indexes();
    const fromId = byId.get("herrera-abarra-freebase");
    const fromSlug = bySlug.get(liquidKey);
    assert.ok(fromId && fromSlug);
    assert.notEqual(fromId, fromSlug);
    if (fromId.domain !== "liquid" || fromSlug.domain !== "liquid") return;
    const sourceLenBefore = fromSlug.sources.length;
    fromSlug.name = "ÍNDICE-MUTADO";
    fromSlug.sources.push({ label: "fantasma", url: "https://example.test" });
    fromId.name = "OTRO-ÍNDICE";
    assert.equal(bySlug.get(liquidKey)!.name, "ÍNDICE-MUTADO");
    assert.equal(byId.get("herrera-abarra-freebase")!.name, "OTRO-ÍNDICE");
    const sheet = fileCatalogRepository.getBySlug("liquid", "herrera-abarra-freebase");
    assert.ok(sheet);
    assert.notEqual(sheet!.item.name, "ÍNDICE-MUTADO");
    if (sheet!.item.domain === "liquid") {
      assert.equal(sheet!.item.sources.length, sourceLenBefore);
    }
  });

  it("VAL-016-03: mutar bucket de plataforma no altera otro bucket ni la siguiente llamada", () => {
    const first = fileCatalogRepository.indexes();
    const keys = [...first.byPlatform.keys()];
    assert.ok(keys.length >= 2);
    const [k0, k1] = keys;
    const bucket0 = first.byPlatform.get(k0)!;
    const head0Name = bucket0[0]?.name;
    bucket0[0]!.name = "PLATAFORMA-MUTADA";
    bucket0.push(structuredClone(bucket0[0]!));
    const peer = first.byPlatform.get(k1)!;
    const peerNamesBefore = peer.map((item) => item.name);
    const second = fileCatalogRepository.indexes();
    const fresh0 = second.byPlatform.get(k0)!;
    assert.ok(fresh0.some((item) => item.name === head0Name));
    assert.equal(fresh0.length, second.byPlatform.get(k0)!.length);
    const freshPeer = second.byPlatform.get(k1)!;
    assert.deepEqual(
      freshPeer.map((item) => item.name),
      peerNamesBefore,
    );
  });

  it("VAL-016-04: listPage es prefijo truncado sin cursor (VAP-13)", () => {
    const small = fileCatalogRepository.listPage("liquid", {}, 5);
    const large = fileCatalogRepository.listPage("liquid", {}, 12);
    assert.equal(small.items.length, 5);
    assert.ok(small.total >= 12);
    assert.equal(small.hasMore, small.total > small.limit);
    assert.equal(large.items.length, 12);
    const smallIds = small.items.map((row) => row.id);
    const largePrefix = large.items.slice(0, 5).map((row) => row.id);
    assert.deepEqual(largePrefix, smallIds);
    assert.ok(!("cursor" in small) && !("offset" in small));
  });

  it("VAL-016-03: projectForPhysicalBrowse aísla el device proyectado", () => {
    const rows = projectForPhysicalBrowse("device") as Array<{ device: { name: string } }>;
    assert.ok(rows.length > 0);
    const original = rows[0]!.device.name;
    rows[0]!.device.name = "BROWSE-MUTADO";
    const again = projectForPhysicalBrowse("device") as Array<{ device: { name: string } }>;
    assert.equal(again[0]!.device.name, original);
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
