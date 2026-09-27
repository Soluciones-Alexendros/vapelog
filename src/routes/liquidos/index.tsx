import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";

export const Route = createFileRoute("/liquidos/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
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
