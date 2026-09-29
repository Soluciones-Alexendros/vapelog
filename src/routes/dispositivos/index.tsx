import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser, parseCatalogSearch } from "@/components/catalog-browser";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/dispositivos/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Dispositivos — Vapelog",
      description:
        "Dispositivos de vapeo por potencia, ohmios, plataformas y conectores, cada uno con su ficha y su fuente. Mecánicos, squonk y boro siguen fuera.",
      path: "/dispositivos",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
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
