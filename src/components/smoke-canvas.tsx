import { useEffect, useRef } from "react";
import { useFx } from "@/lib/fx";

const MAX_FPS = 30;
const FRAME_INTERVAL = 1000 / MAX_FPS;
const RESOLUTION_SCALE = 0.5;
const MIN_PARTICLES = 14;
const MAX_PARTICLES = 28;
const OPACITY_LIGHT = 0.12;
const OPACITY_DARK = 0.16;
const SPRITE_SIZE = 128;
const DEFAULT_RGB_LIGHT: [number, number, number] = [120, 108, 92];
const DEFAULT_RGB_DARK: [number, number, number] = [200, 196, 188];

type Particle = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  pulse: number;
};

function particleCountFor(width: number): number {
  const t = Math.min(1, Math.max(0, (width - 360) / (1280 - 360)));
  return Math.round(MIN_PARTICLES + t * (MAX_PARTICLES - MIN_PARTICLES));
}

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readSmokeRgb(dark: boolean): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--smoke-rgb").trim();
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((value) => Number.isFinite(value))) {
    return [parts[0], parts[1], parts[2]];
  }
  return dark ? DEFAULT_RGB_DARK : DEFAULT_RGB_LIGHT;
}

function makeSprite(rgb: [number, number, number]): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;
  const half = SPRITE_SIZE / 2;
  const [r, g, b] = rgb;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return sprite;
}

function makeParticles(count: number, width: number, height: number): Particle[] {
  const scale = Math.min(1, width / 1280);
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: (48 + Math.random() * 96) * scale,
    vx: (Math.random() - 0.5) * 0.16,
    vy: -(0.03 + Math.random() * 0.09),
    alpha: 0.35 + Math.random() * 0.65,
    pulse: Math.random() * Math.PI * 2,
  }));
}

export function SmokeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fx = useFx();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Sin efectos o con movimiento reducido no se pinta nada; se limpia por si
    // una preferencia previa había dejado un fotograma congelado (con la
    // transformación en identidad para cubrir todo el backing store).
    if (fx === "off" || prefersReducedMotion()) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    let opacity = isDark() ? OPACITY_DARK : OPACITY_LIGHT;
    let sprite = makeSprite(readSmokeRgb(isDark()));
    let particles = makeParticles(particleCountFor(width), width, height);
    let frameId = 0;
    let lastTime = 0;
    let running = false;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = (window.devicePixelRatio || 1) * RESOLUTION_SCALE;
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      particles = makeParticles(particleCountFor(width), width, height);
    };

    const refreshTheme = () => {
      const dark = isDark();
      opacity = dark ? OPACITY_DARK : OPACITY_LIGHT;
      sprite = makeSprite(readSmokeRgb(dark));
    };

    const draw = (now: number) => {
      frameId = window.requestAnimationFrame(draw);
      if (document.hidden) return;
      if (now - lastTime < FRAME_INTERVAL) return;
      lastTime = now;

      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulse += 0.01;
        if (particle.y + particle.radius < 0) {
          particle.y = height + particle.radius;
          particle.x = Math.random() * width;
        }
        if (particle.x + particle.radius < 0) particle.x = width + particle.radius;
        else if (particle.x - particle.radius > width) particle.x = -particle.radius;

        const pulse = 0.75 + 0.25 * Math.sin(particle.pulse);
        const radius = particle.radius * pulse;
        context.globalAlpha = opacity * particle.alpha * pulse;
        context.drawImage(sprite, particle.x - radius, particle.y - radius, radius * 2, radius * 2);
      }
      context.globalAlpha = 1;
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = 0;
      frameId = window.requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frameId);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onResize = () => {
      resize();
      refreshTheme();
    };

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (prefersReducedMotion()) stop();
      else start();
    };

    resize();
    const themeObserver = new MutationObserver(refreshTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    motionMedia.addEventListener("change", onMotionChange);
    if (!document.hidden) start();

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionMedia.removeEventListener("change", onMotionChange);
    };
  }, [fx]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
