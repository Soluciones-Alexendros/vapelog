import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function Carousel({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync]);

  const nudge = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.8, 260),
      behavior: "smooth",
    });
  };

  const overflow = !(atStart && atEnd);

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={trackRef}
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {children}
      </ul>
      {overflow ? (
        <div className="mt-1 flex justify-end gap-1">
          <Button
            type="button"
            variant="quiet"
            className="px-2"
            aria-label="Desplazar a la izquierda"
            disabled={atStart}
            onClick={() => nudge(-1)}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button
            type="button"
            variant="quiet"
            className="px-2"
            aria-label="Desplazar a la derecha"
            disabled={atEnd}
            onClick={() => nudge(1)}
          >
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
