import { useEffect, useRef } from "react";

/**
 * Contador de la home (F4).
 *
 * El valor final ya está en el HTML SSR (`{value}` como contenido inicial);
 * la progresión desde 0 solo corre como mejora en cliente al entrar en
 * viewport, y se omite con `prefers-reduced-motion` o sin IO/rAF.
 */
export function CountUp({ value, durationMs = 700 }: { value: number; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;
    if (typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    let started = false;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = String(Math.round(eased * value));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          node.textContent = String(value);
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            node.textContent = "0";
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
