import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { categoryLabel, formatPostDate, postBySlug } from "@/data/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    if (!postBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${postBySlug(params.slug)?.title ?? "Artículo"} — Vapelog` }],
  }),
  component: Page,
  notFoundComponent: NotFound,
});

function Page() {
  const { slug } = Route.useParams();
  const post = postBySlug(slug);
  if (!post) return <NotFound />;

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <nav aria-label="Migas de pan" className="text-sm text-muted-foreground">
        <Link to="/blog" className="min-h-11 underline decoration-border underline-offset-4">
          Blog
        </Link>
      </nav>

      <p className="mt-6 text-xs font-medium tracking-widest text-primary uppercase">
        {categoryLabel(post.category)}
      </p>
      <h1 className="mt-3 text-4xl text-foreground sm:text-5xl">{post.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Badge variant="muted">{categoryLabel(post.category)}</Badge>
        <time dateTime={post.date} className="tabular-nums">
          {formatPostDate(post.date)}
        </time>
        <span>{post.author}</span>
      </div>

      {post.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 text-base text-foreground">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {post.sources && post.sources.length > 0 ? (
        <section className="mt-12 border-t border-border pt-6">
          <h2 className="text-2xl text-foreground">Fuentes</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {post.sources.map((source) => (
              <li key={source.url}>
                <ExternalLink
                  href={source.url}
                  className="text-sm break-all text-foreground underline decoration-border underline-offset-4"
                >
                  {source.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12">
        <Link
          to="/blog"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline decoration-border underline-offset-4"
        >
          Volver al blog
        </Link>
      </p>
    </article>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Blog</p>
      <h1 className="mt-3 text-4xl text-foreground">Ese artículo no está</h1>
      <p className="mt-3 text-muted-foreground">
        El blog no tiene ninguna pieza con ese identificador.
      </p>
      <Button asChild variant="secondary" className="mt-6">
        <Link to="/blog">Volver al blog</Link>
      </Button>
    </div>
  );
}
