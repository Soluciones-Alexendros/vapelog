import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";

export const Route = createFileRoute("/resistencias/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
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
