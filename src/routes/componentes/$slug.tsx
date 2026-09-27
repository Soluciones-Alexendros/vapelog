import { createFileRoute } from "@tanstack/react-router";
import { PartSheet } from "@/components/sheets";

export const Route = createFileRoute("/componentes/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <PartSheet slug={slug} />;
}
