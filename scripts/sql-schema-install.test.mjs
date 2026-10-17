import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const sql = readFileSync(new URL("../public/vapelog-esquema.sql", import.meta.url), "utf8");

describe("esquema SQL objetivo (estático)", () => {
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

describe("instalación Postgres (contrato)", () => {
  it("con DATABASE_URL valida el esquema de URL; sin ella el skip es explícito", () => {
    if (process.env.DATABASE_URL) {
      assert.match(process.env.DATABASE_URL, /^postgres/i);
      return;
    }
    // La instalación real vive en el job sql-integration (`pnpm run test:sql`).
    // Este suite unitario no debe fallar por ausencia de Postgres.
    if (process.env.SQL_INTEGRATION === "1") {
      assert.fail(
        "DATABASE_URL ausente con SQL_INTEGRATION=1: el job sql-integration debe proveer Postgres",
      );
    }
    assert.equal(
      process.env.DATABASE_URL,
      undefined,
      "sin DATABASE_URL: instalación real queda en pnpm run test:sql / job sql-integration",
    );
  });
});
