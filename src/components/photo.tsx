import { catalogImage } from "@/data/images";

const frames = {
  card: "aspect-square w-full",
  hero: "mx-auto aspect-square w-full max-w-md",
  row: "size-20 shrink-0",
  thumb: "size-12 shrink-0",
} as const;

export function ProductPhoto({
  slug,
  alt,
  frame = "card",
  missing = "hide",
}: {
  slug: string;
  alt: string;
  frame?: keyof typeof frames;
  missing?: "hide" | "note";
}) {
  const src = catalogImage(slug);
  if (!src) {
    if (missing === "hide") return null;
    return (
      <div
        className={`${frames[frame]} grid place-items-center rounded-md bg-background px-2 text-center outline outline-1 -outline-offset-1 outline-foreground/15`}
      >
        <p className="text-xs leading-tight text-muted-foreground">
          {frame === "thumb" || frame === "row" ? "Sin foto" : "Sin foto de fabricante"}
        </p>
      </div>
    );
  }
  return (
    <div
      className={`${frames[frame]} overflow-hidden rounded-md bg-background outline outline-1 -outline-offset-1 outline-foreground/15`}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        loading={frame === "hero" ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
