import { createFileRoute, notFound } from "@tanstack/react-router";
import { DeviceSheet } from "@/components/sheets";
import { deviceBySlug } from "@/data/catalog";

export const Route = createFileRoute("/dispositivos/$slug")({
  beforeLoad: ({ params }) => {
    if (!deviceBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${deviceBySlug(params.slug)?.name ?? "Ficha"} — Vapelog` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <DeviceSheet slug={slug} />;
}
