/** Tipos residuales del blog. Sin artículos: la ruta redirige a `/archivo`. */

export type BlogCategory = "opinion" | "estudio";

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  summary: string;
  date: string;
  author: string;
  tags: string[];
  body: string;
}

export const blogPosts: BlogPost[] = [];

export function postBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function categoryLabel(category: BlogCategory): string {
  return category === "estudio" ? "Estudio" : "Opinión";
}

export function formatPostDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
