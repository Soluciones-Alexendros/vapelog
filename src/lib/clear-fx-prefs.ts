/** Claves legadas del conmutador de efectos (ADR-0016 / ADR-0017). */
export const FX_PREF_KEYS = ["vapelog-fx:v2", "vapelog-fx"] as const;

/**
 * Lee una vez las preferencias FX antiguas y las borra. No reescribe ni
 * relanza efectos. Seguro si `localStorage` no está disponible.
 */
export function clearFxPrefs(
  store: Pick<Storage, "getItem" | "removeItem"> | null | undefined = typeof localStorage !==
  "undefined"
    ? localStorage
    : null,
): { hadLegacy: boolean } {
  if (!store) return { hadLegacy: false };
  let hadLegacy = false;
  for (const key of FX_PREF_KEYS) {
    try {
      if (store.getItem(key) != null) {
        hadLegacy = true;
        store.removeItem(key);
      }
    } catch {
      /* almacenamiento no disponible o bloqueado */
    }
  }
  return { hadLegacy };
}
