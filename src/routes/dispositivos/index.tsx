import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";

export const Route = createFileRoute("/dispositivos/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  component: DevicesPage,
});

function DevicesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CatalogBrowser
      domain="device"
      search={search}
      onSearch={(next) => void navigate({ search: next })}
      title="Dispositivos"
      lede="Cada ficha cita la fuente. Mecánicos, squonk, boro y tabaco calentado siguen fuera: no se rellenan con modelos inventados."
    />
  );
}
