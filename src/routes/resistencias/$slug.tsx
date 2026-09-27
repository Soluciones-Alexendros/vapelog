import { createFileRoute } from "@tanstack/react-router";
import { CoilSheet } from "@/components/sheets";

export const Route = createFileRoute("/resistencias/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <CoilSheet slug={slug} />;
}
