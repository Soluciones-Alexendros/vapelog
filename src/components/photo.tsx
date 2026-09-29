import { productImage } from "@/data/images";

const frames = {
  card: "aspect-square w-full",
  hero: "mx-auto aspect-square w-full max-w-md",
  row: "size-20 shrink-0",
  thumb: "size-12 shrink-0",
} as const;

const sizesByFrame: Record<keyof typeof frames, string> = {
  card: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  hero: "640px",
  row: "96px",
  thumb: "96px",
};

function srcSetFor(variants: { width: number; src: string }[], extension: string): string {
  return variants
    .filter((variant) => variant.src.endsWith(`.${extension}`))
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
}

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
  const image = productImage(slug);
  if (!image) {
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

  const sizes = sizesByFrame[frame];
  const avifSrcSet = srcSetFor(image.variants, "avif");
  const webpSrcSet = srcSetFor(image.variants, "webp");
  const webpVariants = image.variants.filter((variant) => variant.src.endsWith(".webp"));
  const fallback =
    webpVariants[webpVariants.length - 1] ?? image.variants[image.variants.length - 1];
  const fallbackSrc = fallback ? fallback.src : image.original;

  return (
    <div
      className={`${frames[frame]} overflow-hidden rounded-md bg-background outline outline-1 -outline-offset-1 outline-foreground/15`}
    >
      <picture className="block h-full w-full">
        {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} /> : null}
        {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} /> : null}
        <img
          src={fallbackSrc}
          srcSet={webpSrcSet || undefined}
          sizes={webpSrcSet ? sizes : undefined}
          alt={alt}
          width={image.width}
          height={image.height}
          className="h-full w-full object-contain"
          loading={frame === "hero" ? "eager" : "lazy"}
          decoding="async"
        />
      </picture>
    </div>
  );
}
