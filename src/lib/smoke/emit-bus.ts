// Puente UI → bocanadas del humo (S5). El lienzo expone `window.__vapelogSmoke`
// solo cuando fx=on y está montado; este módulo desacopla los botones de ese
// ciclo de vida y respeta que sin fx=off no haya puff.
import { getFxPreference } from "@/lib/fx";

export type SmokeHook = { emit?: (x: number, y: number) => void };

const MAX_PENDING = 3;
const pending: Array<{ x: number; y: number }> = [];

function hook(): SmokeHook | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { __vapelogSmoke?: SmokeHook }).__vapelogSmoke;
}

function queue(x: number, y: number): void {
  if (getFxPreference() !== "on") return; // fx=off: ni se encola
  pending.push({ x, y });
  if (pending.length > MAX_PENDING) pending.shift();
}

/** Bocanada solo si el lienzo está montado (fx=on); si no, no hace nada. */
export function puff(x: number, y: number): void {
  const h = hook();
  if (h && typeof h.emit === "function") h.emit(x, y);
}

/** Como `puff`, pero si fx pasa a on y el lienzo aún no montó, la encola para
 *  vaciarla al montar (caso del botón «Efectos»). */
export function requestPuff(x: number, y: number): void {
  const h = hook();
  if (h && typeof h.emit === "function") {
    h.emit(x, y);
    return;
  }
  queue(x, y);
}

/** Vacía la cola pendiente contra el emisor recién montado. */
export function drainPuffs(emitFn: (x: number, y: number) => void): void {
  while (pending.length > 0) {
    const p = pending.shift();
    if (p) emitFn(p.x, p.y);
  }
}
