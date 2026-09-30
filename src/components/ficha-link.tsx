import { Link, useNavigate } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import type { Domain } from "@/data/types";
import { getFxMode } from "@/lib/fx";
import { puff } from "@/lib/smoke/emit-bus";
import { startViewTransition, supportsViewTransitions } from "@/lib/view-transition";

/**
 * Enlace a ficha con `preload="intent"` y transición de foto (F4 + F7, N6).
 *
 * Envuelve la navegación en `document.startViewTransition` cuando hay
 * soporte, fx on y no hay `prefers-reduced-motion`; si no, navegación
 * normal (el router además lleva `defaultViewTransition` sincronizado con
 * fx en `src/router.tsx`). El nombre compartido de la foto lo pone
 * `ProductPhoto` vía `transitionNameForPhoto` (listado y hero usan el mismo
 * nombre por slug), aquí solo se conserva el envoltorio.
 * Respeta apertura en pestaña nueva (modificadores / botón no principal).
 *
 * N6 — puff de humo al navegar: una bocanada en la posición del clic vía el
 * `emit-bus` existente (el modelo ya acota a EMIT_MAX = 3 activas con FIFO y
 * el bus a MAX_PENDING = 3 encoladas). Degradación:
 * - sin API ViewTransitions → navegación normal (el puff se intenta igual;
 *   es no-op si el lienzo no está montado);
 * - Save-Data / `prefers-reduced-data` → el lienzo no se monta y el puff es
 *   no-op; la transición de `root` es solo fundido de opacidad por el
 *   override que instala `src/router.tsx` (sin blur);
 * - reduced-motion o fx off → ni transición manual ni puff.
 */
function useFichaClick(
  domain: Domain,
  slug: string,
  onNavigate?: () => void,
): (event: MouseEvent<HTMLAnchorElement>) => void {
  const navigate = useNavigate();
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    const fxOn = getFxMode() === "animated";
    if (fxOn) {
      // Coordenadas de viewport, como las volutas ambientales del modelo.
      puff(event.clientX, event.clientY);
    }
    if (!fxOn || !supportsViewTransitions()) {
      onNavigate?.();
      return;
    }
    event.preventDefault();
    startViewTransition(() => {
      // `viewTransition: false`: la transición exterior manual ya cubre el
      // cambio (incluido el nombre compartido de foto); así el router con
      // `defaultViewTransition: true` no anida un segundo startViewTransition
      // dentro del callback de actualización.
      const opts = { viewTransition: false as const };
      if (domain === "device")
        void navigate({ to: "/dispositivos/$slug", params: { slug }, ...opts });
      else if (domain === "coil")
        void navigate({ to: "/resistencias/$slug", params: { slug }, ...opts });
      else if (domain === "part")
        void navigate({ to: "/componentes/$slug", params: { slug }, ...opts });
      else void navigate({ to: "/liquidos/$slug", params: { slug }, ...opts });
      onNavigate?.();
    });
  };
}

export function FichaLink({
  domain,
  slug,
  className,
  children,
  onNavigate,
}: {
  domain: Domain;
  slug: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const onClick = useFichaClick(domain, slug, onNavigate);
  if (domain === "device") {
    return (
      <Link
        to="/dispositivos/$slug"
        params={{ slug }}
        preload="intent"
        onClick={onClick}
        className={className}
      >
        {children}
      </Link>
    );
  }
  if (domain === "coil") {
    return (
      <Link
        to="/resistencias/$slug"
        params={{ slug }}
        preload="intent"
        onClick={onClick}
        className={className}
      >
        {children}
      </Link>
    );
  }
  if (domain === "part") {
    return (
      <Link
        to="/componentes/$slug"
        params={{ slug }}
        preload="intent"
        onClick={onClick}
        className={className}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/liquidos/$slug"
      params={{ slug }}
      preload="intent"
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}
