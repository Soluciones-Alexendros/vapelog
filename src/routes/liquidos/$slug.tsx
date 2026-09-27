import { createFileRoute } from "@tanstack/react-router";
import { LiquidSheet } from "@/components/sheets";

export const Route = createFileRoute("/liquidos/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <LiquidSheet slug={slug} />;
}
