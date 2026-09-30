import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { KineticHeading } from "@/components/kinetic-heading";
import { parseCatalogSearch } from "@/data/search";
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
  const lede =
    "Líneas reales del mercado UE. Volumen y graduación son los del formato habitual: la etiqueta del lote manda, y no hay número TPD inventado.";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Catálogo</p>
      <KineticHeading as="h1" text="Líquidos" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
      <CatalogBrowser
        domain="liquid"
        search={search}
        onSearch={(next) => void navigate({ search: next })}
        title="Líquidos"
        lede={lede}
        heading={false}
      />
    </div>
  );
}
