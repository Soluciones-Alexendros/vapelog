import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { AppNotFound } from "@/lib/not-found";
import { getFxPreference, subscribeFx } from "@/lib/fx";
import { wantsReducedData } from "@/lib/smoke/emit-bus";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFound,
    // N6 — verificado en tipos: `defaultViewTransition?: boolean |
    // ViewTransitionOptions` existe en `@tanstack/router-core@1.171.33`
    // (`router.d.ts:156`, dependencia de `@tanstack/react-router@1.170.40`).
    // Sin soporte del navegador la opción se ignora (navegación normal).
    // El nombre compartido de foto lo sigue poniendo `FichaLink` + la
    // transición manual exterior; sus `navigate()` internos llevan
    // `viewTransition: false` para no anidar transiciones.
    defaultViewTransition: true,
  });
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    syncViewTransitionWithFx(router);
    installSaveDataFade();
  }
  return router;
}

/**
 * N6 — el conmutador `vapelog-fx` apaga TODO efecto (regla dura 5): con fx
 * off el router no envuelve en `startViewTransition` (navegación normal y sin
 * puff; el puff lo evita además `FichaLink`). `startViewTransition` del
 * router lee `options.defaultViewTransition` en cada navegación, así que
 * mutar la opción en vivo es suficiente; se re-sincroniza al cambiar fx
 * (misma pestaña vía `subscribeFx`, otras vía evento `storage`).
 */
function syncViewTransitionWithFx(router: { options: { defaultViewTransition?: unknown } }): void {
  const apply = () => {
    router.options.defaultViewTransition = getFxPreference() === "on";
  };
  apply();
  subscribeFx(apply);
}

let saveDataFadeInstalled = false;

/**
 * N6 — degradación Save-Data / `prefers-reduced-data`: la transición de
 * `root` pasa a solo fundido de opacidad (200 ms = `--dur-2`), sin el
 * `blur(14px/12px)` de `vapor-out/in`. Se inyecta un `<style>` posterior a
 * `styles.css` (NO se edita `styles.css` por contrato) y SIN `!important`
 * para que el `animation: none !important` de `prefers-reduced-motion`
 * siga ganando. Solo se instala con ahorro de datos y sin reduced-motion.
 */
function installSaveDataFade(): void {
  if (saveDataFadeInstalled) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!wantsReducedData()) return;
  saveDataFadeInstalled = true;
  const style = document.createElement("style");
  style.id = "vapelog-vt-save-data";
  style.textContent = [
    "::view-transition-old(root) { animation: vapelog-fade-out var(--dur-2, 200ms) ease-out both; }",
    "::view-transition-new(root) { animation: vapelog-fade-in var(--dur-2, 200ms) ease-out both; }",
    "@keyframes vapelog-fade-out { to { opacity: 0; } }",
    "@keyframes vapelog-fade-in { from { opacity: 0; } }",
  ].join("\n");
  document.head.appendChild(style);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
