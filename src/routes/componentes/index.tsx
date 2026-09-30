import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { KineticHeading } from "@/components/kinetic-heading";
import { parseCatalogSearch } from "@/data/search";
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
  const lede =
    "Lo que el aparato necesita y no siempre trae: la celda externa y la boquilla. En un pod la boquilla no se compra aparte.";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Catálogo</p>
      <KineticHeading as="h1" text="Componentes" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
      <CatalogBrowser
        domain="part"
        search={search}
        onSearch={(next) => void navigate({ search: next })}
        title="Componentes"
        lede={lede}
        heading={false}
      />
    </div>
  );
}
