import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Ruta determinista del `storageState` con la cookie de bypass.
 *
 * Config, `globalSetup` y `globalTeardown` la calculan por separado y deben
 * coincidir, así que vive en un único sitio. Sobrescribible con
 * `PREVIEW_STORAGE_STATE` (útil en CI con cachés aisladas).
 */
export function previewStorageStatePath(): string {
  return process.env.PREVIEW_STORAGE_STATE ?? join(tmpdir(), "vapelog-preview-storage-state.json");
}
