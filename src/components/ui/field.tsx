import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export function Field({
  id,
  label,
  children,
  help,
  unit,
  error,
  optional,
  disabledReason,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  help?: string;
  unit?: string;
  error?: string;
  optional?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("block", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {unit ? (
            <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
              ({unit})
            </span>
          ) : null}
          {optional ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">opcional</span>
          ) : (
            <span className="sr-only">, obligatorio</span>
          )}
        </Label>
      </div>
      {help ? (
        <p id={helpId} className="mt-1 text-sm text-muted-foreground">
          {help}
        </p>
      ) : null}
      <div className="mt-2" data-describedby={describedBy}>
        {children}
      </div>
      {disabledReason ? (
        <p className="mt-1 text-sm text-muted-foreground">{disabledReason}</p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
