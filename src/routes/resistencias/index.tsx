import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/resistencias/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Resistencias — Vapelog",
      description:
        "Resistencias y cápsulas por ohmios, montaje, calada y malla, con la ventana de vatios que recomienda el fabricante.",
      path: "/resistencias",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: CoilsPage,
});

function CoilsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CatalogBrowser
      domain="coil"
      search={search}
      onSearch={(next) => void navigate({ search: next })}
      title="Resistencias"
      lede="El filtro de montaje separa la cápsula con resistencia integrada del cabezal suelto de tanque. Marca, ohmios, calada y malla se suman: las dos condiciones tienen que cumplirse."
    />
  );
}
