#!/usr/bin/env node
/**
 * Aplica public/vapelog-esquema.sql contra DATABASE_URL (Postgres desechable).
 * Parada ante el primer error. No usar contra producción.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL es obligatorio para la instalación SQL");
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(url)) {
  console.error("DATABASE_URL debe ser una URL postgres");
  process.exit(1);
}

const schema = resolve("public/vapelog-esquema.sql");
if (!existsSync(schema)) {
  console.error("No se encuentra public/vapelog-esquema.sql");
  process.exit(1);
}

try {
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", schema], {
    stdio: "inherit",
    env: process.env,
  });
} catch (error) {
  console.error("Falló la instalación del esquema SQL");
  process.exit(error.status ?? 1);
}

console.log("Esquema SQL instalado correctamente");
