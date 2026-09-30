import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Revelado progresivo de tarjetas (F4).
 *
 * - El contenido es visible por defecto: sin JS no hay clase `js` en
 *   `<html>` y el CSS deja `.reveal` opaco; con `prefers-reduced-motion`
 *   se revela todo de inmediato sin observar.
 * - Con movimiento permitido se observan como máximo 12 elementos
 *   (`main .reveal`) y se añade `.is-visible` con stagger de 30 ms (≤40 ms).
 */
const MAX_OBSERVED = 12;
const STAGGER_MS = 30;

export function RevealManager() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    try {
      document.documentElement.classList.add("js");
    } catch {
      return;
    }
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const timers: number[] = [];

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Espera un frame para que el h1/chunk de la ruta exista antes de medir.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const all = Array.from(
        document.querySelectorAll<HTMLElement>("main .reveal:not(.is-visible)"),
      );
      if (all.length === 0) return;
      // Tope de observación: el resto se revela sin animar para no dejar
      // nada oculto tras el límite.
      const [observed, rest] = [all.slice(0, MAX_OBSERVED), all.slice(MAX_OBSERVED)];
      for (const node of rest) node.classList.add("is-visible");
      if (reduce || typeof IntersectionObserver === "undefined") {
        for (const node of observed) node.classList.add("is-visible");
        return;
      }
      let order = 0;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const target = entry.target as HTMLElement;
            observer?.unobserve(target);
            const step = order;
            order += 1;
            timers.push(
              window.setTimeout(() => {
                target.classList.add("is-visible");
              }, step * STAGGER_MS),
            );
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      for (const node of observed) observer.observe(node);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const timer of timers) window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
