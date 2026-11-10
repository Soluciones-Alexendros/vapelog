import { writeFileSync } from "node:fs";

import { request } from "playwright/test";

import { previewStorageStatePath } from "./storage-state";

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

function isLoopback(baseURL: string): boolean {
  try {
    const { hostname } = new URL(baseURL);
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Siembra la cookie de bypass una sola vez, en un contexto de API limitado al
 * origen del Preview.
 *
 * Motivo: `extraHTTPHeaders` envía la cabecera con el secreto a **todas** las
 * peticiones del navegador, incluida la toolbar `vercel.live` que Vercel inyecta
 * en Preview. Con la cookie, el secreto no viaja en cada request y solo el
 * dominio del deployment la recibe.
 */
export default async function globalSetup(): Promise<void> {
  const statePath = previewStorageStatePath();
  const baseURL = process.env.E2E_BASE_URL;
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

  // Nitro local (`fx-e2e`, `smoke`) o Preview sin protección: no hay nada que
  // sembrar, pero Playwright exige que el fichero exista.
  if (!baseURL || !secret || isLoopback(baseURL)) {
    writeFileSync(statePath, EMPTY_STATE, { mode: 0o600 });
    return;
  }

  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });

  try {
    const res = await ctx.get("/");
    if (!res.ok()) {
      throw new Error(
        `No se pudo sembrar la cookie de bypass: el Preview respondió ${res.status()}. ` +
          "Revisa VERCEL_AUTOMATION_BYPASS_SECRET (environment Preview) y que el deployment esté listo. " +
          "Ver docs/runbooks/vap-22-preview-merge-y-aceptacion-u-ops.md.",
      );
    }
    await ctx.storageState({ path: statePath });
  } finally {
    await ctx.dispose();
  }
}
