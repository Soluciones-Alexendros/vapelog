import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeading({
  as: Tag = "h1",
  text,
  className,
  children,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={cn("text-foreground", className)}>
      {text}
      {children}
    </Tag>
  );
}
