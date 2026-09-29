import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/componentes/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Componentes — Vapelog",
      description:
        "Celdas externas y boquillas del archivo: lo que el aparato necesita y no siempre trae, con su plataforma compatible y su fuente.",
      path: "/componentes",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: PartsPage,
});

function PartsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CatalogBrowser
      domain="part"
      search={search}
      onSearch={(next) => void navigate({ search: next })}
      title="Componentes"
      lede="Lo que el aparato necesita y no siempre trae: la celda externa y la boquilla. En un pod la boquilla no se compra aparte."
    />
  );
}
