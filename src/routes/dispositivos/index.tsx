import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { KineticHeading } from "@/components/kinetic-heading";
import { parseCatalogSearch } from "@/data/search";
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
  const lede =
    "Cada ficha cita la fuente. Mecánicos, squonk, boro y tabaco calentado siguen fuera: no se rellenan con modelos inventados.";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Catálogo</p>
      <KineticHeading as="h1" text="Dispositivos" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
      <CatalogBrowser
        domain="device"
        search={search}
        onSearch={(next) => void navigate({ search: next })}
        title="Dispositivos"
        lede={lede}
        heading={false}
      />
    </div>
  );
}
