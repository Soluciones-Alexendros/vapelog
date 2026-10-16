/** Acceso seguro a Storage del navegador (session/local). Inyectable en pruebas. */

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function resolveStorage(pick: () => StorageLike | undefined): StorageLike | null {
  try {
    const storage = pick();
    return storage ?? null;
  } catch {
    return null;
  }
}

export function sessionStore(): StorageLike | null {
  return resolveStorage(() =>
    typeof globalThis.sessionStorage === "undefined" ? undefined : globalThis.sessionStorage,
  );
}

export function localStore(): StorageLike | null {
  return resolveStorage(() =>
    typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage,
  );
}

/** Devuelve null si el almacenamiento no existe o lanza. */
export function storeGet(key: string, storage: StorageLike | null = sessionStore()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo persistir. */
export function storeSet(
  key: string,
  value: string,
  storage: StorageLike | null = sessionStore(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export const AGE_STORAGE_KEY = "vapelog-edad";
export const AGE_STORAGE_OK = "ok";
export const COMPARE_STORAGE_KEY = "vapelog-compare";
