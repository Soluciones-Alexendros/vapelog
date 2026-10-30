import { Link, useNavigate } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import type { Domain } from "@/data/types";
import { startViewTransition, supportsViewTransitions } from "@/lib/view-transition";

/**
 * Enlace a ficha con `preload="intent"` y transición de foto cuando el
 * navegador soporta View Transitions y no hay reduced-motion.
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
