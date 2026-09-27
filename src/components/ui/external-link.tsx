import type { ComponentProps } from "react";

function ExternalLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> (se abre en una ventana nueva)</span>
    </a>
  );
}

export { ExternalLink };
