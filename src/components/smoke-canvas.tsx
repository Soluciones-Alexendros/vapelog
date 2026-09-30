import { useEffect, useRef } from "react";
import { useFx } from "@/lib/fx";
import { drainPuffs } from "@/lib/smoke/emit-bus";
import {
  ASCII_RAMP,
  bayer,
  createSmoke,
  emit as emitPuff,
  glyphFor,
  stepSmoke,
} from "@/lib/smoke/model";

const PAD = 120;
// S5: cross-fade de tema. El token --dur-4 es 700 ms, pero S5 fija 400 ms para
// el humo; `prefers-reduced-motion` no llega aquí (la capa ni se monta).
const THEME_FADE_MS = 400;
const TIERS = [
  { count: 72, cell: 16, ascii: true, fps: 30, res: 0.5 },
  { count: 40, cell: 20, ascii: true, fps: 24, res: 0.4 },
  { count: 24, cell: 24, ascii: false, fps: 20, res: 0.33 },
] as const;

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const rgb = () => (css("--smoke-rgb") || "120 108 92").split(/\s+/).join(", ");

// S6: ahorro de datos → Q0 (solo L0). No hay API tipada para `connection`,
// así que se lee con un cast estrecho y se acepta la ausencia.
const wantsDataSaving = () =>
  matchMedia("(prefers-reduced-data: reduce)").matches ||
  Boolean((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData);

function makeSprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
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
  const x = c.getContext("2d")!;
  x.font = `${cell - 2}px ui-monospace, "DejaVu Sans Mono", monospace`;
  x.textBaseline = "top";
  x.fillStyle = `rgb(${color})`;
  ASCII_RAMP.forEach((ch, i) => {
    x.fillText(ch, i * cell, 0);
  });
  return c;
}

export function SmokeCanvas() {
  const fx = useFx();
  const host = useRef<HTMLDivElement>(null);
  const softRef = useRef<HTMLCanvasElement>(null);
  const asciiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current,
      soft = softRef.current,
      asc = asciiRef.current;
    if (!el || !soft || !asc || fx === "off") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // S6: Q0 = solo L0. Sin canvas ni rAF cuando el usuario ahorra datos.
    if (wantsDataSaving()) return;
    const sx = soft.getContext("2d")!,
      ax = asc.getContext("2d")!;
    // S6: nivel inicial por ancho; en equipos de pocos hilos no se arranca en Q3.
    let tier = innerWidth < 768 ? 2 : innerWidth < 1200 ? 1 : 0;
    if ((navigator.hardwareConcurrency || 8) <= 4) tier = Math.max(tier, 1);
    let W = innerWidth,
      H = innerHeight,
      raf = 0,
      last = 0,
      lastAscii = 0,
      ema = 16,
      badSince = 0;
    let state = createSmoke({
      width: W,
      height: H,
      pad: PAD,
      count: TIERS[tier].count,
      cell: TIERS[tier].cell,
      seed: 20260929,
    });
    let sprite = makeSprite(rgb()),
      atlas = makeAtlas(rgb(), TIERS[tier].cell),
      k = parseFloat(css("--smoke-k")) || 0.02;
    // S5: fundido de tema. `prev*` conserva el material viejo durante 400 ms y
    // el alfa se reparte de forma complementaria entre las dos pasadas.
    let prevSprite = sprite,
      prevAtlas = atlas,
      prevK = k,
      fadeT0 = 0,
      fading = false;
    // S2(b)/S5: gancho de medición solo-lectura (coste 0 en reposo).
    // S7: `frameId` + `lastFrameCostMs` permiten a `smoke-bench` muestrear el
    // coste propio de cada fotograma del humo sin instrumentar el bucle.
    let frameId = 0,
      lastFrameCostMs = 0;
    const hook = {
      get tier() {
        return tier;
      },
      get emaMs() {
        return ema;
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
      const r = TIERS[tier].res;
      soft.width = Math.ceil((W + 2 * PAD) * r);
      soft.height = Math.ceil((H + 2 * PAD) * r);
      sx.setTransform(r, 0, 0, r, 0, 0);
      asc.width = W;
      asc.height = H;
    };
    // S2(a): data-smoke-tier legible para tests (requisito S6).
    const rebuild = () => {
      state = createSmoke({
        ...state.cfg,
        width: W,
        height: H,
        count: TIERS[tier].count,
        cell: TIERS[tier].cell,
      });
      atlas = makeAtlas(rgb(), TIERS[tier].cell);
      size();
      el.dataset.smokeTier = String(tier);
    };

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
      const c = TIERS[tier].cell,
        cy = state.cellY;
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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const step = 1000 / TIERS[tier].fps;
      if (now - last < step) return;
      const dt = Math.min((now - (last || now - step)) / 1000, 0.1);
      last = now;
      const t0 = performance.now();
      stepSmoke(state, dt);
      const fade = fading ? Math.min(1, (now - fadeT0) / THEME_FADE_MS) : 1;
      sx.clearRect(0, 0, W + 2 * PAD, H + 2 * PAD);
      if (fading && fade < 1) drawSoft(prevSprite, prevK, 1 - fade);
      drawSoft(sprite, k, fading ? fade : 1);
      sx.globalAlpha = 1;
      if (TIERS[tier].ascii && now - lastAscii > 100) {
        lastAscii = now;
        if (fading && fade < 1) {
          drawAscii(prevAtlas, 1 - fade, true);
          drawAscii(atlas, fade, false);
        } else drawAscii(atlas, 1, true);
      }
      if (fading && fade >= 1) {
        fading = false;
        prevSprite = sprite;
        prevAtlas = atlas;
        prevK = k;
      }
      lastFrameCostMs = performance.now() - t0;
      frameId++;
      ema = ema * 0.95 + lastFrameCostMs * 0.05;
      // S6: degradación sostenida. Solo se baja de nivel si el coste propio
      // supera 24 ms durante 2 s seguidos; nunca se vuelve a subir en la sesión.
      if (ema > 24) {
        if (badSince === 0) badSince = now;
      } else badSince = 0;
      if (badSince !== 0 && now - badSince > 2000 && tier < 2) {
        tier++;
        rebuild();
        ema = 8;
        badSince = 0;
      }
    };

    const onResize = () => {
      if (innerWidth === W && Math.abs(innerHeight - H) / H < 0.25) return;
      W = innerWidth;
      H = innerHeight;
      rebuild();
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!document.hidden) {
        last = 0;
        badSince = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    // S10→S5: el cambio de tema conserva el material viejo y funde al nuevo en
    // 400 ms (dos pasadas de alfa complementaria), sin reconstrucción brusca.
    const mo = new MutationObserver(() => {
      prevSprite = sprite;
      prevAtlas = atlas;
      prevK = k;
      sprite = makeSprite(rgb());
      atlas = makeAtlas(rgb(), TIERS[tier].cell);
      k = parseFloat(css("--smoke-k")) || k;
      fadeT0 = performance.now();
      fading = true;
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onScroll = () => {
      el.style.transform = `translate3d(0, ${Math.min(8, scrollY * 0.01)}px, 0)`;
    };
    size();
    el.dataset.smokeTier = String(tier);
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    addEventListener("scroll", onScroll, { passive: true });
    el.dataset.ready = "true";
    onVis();
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("scroll", onScroll);
      el.dataset.ready = "false";
    };
  }, [fx]);

  return (
    <div
      ref={host}
      aria-hidden
      data-smoke-tier=""
      className="smoke-layer"
      style={{ ["--smoke-pad" as string]: `${PAD}px` }}
    >
      <canvas ref={softRef} className="smoke-soft" />
      <canvas ref={asciiRef} className="smoke-ascii" />
    </div>
  );
}
