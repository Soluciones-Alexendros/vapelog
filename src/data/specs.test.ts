import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { coils, devices, liquids, parts } from "./catalog.ts";
import { compareFacts, specFacts, specGroups, variationRows } from "./specs.ts";
import type { CatalogItem, Domain } from "./types.ts";

function sqlKeys(domain: Domain): string[] {
  const sql = readFileSync(new URL("../../public/vapelog-esquema.sql", import.meta.url), "utf8");
  const keys: string[] = [];
  const pattern = new RegExp(`\\('${domain}', '([a-z0-9_]+)', '[a-z_]+', '[A-ZÁÉÍÓÚÑ]`, "g");
  for (const match of sql.matchAll(pattern)) keys.push(match[1]!);
  return keys;
}

describe("ficha plana", () => {
  it("repite las mismas claves en todo el dominio", () => {
    const keys = specFacts(devices[0]!).map((fact) => fact.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const device of devices) {
      assert.deepEqual(
        specFacts(device).map((fact) => fact.key),
        keys,
      );
    }
  });

  it("no inventa el peso ni el año cuando la ficha no los publica", () => {
    const xros = devices.find((device) => device.slug === "vaporesso-xros-4");
    assert.ok(xros);
    const facts = specFacts(xros);
    assert.equal(facts.find((fact) => fact.key === "power_min_w")?.display, "5 W");
    assert.equal(facts.find((fact) => fact.key === "power_max_w")?.display, "30 W");
    assert.equal(facts.find((fact) => fact.key === "year")?.published, false);
    assert.equal(facts.find((fact) => fact.key === "year")?.display, "Sin dato publicado");
  });

  it("toda resistencia tiene ohmios y la misma plantilla", () => {
    const keys = specFacts(coils[0]!).map((fact) => fact.key);
    for (const coil of coils) {
      const facts = specFacts(coil);
      assert.deepEqual(
        facts.map((fact) => fact.key),
        keys,
      );
      assert.equal(facts.find((fact) => fact.key === "ohms")?.published, true);
    }
  });

  it("alinea la comparativa por clave, no por texto suelto", () => {
    const rows = compareFacts([coils[0]!, coils[1]!]);
    const ohms = rows.find((row) => row.label === "Resistencia");
    assert.equal(ohms?.values.length, 2);
    assert.ok(ohms?.values.every((value) => value.endsWith("Ω")));
  });

  it("cada variación de líquido tiene su fila con volumen y nicotina", () => {
    for (const liquid of liquids) {
      const rows = variationRows(liquid);
      assert.equal(rows.length, liquid.variations.length);
      assert.deepEqual(
        rows.map((row) => row.key),
        liquid.variations.map((variation) => variation.id),
      );
      assert.ok(rows.every((row) => row.display.includes("ml")));
      rows.forEach((row, index) => {
        const variation = liquid.variations[index]!;
        if (variation.hasNicotine) {
          assert.ok(row.display.includes("mg/ml"));
        } else {
          assert.ok(row.display.includes("sin nicotina"));
        }
      });
    }
  });

  it("la ficha de líquido usa las claves del modelo de variaciones", () => {
    const keys = specFacts(liquids[0]!).map((fact) => fact.key);
    assert.ok(keys.includes("genre"));
    assert.ok(keys.includes("volume_ml"));
    assert.ok(keys.includes("ratio"));
    assert.ok(keys.includes("has_nicotine"));
    assert.ok(keys.includes("nicotine_mg"));
    assert.ok(keys.includes("draw"));
    for (const disabled of ["family", "nicotine_type", "vg", "pg", "bottle", "assumed_bottle_ml"]) {
      assert.equal(keys.includes(disabled), false);
    }
  });

  it("etiqueta el grupo de régimen como Fuente en los dominios con TPD", () => {
    const samples: Record<"device" | "liquid", CatalogItem> = {
      device: devices[0]!,
      liquid: liquids[0]!,
    };
    for (const domain of ["device", "liquid"] as const) {
      const regimen = specGroups(samples[domain]).find((group) => group.id === "regimen");
      assert.equal(regimen?.label, "Fuente");
    }
  });

  it("la plantilla SQL usa las mismas claves que la ficha", () => {
    const samples: Record<Domain, CatalogItem> = {
      device: devices[0]!,
      coil: coils[0]!,
      liquid: liquids[0]!,
      part: parts[0]!,
    };
    for (const domain of ["device", "coil", "liquid", "part"] as const) {
      assert.deepEqual(
        specFacts(samples[domain]).map((fact) => fact.key),
        sqlKeys(domain),
      );
    }
  });
});
