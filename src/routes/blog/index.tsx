import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts, categoryLabel, formatPostDate } from "@/data/blog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Vapelog" },
      {
        name: "description",
        content:
          "Artículos de opinión y estudios sobre dispositivos, resistencias y líquidos de vapeo, con las fuentes a la vista.",
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Publicaciones</p>
      <h1 className="mt-3 text-4xl text-foreground sm:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Opinión y estudio del archivo. Cada pieza cita lo que se puede comprobar y marca lo que no.
        Los artículos publicados ahora son ejemplos de infraestructura.
      </p>

      <ul className="mt-10 flex flex-col gap-4">
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <article className="rounded-md border border-border bg-card p-5 transition-colors hover:border-primary">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="muted">{categoryLabel(post.category)}</Badge>
                <time
                  dateTime={post.date}
                  className="text-xs tracking-widest text-muted-foreground uppercase tabular-nums"
                >
                  {formatPostDate(post.date)}
                </time>
              </div>
              <h2 className="mt-3 text-2xl text-foreground">
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="decoration-border underline-offset-4 hover:text-primary hover:underline"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.summary}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
