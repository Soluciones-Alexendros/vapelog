import { cva } from "class-variance-authority";

export const buttonVariants = cva(
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
