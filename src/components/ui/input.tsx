import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn("rounded-sm border border-border bg-background", className)}
      {...props}
    />
  );
}

export { Input };
