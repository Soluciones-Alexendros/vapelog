import { createFileRoute, notFound } from "@tanstack/react-router";
import { PartSheet } from "@/components/sheets";
import { partBySlug } from "@/data/catalog";

export const Route = createFileRoute("/componentes/$slug")({
  beforeLoad: ({ params }) => {
    if (!partBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${partBySlug(params.slug)?.name ?? "Ficha"} — Vapelog` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <PartSheet slug={slug} />;
}
