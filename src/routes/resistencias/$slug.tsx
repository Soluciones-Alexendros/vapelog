import { createFileRoute, notFound } from "@tanstack/react-router";
import { CoilSheet } from "@/components/sheets";
import { coilBySlug } from "@/data/catalog";

export const Route = createFileRoute("/resistencias/$slug")({
  beforeLoad: ({ params }) => {
    if (!coilBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${coilBySlug(params.slug)?.name ?? "Ficha"} — Vapelog` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <CoilSheet slug={slug} />;
}
