import { Link, useNavigate } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import type { Domain } from "@/data/types";
import { startViewTransition, supportsViewTransitions } from "@/lib/view-transition";

/**
 * Enlace a ficha con `preload="intent"` y transición de foto (F4 + F7).
 *
 * Envuelve la navegación en `document.startViewTransition` cuando hay
 * soporte y no hay `prefers-reduced-motion`; si no, navegación normal.
 * Respeta apertura en pestaña nueva (modificadores / botón no principal).
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
    if (!supportsViewTransitions()) {
      onNavigate?.();
      return;
    }
    event.preventDefault();
    startViewTransition(() => {
      if (domain === "device") void navigate({ to: "/dispositivos/$slug", params: { slug } });
      else if (domain === "coil") void navigate({ to: "/resistencias/$slug", params: { slug } });
      else if (domain === "part") void navigate({ to: "/componentes/$slug", params: { slug } });
      else void navigate({ to: "/liquidos/$slug", params: { slug } });
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
