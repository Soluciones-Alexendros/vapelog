import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { ToolsPanel } from "@/components/tools-panel";
import { parseToolSearch } from "@/components/tool-search";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/herramientas")({
  validateSearch: (search) => parseToolSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Herramientas — Vapelog",
      description:
        "Calculadoras de ohmios, vatios y nicokits: prepara una mezcla o comprueba la ventana eléctrica de una resistencia con los datos de su ficha.",
      path: "/herramientas",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
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
