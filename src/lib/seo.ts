import type { MetaDescriptor } from "@tanstack/react-router";

const DEFAULT_SITE_BASE = "https://vapelog-alexendros.vercel.app";

const envSiteUrl: unknown = import.meta.env?.VITE_SITE_URL;

export const SITE_BASE =
  typeof envSiteUrl === "string" && envSiteUrl.length > 0
    ? envSiteUrl.replace(/\/+$/, "")
    : DEFAULT_SITE_BASE;

export const DEFAULT_OG_IMAGE = "/og.jpg";

export interface LinkDescriptor {
  rel: string;
  href: string;
  type?: string;
  media?: string;
  sizes?: string;
}

export interface BuildHeadOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
}

export interface HeadResult {
  meta: MetaDescriptor[];
  links: LinkDescriptor[];
}

export interface ProductJsonLdInput {
  name: string;
  brand?: string;
  category?: string;
  url: string;
  image?: string;
  description?: string;
}

export interface ProductJsonLd {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  url: string;
  brand?: { "@type": "Brand"; name: string };
  category?: string;
  image?: string;
  description?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbListJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function buildHead(opts: BuildHeadOptions): HeadResult {
  const { title, description, path } = opts;
  const type = opts.type ?? "website";
  const url = absoluteUrl(path);
  const image = absoluteUrl(opts.image ?? DEFAULT_OG_IMAGE);

  const meta: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
  ];

  const links: LinkDescriptor[] = [{ rel: "canonical", href: url }];

  return { meta, links };
}

export function productJsonLd(input: ProductJsonLdInput): ProductJsonLd {
  const node: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url: absoluteUrl(input.url),
  };

  if (input.brand) node.brand = { "@type": "Brand", name: input.brand };
  if (input.category) node.category = input.category;
  if (input.image) node.image = absoluteUrl(input.image);
  if (input.description) node.description = input.description;

  return node;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}
