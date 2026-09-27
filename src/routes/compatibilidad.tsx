import { createFileRoute } from "@tanstack/react-router";
import { CompatLab, parseCompatSearch } from "@/components/compat-lab";

export const Route = createFileRoute("/compatibilidad")({
  validateSearch: (search) => parseCompatSearch(search as Record<string, unknown>),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CompatLab
      search={search}
      onSearch={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
