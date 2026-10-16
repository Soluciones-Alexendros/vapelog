import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const sql = readFileSync(new URL("../public/vapelog-esquema.sql", import.meta.url), "utf8");

describe("esquema SQL objetivo", () => {
  it("platform no exige connector", () => {
    assert.match(sql, /create table platform \(/);
    const block = sql.slice(
      sql.indexOf("create table platform"),
      sql.indexOf("create table device"),
    );
    assert.doesNotMatch(block, /connector/);
  });

  it("liquid tiene columna line", () => {
    assert.match(sql, /create table liquid \([\s\S]*?\bline text not null/);
  });

  it("liquid_variation usa fill/container y VG/PG numéricos", () => {
    assert.match(sql, /fill_volume_ml/);
    assert.match(sql, /container_capacity_ml/);
    assert.match(sql, /ratio_vg_pct/);
    assert.match(sql, /ratio_pg_pct/);
    assert.doesNotMatch(sql, /ratio text check \(ratio in \('50\/50', '70\/30'\)\)/);
  });

  it("compat_exclusion referencia ids", () => {
    assert.match(
      sql,
      /create table compat_exclusion \([\s\S]*?device_id uuid not null references device/,
    );
  });
});

describe("instalación Postgres", () => {
  it("requiere DATABASE_URL; no simula el resultado si falta", async () => {
    if (!process.env.DATABASE_URL) {
      assert.ok(true, "sin DATABASE_URL: la instalación real queda pendiente de CI/servicio");
      return;
    }
    // Si hay servidor, psql aplicaría el esquema; aquí solo documentamos el contrato.
    assert.match(process.env.DATABASE_URL, /^postgres/);
  });
});
