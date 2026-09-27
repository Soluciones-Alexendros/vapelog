#!/usr/bin/env node
/**
 * check-env (stub funcional): valida que las claves declaradas en .env.example
 * coinciden con las que el código realmente lee (process.env.X / import.meta.env.X).
 *
 * Vapelog no usa variables de entorno, así que con .env.example vacío este
 * check pasa trivialmente; si en el futuro se añaden variables por either lado,
 * aquí se detecta la discrepancia.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) yield* walk(full);
    } else if (/\.(ts|tsx|mts|js|jsx|mjs)$/.test(entry.name)) {
      yield full;
    }
  }
}

function declaredKeys() {
  const path = join(ROOT, ".env.example");
  if (!existsSync(path)) return { keys: [], file: false };
  const keys = readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const eq = line.indexOf("=");
      return (eq === -1 ? line : line.slice(0, eq)).trim();
    })
    .filter(Boolean);
  return { keys, file: true };
}

const used = new Set();
const scanDirs = ["src"];
const scanned = new Set();
for (const dir of scanDirs) {
  const full = join(ROOT, dir);
  if (!existsSync(full) || !statSync(full).isDirectory()) continue;
  for (const file of walk(full)) {
    if (scanned.has(file)) continue;
    scanned.add(file);
    const src = readFileSync(file, "utf8");
    for (const match of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(match[1]);
    for (const match of src.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(match[1]);
  }
}
// Runtime / framework: no forman parte del contrato .env.example del proyecto.
for (const key of [...used]) {
  if (key === "NODE_ENV" || key.startsWith("TSS_") || key.startsWith("VITE_")) used.delete(key);
}
const { keys: declared, file: hasExample } = declaredKeys();
const undeclared = [...used].filter((key) => !declared.includes(key)).sort();
const unused = declared.filter((key) => !used.has(key)).sort();

console.log(
  JSON.stringify(
    {
      envExample: hasExample,
      declared,
      usedInCode: [...used].sort(),
    },
    null,
    2,
  ),
);

if (undeclared.length > 0) {
  console.error(
    `check-env: el código usa variables no declaradas en .env.example: ${undeclared.join(", ")}`,
  );
  process.exitCode = 1;
}
if (unused.length > 0) {
  console.error(
    `check-env: .env.example declara variables que el código no usa: ${unused.join(", ")}`,
  );
  process.exitCode = 1;
}
if (process.exitCode !== 1) {
  console.log("check-env: OK");
}
