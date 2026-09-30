import { useEffect, useRef } from "react";
import {
  getFxDecision,
  indexToTier,
  initialTierIndex,
  TierGovernor,
  tierToIndex,
  useFx,
  useFxReason,
  type FxReason,
} from "@/lib/fx";
import { drainPuffs } from "@/lib/smoke/emit-bus";
import {
  ASCII_RAMP,
  bayer,
  createSmoke,
  emit as emitPuff,
  glyphFor,
  SMOKE_RGB_DARK_DEFAULT,
  smokeTintForRoute,
  stepSmoke,
} from "@/lib/smoke/model";

const PAD = 120;
const THEME_FADE_MS = 400;
/** Pausa del rAF tras perder el foco de ventana (blur), además de document.hidden. */
const BLUR_PAUSE_MS = 5000;
/** Pasos de precalentamiento para el fotograma estático (reduced-motion). */
const STATIC_WARMUP_STEPS = 90;
/**
 * F2 — Q3/Q2/Q1 hacia 90/55/32 (plan 120/70/36). Conteos anclados a
 * dens_max ≤ 4.5 en las 11 semillas del contrato de contraste; 90/55
 * rompen ese tope en alguna semilla (no monótono con el RNG de spawn).
 */
const TIERS = [
  { count: 87, cell: 16, ascii: true, fps: 30, res: 0.5 },
  { count: 54, cell: 20, ascii: true, fps: 24, res: 0.4 },
  { count: 32, cell: 24, ascii: false, fps: 20, res: 0.33 },
] as const;

/** Primer paint (doble rAF) + requestIdleCallback; fallback setTimeout 1s. */
function afterFirstPaintIdle(run: () => void, fallbackMs = 1000): { cancel: () => void } {
  let cancelled = false;
  let idleId = 0;
  let timeoutId = 0;
  let raf1 = 0;
  let raf2 = 0;
  const kick = () => {
    if (cancelled) return;
    const go = () => {
      if (!cancelled) run();
    };
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(go, { timeout: fallbackMs });
    } else {
      timeoutId = window.setTimeout(go, fallbackMs);
    }
  };
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(kick);
  });
  return {
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

export type VapelogFxSnapshot = {
  tier: number;
  fps: number;
  reason: FxReason;
  running: boolean;
  mode: "animated" | "static" | "off";
  dpr: number;
  canvas: { soft: { w: number; h: number }; ascii: { w: number; h: number } };
};

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const rgb = () => (css("--smoke-rgb") || "120 108 92").split(/\s+/).join(", ");

const isDarkTheme = () => document.documentElement.classList.contains("dark");

function publishFx(
  partial: Partial<VapelogFxSnapshot> & Pick<VapelogFxSnapshot, "reason" | "mode">,
) {
  const prev = (window as unknown as { __vapelogFx?: VapelogFxSnapshot }).__vapelogFx;
  const next: VapelogFxSnapshot = {
    tier: partial.tier ?? prev?.tier ?? 0,
    fps: partial.fps ?? prev?.fps ?? 0,
    reason: partial.reason,
    running: partial.running ?? false,
    mode: partial.mode,
    dpr: partial.dpr ?? prev?.dpr ?? Math.min(window.devicePixelRatio || 1, 2),
    canvas: partial.canvas ??
      prev?.canvas ?? {
        soft: { w: 0, h: 0 },
        ascii: { w: 0, h: 0 },
      },
  };
  (window as unknown as { __vapelogFx: VapelogFxSnapshot }).__vapelogFx = next;
  document.documentElement.dataset.fx = next.mode;
}

function applyRouteTint(): void {
  const root = document.documentElement;
  if (!isDarkTheme()) {
    root.style.removeProperty("--smoke-rgb");
    return;
  }
  const tint = smokeTintForRoute(window.location.pathname, true);
  if (tint === SMOKE_RGB_DARK_DEFAULT) root.style.removeProperty("--smoke-rgb");
  else root.style.setProperty("--smoke-rgb", tint);
}

const BRUT_EXTRA_PX = 9;
function updateAsciiMask(asc: HTMLCanvasElement): void {
  let half = 576;
  const probe = document.querySelector("header .mx-auto.max-w-6xl");
  if (probe instanceof HTMLElement) {
    const w = probe.getBoundingClientRect().width;
    if (w > 0) half = w / 2;
  }
  asc.style.setProperty("--content-half", `${Math.round(half + BRUT_EXTRA_PX)}px`);
}

function makeSprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  if (!x) return c;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${color},1)`);
  g.addColorStop(0.4, `rgba(${color},.5)`);
  g.addColorStop(1, `rgba(${color},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return c;
}
function makeAtlas(color: string, cell: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = cell * ASCII_RAMP.length;
  c.height = Math.ceil(cell * 1.7);
  const x = c.getContext("2d");
  if (!x) return c;
  x.font = `${cell - 2}px "Space Mono", ui-monospace, "DejaVu Sans Mono", monospace`;
  x.textBaseline = "top";
  x.fillStyle = `rgb(${color})`;
  ASCII_RAMP.forEach((ch, i) => {
    x.fillText(ch, i * cell, 0);
  });
  return c;
}

function markHost(el: HTMLDivElement, opts: { ready: boolean; reason: FxReason; tier?: number }) {
  el.dataset.fxReason = opts.reason;
  if (opts.tier !== undefined) el.dataset.smokeTier = String(opts.tier);
  if (opts.ready) {
    el.dataset.ready = "true";
    el.dataset.fxReady = "true";
  } else {
    el.dataset.ready = "false";
    el.dataset.fxReady = "false";
  }
}

export function SmokeCanvas() {
  const mode = useFx();
  const reason = useFxReason();
  const host = useRef<HTMLDivElement>(null);
  const softRef = useRef<HTMLCanvasElement>(null);
  const asciiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current;
    const soft = softRef.current;
    const asc = asciiRef.current;
    if (!el || !soft || !asc) {
      publishFx({ reason: "not-mounted", mode: "off", running: false });
      return;
    }

    if (mode === "off") {
      markHost(el, { ready: false, reason });
      publishFx({ reason, mode: "off", running: false, tier: 0, fps: 0 });
      document.documentElement.style.removeProperty("--smoke-rgb");
      return;
    }

    applyRouteTint();
    const sx = soft.getContext("2d");
    const ax = asc.getContext("2d");
    if (!sx || !ax) {
      markHost(el, { ready: false, reason: "ctx-null" });
      publishFx({ reason: "ctx-null", mode, running: false });
      return;
    }

    let W = innerWidth;
    let H = innerHeight;
    const cores = navigator.hardwareConcurrency || 8;
    let tierIndex = initialTierIndex(W, cores);
    const maxTier = indexToTier(initialTierIndex(W, cores));
    const governor = new TierGovernor(indexToTier(tierIndex), maxTier);

    let raf = 0;
    let alive = true;
    let last = 0;
    let lastAscii = 0;
    let state = createSmoke({
      width: W,
      height: H,
      pad: PAD,
      count: TIERS[tierIndex].count,
      cell: TIERS[tierIndex].cell,
      seed: 20260929,
    });
    let sprite = makeSprite(rgb());
    let atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
    let k = parseFloat(css("--smoke-k")) || 0.02;
    let prevSprite = sprite;
    let prevAtlas = atlas;
    let prevK = k;
    let fadeT0 = 0;
    let fading = false;
    let frameId = 0;
    let lastFrameCostMs = 0;
    let fontsCancelled = false;

    const canvasSizes = () => ({
      soft: { w: soft.width, h: soft.height },
      ascii: { w: asc.width, h: asc.height },
    });

    const hook = {
      get tier() {
        return tierIndex;
      },
      get emaMs() {
        return lastFrameCostMs;
      },
      get frameId() {
        return frameId;
      },
      get lastFrameCostMs() {
        return lastFrameCostMs;
      },
      get emits() {
        return state.emits.length;
      },
      get densityMax() {
        let m = 0;
        for (const v of state.density) if (v > m) m = v;
        return m;
      },
      emit: (x: number, y: number) => emitPuff(state, x, y),
    };
    (window as unknown as { __vapelogSmoke?: object }).__vapelogSmoke = hook;
    drainPuffs((x, y) => emitPuff(state, x, y));

    const size = () => {
      const r = TIERS[tierIndex].res;
      soft.width = Math.ceil((W + 2 * PAD) * r);
      soft.height = Math.ceil((H + 2 * PAD) * r);
      sx.setTransform(r, 0, 0, r, 0, 0);
      asc.width = W;
      asc.height = H;
    };

    const rebuild = () => {
      state = createSmoke({
        ...state.cfg,
        width: W,
        height: H,
        count: TIERS[tierIndex].count,
        cell: TIERS[tierIndex].cell,
      });
      atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
      size();
      el.dataset.smokeTier = String(tierIndex);
    };

    const onRouteChange = () => {
      applyRouteTint();
      sprite = makeSprite(rgb());
      atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
      k = parseFloat(css("--smoke-k")) || k;
      updateAsciiMask(asc);
    };
    const origPushState = window.history.pushState.bind(window.history);
    const origReplaceState = window.history.replaceState.bind(window.history);
    window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      origPushState(data, unused, url);
      onRouteChange();
    }) as typeof window.history.pushState;
    window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      origReplaceState(data, unused, url);
      onRouteChange();
    }) as typeof window.history.replaceState;
    const onPopState = () => onRouteChange();
    addEventListener("popstate", onPopState);

    try {
      const fonts = (
        document as Document & {
          fonts?: {
            load?: (font: string, text?: string) => Promise<unknown>;
            ready?: Promise<unknown>;
          };
        }
      ).fonts;
      void Promise.resolve()
        .then(() => fonts?.load?.(`${TIERS[tierIndex].cell - 2}px "Space Mono"`, ".:~="))
        .then(() => {
          if (!fontsCancelled && alive) atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
        })
        .catch((err) => {
          console.warn("[vapelog-fx] font load failed; using fallback metrics", err);
        });
      void Promise.resolve(fonts?.ready)
        .then(() => {
          if (!fontsCancelled && alive) atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
        })
        .catch((err) => {
          console.warn("[vapelog-fx] document.fonts.ready failed", err);
        });
    } catch (err) {
      console.warn("[vapelog-fx] FontFaceSet unavailable", err);
    }

    const drawSoft = (spriteImg: HTMLCanvasElement, kk: number, alphaScale: number) => {
      const draw = (p: (typeof state.puffs)[number]) => {
        sx.globalAlpha = Math.min(0.9, kk * p.env) * alphaScale;
        sx.save();
        sx.translate(p.x + PAD, p.y + PAD);
        sx.rotate(p.rot);
        sx.scale(1, p.squash);
        sx.drawImage(spriteImg, -p.size, -p.size, p.size * 2, p.size * 2);
        sx.restore();
      };
      for (const p of state.puffs) draw(p);
      for (const p of state.emits) draw(p);
    };
    const drawAscii = (atlasImg: HTMLCanvasElement, alphaScale: number, clear: boolean) => {
      if (clear) ax.clearRect(0, 0, W, H);
      const c = TIERS[tierIndex].cell;
      const cy = state.cellY;
      for (let r = 0; r < state.rows; r++)
        for (let q = 0; q < state.cols; q++) {
          const g = glyphFor(state.density[r * state.cols + q], bayer(q, r));
          if (!g) continue;
          ax.globalAlpha = (0.05 + 0.07 * g.strength) * alphaScale;
          ax.drawImage(
            atlasImg,
            ASCII_RAMP.indexOf(g.ch as never) * c,
            0,
            c,
            Math.ceil(cy),
            q * c - PAD,
            r * cy - PAD,
            c,
            Math.ceil(cy),
          );
        }
      ax.globalAlpha = 1;
    };

    const paintFrame = (fade: number, drawGlyphs: boolean) => {
      sx.clearRect(0, 0, W + 2 * PAD, H + 2 * PAD);
      if (fading && fade < 1) drawSoft(prevSprite, prevK, 1 - fade);
      drawSoft(sprite, k, fading ? fade : 1);
      sx.globalAlpha = 1;
      if (drawGlyphs && TIERS[tierIndex].ascii) {
        if (fading && fade < 1) {
          drawAscii(prevAtlas, 1 - fade, true);
          drawAscii(atlas, fade, false);
        } else drawAscii(atlas, 1, true);
      }
    };

    size();
    updateAsciiMask(asc);
    el.dataset.smokeTier = String(tierIndex);
    // L0 (body::before) sigue visible; el canvas no se marca ready hasta el
    // primer fotograma (animated) o el warmup (static), tras diferir el trabajo.
    markHost(el, { ready: false, reason, tier: tierIndex });

    if (mode === "static") {
      publishFx({
        reason,
        mode: "static",
        running: false,
        tier: indexToTier(tierIndex as 0 | 1 | 2),
        fps: 0,
        canvas: canvasSizes(),
      });
      const defer = afterFirstPaintIdle(() => {
        if (!alive) return;
        const dt = 1 / 30;
        for (let i = 0; i < STATIC_WARMUP_STEPS; i++) stepSmoke(state, dt);
        paintFrame(1, true);
        markHost(el, { ready: true, reason, tier: tierIndex });
        publishFx({
          reason,
          mode: "static",
          running: false,
          tier: indexToTier(tierIndex as 0 | 1 | 2),
          fps: 0,
          canvas: canvasSizes(),
        });
      });
      return () => {
        defer.cancel();
        fontsCancelled = true;
        alive = false;
        window.history.pushState = origPushState;
        window.history.replaceState = origReplaceState;
        removeEventListener("popstate", onPopState);
        document.documentElement.style.removeProperty("--smoke-rgb");
        markHost(el, { ready: false, reason: "not-mounted" });
        delete (window as unknown as { __vapelogSmoke?: object }).__vapelogSmoke;
      };
    }

    let heavyStarted = false;
    let announcedReady = false;
    let windowFocused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
    let blurTimer = 0;

    const frame = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const step = 1000 / TIERS[tierIndex].fps;
      if (now - last < step) return;
      const dt = Math.min((now - (last || now - step)) / 1000, 0.1);
      last = now;
      const t0 = performance.now();
      stepSmoke(state, dt);
      const fade = fading ? Math.min(1, (now - fadeT0) / THEME_FADE_MS) : 1;
      const glyphs = TIERS[tierIndex].ascii && now - lastAscii > 100;
      if (glyphs) lastAscii = now;
      paintFrame(fade, glyphs || fading);
      if (fading && fade >= 1) {
        fading = false;
        prevSprite = sprite;
        prevAtlas = atlas;
        prevK = k;
      }
      lastFrameCostMs = performance.now() - t0;
      frameId++;
      if (!announcedReady) {
        announcedReady = true;
        markHost(el, { ready: true, reason, tier: tierIndex });
      }
      const prevGov = governor.tier;
      governor.frame(lastFrameCostMs);
      if (governor.tier !== prevGov) {
        tierIndex = tierToIndex(governor.tier);
        rebuild();
      }
      const effectiveReason: FxReason =
        governor.tier < maxTier ? "tier-degraded" : getFxDecision().reason;
      publishFx({
        reason: effectiveReason,
        mode: "animated",
        running: true,
        tier: governor.tier,
        fps: TIERS[tierIndex].fps,
        canvas: canvasSizes(),
      });
    };

    const onResize = () => {
      if (innerWidth === W && Math.abs(innerHeight - H) / H < 0.25) return;
      W = innerWidth;
      H = innerHeight;
      rebuild();
      updateAsciiMask(asc);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const canRun = () => alive && heavyStarted && !document.hidden && windowFocused;
    const start = () => {
      if (!canRun() || raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    const onBlur = () => {
      windowFocused = false;
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        blurTimer = 0;
        if (!windowFocused) stop();
      }, BLUR_PAUSE_MS);
    };
    const onFocus = () => {
      windowFocused = true;
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = 0;
      }
      start();
    };
    const mo = new MutationObserver(() => {
      applyRouteTint();
      prevSprite = sprite;
      prevAtlas = atlas;
      prevK = k;
      sprite = makeSprite(rgb());
      atlas = makeAtlas(rgb(), TIERS[tierIndex].cell);
      k = parseFloat(css("--smoke-k")) || k;
      fadeT0 = performance.now();
      fading = true;
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onScroll = () => {
      el.style.transform = `translate3d(0, ${Math.min(8, scrollY * 0.01)}px, 0)`;
    };

    publishFx({
      reason,
      mode: "animated",
      running: false,
      tier: governor.tier,
      fps: TIERS[tierIndex].fps,
      canvas: canvasSizes(),
    });
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    addEventListener("blur", onBlur);
    addEventListener("focus", onFocus);
    addEventListener("scroll", onScroll, { passive: true });

    const defer = afterFirstPaintIdle(() => {
      if (!alive || heavyStarted) return;
      heavyStarted = true;
      start();
    });

    return () => {
      defer.cancel();
      fontsCancelled = true;
      alive = false;
      if (blurTimer) clearTimeout(blurTimer);
      stop();
      mo.disconnect();
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
      removeEventListener("popstate", onPopState);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("blur", onBlur);
      removeEventListener("focus", onFocus);
      removeEventListener("scroll", onScroll);
      document.documentElement.style.removeProperty("--smoke-rgb");
      markHost(el, { ready: false, reason: "not-mounted" });
      delete (window as unknown as { __vapelogSmoke?: object }).__vapelogSmoke;
      publishFx({ reason: "not-mounted", mode: "off", running: false });
    };
  }, [mode, reason]);

  return (
    <div
      ref={host}
      aria-hidden
      data-fx=""
      data-smoke-tier=""
      className="smoke-layer"
      style={{ ["--smoke-pad" as string]: `${PAD}px` }}
    >
      <canvas ref={softRef} className="smoke-soft" data-fx="smoke-soft" />
      <canvas ref={asciiRef} className="smoke-ascii" data-fx="smoke-ascii" />
    </div>
  );
}
