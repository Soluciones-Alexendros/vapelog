import { createFileRoute } from "@tanstack/react-router";
import { CompareView } from "@/components/compare-view";

export const Route = createFileRoute("/comparar")({
  component: CompareView,
});
