import { createFileRoute, notFound } from "@tanstack/react-router";
import { LiquidSheet } from "@/components/sheets";
import { liquidBySlug } from "@/data/catalog";

export const Route = createFileRoute("/liquidos/$slug")({
  beforeLoad: ({ params }) => {
    if (!liquidBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${liquidBySlug(params.slug)?.name ?? "Ficha"} — Vapelog` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <LiquidSheet slug={slug} />;
}
