import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { KineticHeading } from "@/components/kinetic-heading";
import { parseCatalogSearch } from "@/data/search";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/resistencias/")({
  validateSearch: (search) => parseCatalogSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Resistencias — Vapelog",
      description:
        "Resistencias y cápsulas por ohmios, montaje, calada y malla, con la ventana de vatios que recomienda el fabricante.",
      path: "/resistencias",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: CoilsPage,
});

function CoilsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const lede =
    "El filtro de montaje separa la cápsula con resistencia integrada del cabezal suelto de tanque. Marca, ohmios, calada y malla se suman: las dos condiciones tienen que cumplirse.";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Catálogo</p>
      <KineticHeading as="h1" text="Resistencias" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
      <CatalogBrowser
        domain="coil"
        search={search}
        onSearch={(next) => void navigate({ search: next })}
        title="Resistencias"
        lede={lede}
        heading={false}
      />
    </div>
  );
}
