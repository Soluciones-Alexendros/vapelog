import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { KIND_LABEL, type Kind } from "@/lib/kind";
import { KindIcon } from "./kind-icon";

export function KindCard({
  kind,
  className,
  children,
}: {
  kind: Kind;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-kind={kind} className={cn("kind-card bg-card text-card-foreground", className)}>
      <span className="kind-led" aria-hidden="true" />
      <p className="p-3 pb-0 font-mono text-xs tracking-widest uppercase">
        <KindIcon kind={kind} /> {KIND_LABEL[kind].short}
        <span className="sr-only"> — {KIND_LABEL[kind].full}</span>
      </p>
      {children}
    </div>
  );
}
