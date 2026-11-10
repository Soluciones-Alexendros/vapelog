import { rmSync } from "node:fs";

import { previewStorageStatePath } from "./storage-state";

/** La cookie de bypass es una credencial: se borra al terminar la suite. */
export default function globalTeardown(): void {
  rmSync(previewStorageStatePath(), { force: true });
}
