import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { VapelogFxSnapshot } from "@/components/smoke-canvas";
import { useFxDecision } from "@/lib/fx";

/**
 * Overlay de diagnóstico activado con `?fx=debug`.
 * Muestra tier, fps, DPR, tamaño de canvas y reason.
 */
export function FxDebugOverlay() {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const decision = useFxDecision();
  const enabled = /(?:^|[?&])fx=debug(?:&|$)/.test(search);
  const [snap, setSnap] = useState<VapelogFxSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const next = (window as unknown as { __vapelogFx?: VapelogFxSnapshot }).__vapelogFx ?? null;
      setSnap(next);
      raf = window.setTimeout(tick, 250);
    };
    tick();
    return () => {
      alive = false;
      window.clearTimeout(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  const soft = snap?.canvas.soft;
  const ascii = snap?.canvas.ascii;

  return (
    <aside
      aria-label="Diagnóstico de efectos"
      className="pointer-events-none fixed right-3 bottom-3 z-[60] max-w-xs rounded-md border border-border bg-card/95 p-3 font-mono text-xs text-foreground shadow-2 backdrop-blur-sm"
    >
      <p className="font-display text-sm tracking-wide uppercase">fx debug</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">pref</dt>
        <dd>{decision.pref}</dd>
        <dt className="text-muted-foreground">mode</dt>
        <dd>{snap?.mode ?? decision.mode}</dd>
        <dt className="text-muted-foreground">reason</dt>
        <dd>{snap?.reason ?? decision.reason}</dd>
        <dt className="text-muted-foreground">tier</dt>
        <dd>{snap?.tier ?? "—"}</dd>
        <dt className="text-muted-foreground">fps</dt>
        <dd>{snap?.fps ?? "—"}</dd>
        <dt className="text-muted-foreground">running</dt>
        <dd>{String(snap?.running ?? false)}</dd>
        <dt className="text-muted-foreground">dpr</dt>
        <dd>{snap?.dpr?.toFixed?.(2) ?? "—"}</dd>
        <dt className="text-muted-foreground">soft</dt>
        <dd>{soft ? `${soft.w}×${soft.h}` : "—"}</dd>
        <dt className="text-muted-foreground">ascii</dt>
        <dd>{ascii ? `${ascii.w}×${ascii.h}` : "—"}</dd>
      </dl>
    </aside>
  );
}
