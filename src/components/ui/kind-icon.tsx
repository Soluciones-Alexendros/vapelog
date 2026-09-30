import { cn } from "@/lib/cn";
import type { Kind } from "@/lib/kind";

function pathsFor(kind: Kind): React.ReactNode {
  switch (kind) {
    case "dispositivo":
      return (
        <>
          <path d="M6 1.5h4v2.5h1v9.5H5V4h1z" />
          <line x1="5" y1="6.5" x2="11" y2="6.5" />
        </>
      );
    case "resistencia":
      return (
        <>
          <ellipse cx="8" cy="3.5" rx="3.5" ry="1.5" />
          <path d="M4.5 3.5v9c0 .8 1.6 1.5 3.5 1.5s3.5-.7 3.5-1.5v-9" />
          <path d="M4.5 7.5c0 .8 1.6 1.5 3.5 1.5s3.5-.7 3.5-1.5" />
        </>
      );
    case "liquido":
      return <path d="M8 1.5S3.8 7 3.8 10a4.2 4.2 0 0 0 8.4 0C12.2 7 8 1.5 8 1.5z" />;
    case "componente":
      return (
        <>
          <rect x="2" y="5" width="9" height="6" />
          <line x1="11" y1="7" x2="14" y2="7" />
          <line x1="11" y1="9" x2="14" y2="9" />
          <path d="M7 6.2 5.8 8.4h1.9L6.6 10.6" />
        </>
      );
  }
}

export function KindIcon({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={cn("inline-block size-4 align-[-0.125em]", className)}
    >
      {pathsFor(kind)}
    </svg>
  );
}
