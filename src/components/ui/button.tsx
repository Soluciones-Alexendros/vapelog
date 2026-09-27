import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-transparent px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 ease-out disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-border bg-card text-foreground hover:border-primary",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        quiet: "bg-transparent px-3 text-muted-foreground hover:bg-muted hover:text-foreground",
        active: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, className }))} {...props} />
  );
}

export { Button, buttonVariants };
