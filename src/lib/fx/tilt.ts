export type TiltRect = { x: number; y: number; width: number; height: number };

export type TiltResult = { rx: number; ry: number; mx: number; my: number };

/**
 * Modelo puro del tilt de tarjetas (fase N3): sin DOM, sin dependencias.
 * - `rx`/`ry`: grados de rotación. Centro = 0, bordes = ±maxDeg.
 *   `ry` negativo a la izquierda y positivo a la derecha;
 *   `rx` positivo arriba y negativo abajo.
 * - El puntero fuera del rect se sujeta (clamp) para `rx`/`ry`.
 * - `mx`/`my`: posición del puntero en px relativa al rect
 *   (para las CSS vars --mx/--my del spotlight), sin clamp.
 */
export function tiltFromPointer(rect: TiltRect, px: number, py: number, maxDeg = 4): TiltResult {
  const mx = px - rect.x;
  const my = py - rect.y;
  if (!(rect.width > 0) || !(rect.height > 0)) return { rx: 0, ry: 0, mx, my };
  const nx = Math.min(1, Math.max(0, mx / rect.width));
  const ny = Math.min(1, Math.max(0, my / rect.height));
  const ry = (nx - 0.5) * 2 * maxDeg;
  const rx = (0.5 - ny) * 2 * maxDeg;
  return { rx, ry, mx, my };
}
