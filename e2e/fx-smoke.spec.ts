import { test, expect, type Page } from "playwright/test";

const PATHS = ["/", "/dispositivos", "/dispositivos/vaporesso-xros-4"] as const;

async function skipAgeGate(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
  });
}

const PAD = 120;

/** Cobertura del viewport (excluye el padding del soft canvas). */
const sample = (page: Page) =>
  page.evaluate((pad) => {
    const c = document.querySelector<HTMLCanvasElement>("canvas[data-fx='smoke-soft']");
    if (!c) return null;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const { width: bw, height: bh } = c;
    if (bw < 2 || bh < 2) return null;
    // soft.width = (W + 2*PAD) * res  →  res = bw / (innerWidth + 2*PAD)
    const res = bw / (window.innerWidth + 2 * pad);
    const x0 = Math.max(0, Math.floor(pad * res));
    const y0 = Math.max(0, Math.floor(pad * res));
    const x1 = Math.min(bw, Math.ceil((pad + window.innerWidth) * res));
    const y1 = Math.min(bh, Math.ceil((pad + window.innerHeight) * res));
    const vw = Math.max(1, x1 - x0);
    const vh = Math.max(1, y1 - y0);
    const d = ctx.getImageData(x0, y0, vw, vh).data;
    let n = 0;
    let sig = 0;
    // Umbral bajo: el soft canvas pinta con alfa ≈ K·env (K≈0.02 → ~5/255).
    let sum = 0;
    for (let i = 3; i < d.length; i += 4) {
      const a = d[i];
      if (a > 1) n++;
      sum += a;
      // Firma densa: incluye posición para detectar deriva entre fotogramas.
      if (i % 64 === 3) sig = (sig * 33 + a + (i % 1021)) >>> 0;
    }
    return { cov: n / (vw * vh), sig, sum, w: vw, h: vh };
  }, PAD);

const fxSnap = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __vapelogFx?: { reason: string; running: boolean } }).__vapelogFx,
  );

test.describe("humo visible", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const path of PATHS) {
    test(`visible y en movimiento en ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await skipAgeGate(page);
      await page.addInitScript(() => localStorage.setItem("vapelog-fx:v2", "on"));
      await page.goto(path);
      await page.waitForSelector('[data-fx-ready="true"]', { state: "attached", timeout: 20_000 });
      await page.waitForTimeout(1500);
      const a = await sample(page);
      await page.waitForTimeout(500);
      const b = await sample(page);
      expect(a).not.toBeNull();
      expect(a!.cov).toBeGreaterThan(0.04);
      expect(a!.cov).toBeLessThan(0.35);
      // Movimiento: firma o suma de alfa cambian entre fotogramas.
      expect(b!.sig !== a!.sig || b!.sum !== a!.sum).toBe(true);
      expect(errors).toEqual([]);
      const snap = await fxSnap(page);
      expect(snap?.reason).toMatch(/^(ok|tier-degraded)$/);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("fotograma estático no vacío", async ({ page }) => {
    await skipAgeGate(page);
    await page.addInitScript(() => localStorage.setItem("vapelog-fx:v2", "auto"));
    await page.goto("/");
    await page.waitForSelector('[data-fx-ready="true"]', { state: "attached", timeout: 20_000 });
    const a = await sample(page);
    await page.waitForTimeout(500);
    const b = await sample(page);
    expect(a).not.toBeNull();
    expect(a!.cov).toBeGreaterThan(0.02);
    expect(b!.sig).toBe(a!.sig);
    expect(
      await page.evaluate(
        () => (window as unknown as { __vapelogFx?: { reason: string } }).__vapelogFx?.reason,
      ),
    ).toBe("reduced-motion");
  });
});

test("desactivado por el usuario", async ({ page }) => {
  await skipAgeGate(page);
  await page.addInitScript(() => localStorage.setItem("vapelog-fx:v2", "off"));
  await page.goto("/");
  await page.waitForTimeout(800);
  const snap = await fxSnap(page);
  expect(snap?.reason).toBe("user-off");
  expect(snap?.running).toBe(false);
});

test("canvas no tapado (stacking)", async ({ page }) => {
  await skipAgeGate(page);
  await page.addInitScript(() => {
    localStorage.setItem("vapelog-fx:v2", "on");
    localStorage.setItem("vapelog-theme", "dark");
  });
  await page.goto("/");
  await page.waitForSelector('[data-fx-ready="true"]', { state: "attached", timeout: 20_000 });
  const stacking = await page.evaluate(() => {
    const layer = document.querySelector<HTMLElement>(".smoke-layer");
    const soft = document.querySelector<HTMLCanvasElement>("canvas[data-fx]");
    if (!layer || !soft) return null;
    const ls = getComputedStyle(layer);
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    return {
      z: ls.zIndex,
      op: ls.opacity,
      bodyBg,
      htmlBg,
      ready: layer.dataset.fxReady,
    };
  });
  expect(stacking).not.toBeNull();
  expect(stacking!.ready).toBe("true");
  expect(Number(stacking!.op)).toBeGreaterThan(0.5);
  // body debe ser transparente (rgba con alpha 0 o "transparent")
  expect(stacking!.bodyBg === "rgba(0, 0, 0, 0)" || stacking!.bodyBg === "transparent").toBe(true);
});
