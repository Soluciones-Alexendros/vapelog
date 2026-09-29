import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/liquidos/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Líquidos — Vapelog",
      description:
        "Líquidos del mercado UE por línea, formato, graduación y ratio, con el volumen y la nicotina tal como los publica la etiqueta.",
      path: "/liquidos",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: LiquidsPage,
});

function LiquidsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CatalogBrowser
      domain="liquid"
      search={search}
      onSearch={(next) => void navigate({ search: next })}
      title="Líquidos"
      lede="Líneas reales del mercado UE. Volumen y graduación son los del formato habitual: la etiqueta del lote manda, y no hay número TPD inventado."
    />
  );
}
