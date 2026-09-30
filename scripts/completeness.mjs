#!/usr/bin/env node
/**
 * Regenera docs/guides/completitud.md a partir de completion().
 * No es fuente de verdad: la función en src/data/completion.ts sí lo es.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { coils, devices, liquids, parts } from "../src/data/catalog.ts";
import { completion } from "../src/data/completion.ts";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "docs/guides/completitud.md");

const groups = [
  ["Dispositivos", devices],
  ["Resistencias", coils],
  ["Líquidos", liquids],
  ["Componentes", parts],
];

function rows(items) {
  return items
    .map((item) => {
      const score = completion(item);
      return { slug: item.slug, name: item.name, ...score };
    })
    .sort((a, b) => a.pct - b.pct || a.slug.localeCompare(b.slug));
}

function avg(list) {
  if (list.length === 0) return 0;
  return Math.round(list.reduce((sum, row) => sum + row.pct, 0) / list.length);
}

let md = `# Completitud del catálogo

### Propósito de este documento

- **Objetivos:** Ranking de cobertura por ficha, generado por \`pnpm run completeness\`.
- **Estructura:** Resumen por dominio → tablas ordenadas de menor a mayor cobertura.
- **Contenido a integrar según contexto:** Salida de \`src/data/completion.ts\`. No editar a mano.

`;

for (const [label, items] of groups) {
  const ranked = rows(items);
  md += `## ${label}\n\n`;
  md += `Media ${avg(ranked)} %. ${ranked.filter((row) => !row.hasPhoto).length} sin foto.\n\n`;
  md += `| Cobertura | Ficha | Huecos |\n| --- | --- | --- |\n`;
  for (const row of ranked) {
    const gaps = row.missing.map((gap) => gap.label).join(", ") || "—";
    md += `| ${row.pct} % | \`${row.slug}\` ${row.name} | ${gaps} |\n`;
  }
  md += "\n";
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, md);
console.log(`wrote ${OUT}`);
