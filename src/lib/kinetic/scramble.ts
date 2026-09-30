// Modelo puro de la tipografía cinética "decodificar": el texto final es SIEMPRE el del DOM;
// esto solo calcula fotogramas de una capa aria-hidden que se superpone durante ≤ 700 ms.
export const GLYPHS = ".·:~=+*#" as const;

export type ScrambleOptions = { seed: number; steps: number; stagger?: number };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fotograma `step` (0..steps). En `steps` devuelve exactamente `target`. Conserva espacios y longitud. */
export function scrambleFrame(target: string, step: number, opts: ScrambleOptions): string {
  const chars = Array.from(target); // respeta acentos y ñ (code points)
  const n = chars.length;
  if (step >= opts.steps) return target;
  const stagger = opts.stagger ?? 0.55; // fracción de la animación que se reparte entre letras
  const rnd = mulberry32(opts.seed * 7919 + step * 104729);
  return chars
    .map((ch, i) => {
      if (/\s/.test(ch)) return ch;
      const settleAt = Math.floor(
        ((i + 1) / n) * stagger * opts.steps + (1 - stagger) * opts.steps * 0.5,
      );
      if (step >= settleAt) return ch;
      return GLYPHS[Math.floor(rnd() * GLYPHS.length)];
    })
    .join("");
}

export function scrambleFrames(target: string, opts: ScrambleOptions): string[] {
  return Array.from({ length: opts.steps + 1 }, (_, s) => scrambleFrame(target, s, opts));
}
