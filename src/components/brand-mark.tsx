import { useEffect, useState } from "react";
import { useFx } from "@/lib/fx";

const WORDMARK_D =
  "M14.41 31L8.26 31L2.41 14.49L8.07 14.49L11.38 25.53L11.48 25.53L14.82 14.49L20.24 14.49M27.98 18.04Q30.88 18.04 32.70 19.01Q34.53 19.98 34.53 22.17L34.53 27.11Q34.53 27.52 34.72 27.78Q34.91 28.05 35.30 28.05L36.16 28.05L36.16 30.81Q36.09 30.86 35.79 30.96Q35.49 31.07 34.94 31.18Q34.38 31.29 33.66 31.29Q32.27 31.29 31.37 30.87Q30.47 30.45 30.14 29.70Q29.22 30.42 28.10 30.86Q26.97 31.29 25.46 31.29Q20.99 31.29 20.99 27.74Q20.99 25.89 21.99 24.92Q22.98 23.94 24.86 23.58Q26.73 23.22 29.75 23.22L29.75 22.60Q29.75 21.86 29.24 21.47Q28.72 21.09 27.90 21.09Q27.16 21.09 26.62 21.35Q26.08 21.62 26.08 22.19L26.08 22.29L21.38 22.29Q21.35 22.17 21.35 21.95Q21.35 20.15 23.07 19.10Q24.78 18.04 27.98 18.04M29.75 25.48Q27.71 25.48 26.74 25.92Q25.77 26.37 25.77 27.11Q25.77 28.31 27.40 28.31Q28.34 28.31 29.04 27.81Q29.75 27.30 29.75 26.56M45.67 18.04Q48.24 18.04 49.63 19.72Q51.02 21.40 51.02 24.69Q51.02 27.95 49.63 29.62Q48.24 31.29 45.67 31.29Q43.46 31.29 42.12 29.85L42.12 35.73L37.34 35.73L37.34 18.33L41.23 18.33L41.64 20.13Q43.03 18.04 45.67 18.04M44.18 21.57Q43.13 21.57 42.60 22.31Q42.07 23.06 42.07 24.26L42.07 25.05Q42.07 26.25 42.60 27Q43.13 27.76 44.18 27.76Q46.25 27.76 46.25 25.29L46.25 24.02Q46.25 21.57 44.18 21.57M59.48 18.04Q62.96 18.04 64.80 19.67Q66.63 21.30 66.63 24.66L66.63 25.48L57.13 25.48Q57.13 26.85 57.74 27.54Q58.35 28.24 59.67 28.24Q60.87 28.24 61.44 27.74Q62 27.23 62 26.39L66.63 26.39Q66.63 28.70 64.88 29.99Q63.13 31.29 59.77 31.29Q56.24 31.29 54.30 29.64Q52.35 28 52.35 24.66Q52.35 21.40 54.25 19.72Q56.14 18.04 59.48 18.04M59.67 21.09Q57.42 21.09 57.15 23.22L61.81 23.22Q61.81 22.24 61.24 21.66Q60.68 21.09 59.67 21.09M73.48 31L68.70 31L68.70 13.60L73.48 13.60M82.68 18.04Q86.02 18.04 87.92 19.73Q89.83 21.42 89.83 24.66Q89.83 27.90 87.92 29.60Q86.02 31.29 82.68 31.29Q79.34 31.29 77.45 29.61Q75.55 27.93 75.55 24.66Q75.55 21.40 77.45 19.72Q79.34 18.04 82.68 18.04M82.68 21.28Q80.33 21.28 80.33 23.99L80.33 25.36Q80.33 28.05 82.68 28.05Q85.06 28.05 85.06 25.36L85.06 23.99Q85.06 21.28 82.68 21.28M105.99 15.95Q105.99 17.42 105.26 18.21Q104.53 19 103.06 19.38Q103.76 19.91 104.16 20.62Q104.55 21.33 104.55 22.12Q104.55 24.14 103.03 25.17Q101.50 26.20 99.22 26.20L97.40 26.20Q95.89 26.20 95.89 26.90Q95.89 27.23 96.22 27.44Q96.56 27.64 97.40 27.64L101.72 27.64Q103.83 27.64 104.91 28.74Q105.99 29.85 105.99 31.70Q105.99 33.06 105.27 34.05Q104.55 35.03 103.33 35.54Q102.10 36.04 100.66 36.04L93.61 36.04Q92.74 36.04 92.01 35.63Q91.28 35.22 90.85 34.52Q90.42 33.81 90.42 32.94Q90.42 32.01 90.99 31.25Q91.57 30.50 92.43 30.11Q91.86 29.70 91.52 29.13Q91.18 28.55 91.18 27.88Q91.18 26.94 91.88 26.19Q92.58 25.43 93.61 25.17Q92.67 24.57 92.12 23.79Q91.57 23.01 91.57 22.14Q91.57 19.94 93.36 18.99Q95.14 18.04 98.10 18.04Q99.39 18.04 100.18 18.18Q101.36 17.44 101.71 16.83Q102.06 16.22 102.06 15.95L105.99 15.95M98.05 20.54Q97.26 20.54 96.75 20.94Q96.25 21.35 96.25 22.12Q96.25 22.91 96.72 23.31Q97.18 23.70 98.05 23.70Q98.91 23.70 99.40 23.31Q99.90 22.91 99.90 22.12Q99.90 21.33 99.40 20.93Q98.91 20.54 98.05 20.54M96.20 31Q95.65 31 95.30 31.30Q94.95 31.60 94.95 32.15Q94.95 32.70 95.31 33.04Q95.67 33.38 96.20 33.38L99.94 33.38Q100.47 33.38 100.84 33.05Q101.22 32.73 101.22 32.18Q101.22 31.62 100.86 31.31Q100.50 31 99.94 31";
const WORD_VOL = "M69.5 10 h9.6 v-8 h-7.2 v4 h3.6";
const MARK_V = "M5 5 L12 18.5 L19 5";
const MARK_VOL = "M12 22 H25 V13.5 H20.2 V17.5 H22.6";

const BRAND_CSS = `.brand-voluta{stroke-dasharray:1;stroke-dashoffset:0;transform-box:fill-box}
@keyframes voluta-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes voluta-exhale{0%{transform:translateY(0);opacity:1}45%{transform:translateY(-3px);opacity:.15}46%{transform:translateY(3px)}100%{transform:translateY(0);opacity:1}}
.brand-voluta[data-draw="true"]{animation:voluta-draw .9s ease-out both}
.brand-link:is(:hover,:focus-visible) .brand-voluta{animation:voluta-exhale .6s ease-out}
@media (prefers-reduced-motion:reduce){.brand-voluta{animation:none!important}}
.bm-sh{fill:#ffc400}.bm-bd{fill:#111111}.bm-v{stroke:#faf7ec}.bm-vo{stroke:var(--logo-accent,#ffc400)}
.dark .bm-sh{fill:#ffb113}.dark .bm-bd{fill:#f3efe4}.dark .bm-v{stroke:#0d0c0a}`;

const DRAWN_KEY = "vapelog-brand-drawn";

function useBrandDraw(): boolean {
  const fx = useFx();
  const [draw, setDraw] = useState(false);
  useEffect(() => {
    if (fx !== "animated") return;
    try {
      if (sessionStorage.getItem(DRAWN_KEY)) return;
      sessionStorage.setItem(DRAWN_KEY, "1");
    } catch {
      /* sin sessionStorage: se anima una vez por montaje */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraw(true);
  }, [fx]);
  return draw;
}

export function BrandLogo({ className }: { className?: string }) {
  const draw = useBrandDraw();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 110 36"
      role="img"
      aria-label="Vapelog"
      className={className ? `brand-logo ${className}` : "brand-logo"}
    >
      <style>{BRAND_CSS}</style>
      <title>Vapelog</title>
      <path d={WORDMARK_D} fill="currentColor" />
      <path
        d={WORD_VOL}
        className="brand-voluta"
        pathLength={1}
        data-draw={draw ? "true" : "false"}
        fill="none"
        stroke="var(--logo-accent, #ffc400)"
        strokeWidth={2.6}
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      role="img"
      aria-label="Vapelog"
      className={className ? `brand-mark ${className}` : "brand-mark"}
    >
      <style>{BRAND_CSS}</style>
      <title>Vapelog</title>
      <rect className="bm-sh" x={4} y={4} width={28} height={28} />
      <rect className="bm-bd" width={28} height={28} />
      <path
        className="bm-v"
        d={MARK_V}
        fill="none"
        strokeWidth={3.8}
        strokeLinejoin="miter"
        strokeMiterlimit={6}
      />
      <path
        className="bm-vo"
        d={MARK_VOL}
        fill="none"
        strokeWidth={2.3}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  );
}
