/**
 * Transición listado → ficha con la View Transitions API.
 *
 * - `document.startViewTransition` con fallback a navegación normal.
 * - Se salta la transición con `prefers-reduced-motion`.
 * - El nombre compartido sale de `transitionNameForPhoto` y se aplica en
 *   `ProductPhoto` vía `view-transition-name` (listado y hero de la ficha).
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => unknown;
};

export function supportsViewTransitions(): boolean {
  if (typeof document === "undefined") return false;
  return (
    typeof (document as ViewTransitionDocument).startViewTransition === "function" &&
    !prefersReducedMotion()
  );
}

function sanitizeSlug(slug: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "ficha";
}

export function transitionNameForPhoto(slug: string): string {
  return `vapelog-photo-${sanitizeSlug(slug)}`;
}

export function startViewTransition(update: () => void): void {
  if (typeof document === "undefined") {
    update();
    return;
  }
  if (prefersReducedMotion()) {
    update();
    return;
  }
  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  try {
    doc.startViewTransition(() => {
      update();
    });
  } catch {
    update();
  }
}
