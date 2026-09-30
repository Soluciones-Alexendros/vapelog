import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { scrambleFrames } from "@/lib/kinetic/scramble";
import { useFx } from "@/lib/fx";
import { cn } from "@/lib/cn";

/**
 * N4 — Titular con tipografía cinética.
 *
 * Mecanismo de detección de "navegación cliente":
 * 1. Suscripción TanStack: `useRouterState(s => s.location.pathname)` mantiene
 *    al componente suscrito al router; al navegar, TanStack desmonta la ruta
 *    vieja y monta la nueva (nuevo h1), así que el efecto de abajo corre de
 *    nuevo con el pathname nuevo.
 * 2. Guard de primer montaje por sesión: `firstPaintDone` (memoria JS del
 *    módulo, se reinicia al recargar) es falso durante la primera pintura.
 *    Todos los KineticHeading montados en la carga inicial ven `false`, saltan
 *    la animación y programan el flip a `true` tras el primer frame. Los
 *    montajes posteriores (navegación cliente) ven `true` y animan.
 * 3. Singleton: `activeCtl` aborta la animación anterior antes de empezar otra;
 *    el cleanup aborta al desmontar o al cambiar de ruta. Una sola animación
 *    de texto a la vez.
 *
 * Salvaguardas (ADR-0004): el texto final viaja siempre en el DOM (SSR
 * intacto); la capa de scramble es hermana del h1 (`aria-hidden`), absoluta
 * sobre el texto real (CLS 0) y se retira al terminar (~42 pasos ≈ 700 ms).
 * Sin animación en primera carga, con `prefers-reduced-motion` ni con fx off.
 */

let firstPaintDone = false;
let firstPaintScheduled = false;
let activeCtl: AbortController | null = null;

function markFirstPaint(): void {
  if (firstPaintScheduled || typeof window === "undefined") return;
  firstPaintScheduled = true;
  const done = () => {
    firstPaintDone = true;
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.setTimeout(done, 0));
  } else {
    window.setTimeout(done, 0);
  }
}

function defaultSeed(text: string): number {
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function KineticHeading({
  as = "h1",
  text,
  className,
  seed,
}: {
  as?: "h1" | "p";
  text: string;
  className?: string;
  seed?: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fx = useFx();
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    // pathname suscribe al router: nueva navegación cliente => re-evaluar.
    void pathname;
    if (typeof window === "undefined") return;
    if (!firstPaintDone) {
      markFirstPaint();
      return;
    }
    if (fx !== "animated") return;
    activeCtl?.abort();
    const ctl = new AbortController();
    activeCtl = ctl;
    const steps = 42;
    const frames = scrambleFrames(text, { seed: seed ?? defaultSeed(text), steps });
    const DUR = 700;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (ctl.signal.aborted) return;
      const elapsed = now - t0;
      const idx = Math.min(frames.length - 1, Math.floor((elapsed / DUR) * frames.length));
      setFrame(frames[idx] ?? text);
      if (idx < frames.length - 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        if (!ctl.signal.aborted) setFrame(null);
        if (activeCtl === ctl) activeCtl = null;
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      ctl.abort();
      window.cancelAnimationFrame(raf);
      if (activeCtl === ctl) activeCtl = null;
    };
    // text/seed/fx re-disparan si cambian en la misma ruta.
  }, [pathname, text, seed, fx]);

  const Tag = as === "p" ? "p" : "h1";
  return (
    <span className="relative block">
      <Tag className={cn("relative", className)}>{text}</Tag>
      {frame !== null ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-background font-mono whitespace-pre-wrap break-words select-none"
        >
          {frame}
        </span>
      ) : null}
    </span>
  );
}
