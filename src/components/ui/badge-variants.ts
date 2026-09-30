import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex min-h-8 items-center rounded-md px-2 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        muted: "bg-muted text-muted-foreground",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
