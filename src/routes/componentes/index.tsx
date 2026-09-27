import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";

export const Route = createFileRoute("/componentes/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
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
