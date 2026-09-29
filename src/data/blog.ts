import type { SourceRef } from "./types";

export type BlogCategory = "opinion" | "estudio";

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  summary: string;
  date: string;
  author: string;
  tags: string[];
  sources?: SourceRef[];
  body: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "ejemplo-por-que-citamos-la-fuente",
    title: "Por qué cada ficha cita la fuente",
    category: "opinion",
    summary:
      "Artículo de ejemplo. Explica, en tono de opinión, por qué Vapelog prefiere una casilla vacía a un dato inventado.",
    date: "2026-02-03",
    author: "Redacción Vapelog",
    tags: ["metodología", "fuentes", "ejemplo"],
    body: `Este es un artículo de ejemplo, no una pieza publicada. Sirve para comprobar que la sección de blog renderiza categoría, fecha, autor, etiquetas, fuentes y cuerpo sin depender de contenido real.

Una ficha que no cita de dónde sale un número es una ficha que no se puede auditar. Cuando el fabricante y el distribuidor dicen cosas distintas, el archivo lo cuenta en lugar de elegir en silencio.

La regla es simple: si la fuente no publica el dato, la casilla queda como «Sin dato publicado». Rellenarla con una estimación razonable convertiría el catálogo en una opinión disfrazada de referencia.

Este texto es solo un marcador de posición. Se sustituirá por contenido editorial cuando la sección deje de ser infraestructura.`,
  },
  {
    slug: "ejemplo-ohmios-vatios-y-margen",
    title: "Ohmios, vatios y el margen que no se ve",
    category: "estudio",
    summary:
      "Artículo de ejemplo. Repasa cómo se relacionan la resistencia, la potencia recomendada y el techo del dispositivo.",
    date: "2026-02-17",
    author: "Redacción Vapelog",
    tags: ["cálculo", "compatibilidad", "ejemplo"],
    sources: [
      {
        label: "Fuente de ejemplo (documentación, no real)",
        url: "https://example.com/ejemplo-fuente",
      },
    ],
    body: `Este es un artículo de ejemplo de la categoría «estudio». No contiene hallazgos reales: su único fin es probar la maquetación de la página de detalle.

El cruce entre una resistencia y un dispositivo no termina cuando la rosca encaja. El vatio mínimo de la coil puede superar el máximo del aparato, y entonces el resultado es «no» aunque la cápsula entre.

La ventana eléctrica manda. Un margen amplio en el papel se estrecha cuando la batería cae, la resistencia envejece o el chipset limita la tensión de salida.

Las referencias de este artículo son deliberadamente ficticias y apuntan a un dominio reservado para ejemplos. Se reemplazarán por citas verificables cuando se publique contenido real.`,
  },
];

export function postBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function categoryLabel(category: BlogCategory): string {
  return category === "opinion" ? "Opinión" : "Estudio";
}

export function postsByCategory(category: BlogCategory): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
