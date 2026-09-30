import { useEffect } from "react";
import type { RefObject } from "react";
import { useFx } from "@/lib/fx";
import { tiltFromPointer } from "@/lib/fx/tilt";

type Pending = { x: number; y: number; target: Element | null };

/**
 * N3 — spotlight + tilt delegados para tarjetas `.kind-card`.
 *
 * Un solo `pointermove` en el contenedor, throttle con rAF, escribe
 * `--mx/--my/--rx/--ry` (vía `tiltFromPointer`, maxDeg 4) solo en la tarjeta
 * bajo el puntero; limpia al salir.
 *
 * Inactivo con pointer coarse, prefers-reduced-motion o `vapelog-fx` off.
 *
 * Decisión claro/tilt: el tilt solo se aplica en `.dark` (transform inline
 * con `perspective(700px)`); en claro manda la sombra dura + pressed del CSS
 * y el hook solo alimenta `--mx/--my` del spotlight. `styles.css` no consume
 * `--rx/--ry`, de ahí el inline en la tarjeta activa.
 */
export function useCardFx<T extends HTMLElement>(ref: RefObject<T | null>): void {
  const fx = useFx();

  useEffect(() => {
    const container = ref.current;
    if (!container || typeof window === "undefined") return;
    if (fx === "off") return;

    let fine: boolean;
    let reduce: boolean;
    try {
      fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return;
    }
    if (!fine || reduce) return;

    let raf = 0;
    let pending: Pending | null = null;
    let active: HTMLElement | null = null;

    const clearActive = () => {
      if (!active) return;
      active.style.removeProperty("--mx");
      active.style.removeProperty("--my");
      active.style.removeProperty("--rx");
      active.style.removeProperty("--ry");
      if (active.style.transform) active.style.transform = "";
      if (active.style.willChange) active.style.willChange = "";
      active = null;
    };

    const onMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY, target: event.target as Element | null };
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const next = pending;
        pending = null;
        if (!next) return;
        const found = next.target?.closest?.(".kind-card") as HTMLElement | null;
        const card = found && container.contains(found) ? found : null;
        if (!card) {
          clearActive();
          return;
        }
        if (active && active !== card) clearActive();
        active = card;
        const rect = card.getBoundingClientRect();
        const { rx, ry, mx, my } = tiltFromPointer(
          { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          next.x,
          next.y,
          4,
        );
        card.style.setProperty("--mx", `${mx}px`);
        card.style.setProperty("--my", `${my}px`);
        card.style.setProperty("--rx", `${rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
        if (document.documentElement.classList.contains("dark")) {
          card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
          card.style.willChange = "transform";
        } else {
          if (card.style.transform) card.style.transform = "";
          if (card.style.willChange) card.style.willChange = "";
        }
      });
    };

    const onLeave = () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
        pending = null;
      }
      clearActive();
    };

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointercancel", onLeave);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointercancel", onLeave);
      clearActive();
    };
  }, [ref, fx]);
}
