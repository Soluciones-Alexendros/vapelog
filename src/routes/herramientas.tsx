import { createFileRoute } from "@tanstack/react-router";
import { parseToolSearch, ToolsPanel } from "@/components/tools-panel";

export const Route = createFileRoute("/herramientas")({
  validateSearch: (search) => parseToolSearch(search as Record<string, unknown>),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ToolsPanel
      search={search}
      onSearch={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
