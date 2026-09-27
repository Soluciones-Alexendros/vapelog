import { createFileRoute } from "@tanstack/react-router";
import { DeviceSheet } from "@/components/sheets";

export const Route = createFileRoute("/dispositivos/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <DeviceSheet slug={slug} />;
}
