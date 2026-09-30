/**
 * Ahorro de datos. `prefers-reduced-data` y `navigator.connection.saveData`
 * no están tipados de forma estable; se leen con casts estrechos.
 */
export function wantsReducedData(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (typeof window.matchMedia === "function") {
    try {
      if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return true;
    } catch {
      // matchMedia caprichoso: se sigue con connection.saveData.
    }
  }
  return Boolean(
    (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData,
  );
}
