import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { JSX } from "react";
import { buildHead } from "@/lib/seo";
import { exampleCount, exampleQueries } from "@/data/search";
import { brandById, coils, devices, liquids, parts } from "@/data/catalog";
import type { CatalogItem, Domain } from "@/data/types";
import { domainLabel } from "@/components/labels";
import { PageHeading } from "@/components/page-heading";
import { FichaLink } from "@/components/ficha-link";
import { transitionNameForPhoto } from "@/lib/view-transition";
import { ProductPhoto } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { KindCard } from "@/components/ui/kind-card";
import { kindOf } from "@/lib/kind";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  head: () => {
    const { meta, links } = buildHead({
      title: "Vapelog — Catálogo técnico de vapeo (UE)",
      description:
        "Catálogo técnico de dispositivos, resistencias y líquidos de vapeo para el mercado de la UE. Fichas con fuente, compatibilidad y calculadoras. No es una tienda.",
      path: "/",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: Home,
});

const highlights: CatalogItem[] = [devices[0], coils[0], liquids[0], parts[0]].filter(
  (item): item is CatalogItem => item != null,
);

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">
        Mercado UE · fichas con fuente
      </p>
      <PageHeading
        as="h1"
        text="Catálogo técnico de vapeo"
        className="mt-3 max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl"
      />
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Consulta especificaciones, compara productos y revisa compatibilidades con fuentes y límites
        de verificación.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Información de referencia para adultos. No es una tienda.
      </p>

      <section className="mt-10">
        <h2 className="text-lg text-muted-foreground">Buscar por característica</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Montaje, ohmios, calada, marca y potencia se cruzan. Resistencia integrada y una marca es
          una consulta, no una página aparte.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/buscar", search: q ? { q } : {} });
          }}
        >
          <label className="sr-only" htmlFor="home-q">
            Buscar en el archivo
          </label>
          <Input
            id="home-q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="XROS, 0,4 Ω, Heisenberg"
            className="sm:max-w-md"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {exampleQueries.map((example) => (
            <li key={example.id}>
              <ExampleCard example={example} />
            </li>
          ))}
        </ul>
      </section>

      <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DomainCard
          href="/dispositivos"
          domain="device"
          title="Dispositivos"
          count={devices.length}
          text="Formato, techo de vatios, batería integrada o celda externa, conector 510 o propio."
        />
        <DomainCard
          href="/resistencias"
          domain="coil"
          title="Resistencias"
          count={coils.length}
          text="Cápsula con resistencia integrada o cabezal de tanque, más ohmios, calada, malla y marca."
        />
        <DomainCard
          href="/liquidos"
          domain="liquid"
          title="Líquidos"
          count={liquids.length}
          text="Sales, freebase o shortfill a 0 mg, volumen y ratio."
        />
        <DomainCard
          href="/componentes"
          domain="part"
          title="Componentes"
          count={parts.length}
          text="La celda que el mod no trae, y la boquilla que en un pod no se vende suelta."
        />
      </ul>

      <nav
        className="mt-10 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6"
        aria-label="Herramientas"
      >
        <Link
          to="/compatibilidad"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Compatibilidad dispositivo × resistencia
        </Link>
        <Link
          to="/comparar"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Comparador
        </Link>
        <Link
          to="/herramientas"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Calculadoras Ohm y nicokit
        </Link>
        <Link
          to="/archivo"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Catálogo completo
        </Link>
      </nav>

      <Separator className="mt-14" />

      {highlights.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg text-muted-foreground">Explora el catálogo</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Una muestra de fichas para entrar al archivo.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {highlights.map((item) => (
              <li key={item.id}>
                <FichaLink
                  domain={item.domain}
                  slug={item.slug}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface-2 shadow-1 transition-[border-color,box-shadow] duration-2 ease-out hover:border-primary hover:shadow-2"
                >
                  {item.domain === "device" || item.domain === "coil" ? (
                    <ProductPhoto
                      slug={item.slug}
                      alt={item.name}
                      frame="card"
                      missing="note"
                      transitionName={transitionNameForPhoto(item.slug)}
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-xs tracking-widest text-primary uppercase">
                      {domainLabel(item.domain)} · {brandById(item.brandId)?.name}
                    </p>
                    <p className="mt-2 text-base text-foreground">{item.name}</p>
                  </div>
                </FichaLink>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link
              to="/archivo"
              className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Ver el catálogo completo
            </Link>
          </p>
        </section>
      ) : null}

      <aside className="mt-10 border-l-2 border-border pl-4 text-sm text-muted-foreground">
        Las fichas citan la fuente y marcan lo que no está verificado. Cómo se organiza el dato está
        en el{" "}
        <Link
          to="/modelo"
          className="text-muted-foreground underline decoration-border underline-offset-4"
        >
          modelo de datos
        </Link>
        .
      </aside>
    </div>
  );
}

function ExampleCard({ example }: { example: (typeof exampleQueries)[number] }) {
  const count = exampleCount(example);
  const className = "flex h-full flex-col rounded-lg border border-border/80 bg-muted/35 p-4";
  const inner = (
    <>
      <p className="text-xs tracking-widest text-muted-foreground uppercase tabular-nums">
        {count} fichas
      </p>
      <h3 className="mt-2 text-lg text-muted-foreground">{example.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{example.text}</p>
    </>
  );
  if (example.domain === "coil") {
    return (
      <Link to="/resistencias" search={example.search} preload="intent" className={className}>
        {inner}
      </Link>
    );
  }
  if (example.domain === "device") {
    return (
      <Link to="/dispositivos" search={example.search} preload="intent" className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/liquidos" search={example.search} preload="intent" className={className}>
      {inner}
    </Link>
  );
}

function DomainCard({
  href,
  domain,
  title,
  count,
  text,
}: {
  href: "/dispositivos" | "/resistencias" | "/liquidos" | "/componentes";
  domain: Domain;
  title: string;
  count: number;
  text: string;
}) {
  return (
    <li>
      <KindCard kind={kindOf(domain)} className="h-full">
        <Link to={href} preload="intent" className="flex h-full flex-col p-3 pt-2">
          <p className="text-xs tracking-widest text-primary uppercase tabular-nums">
            {count} fichas
          </p>
          <h2 className="mt-2 text-3xl text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        </Link>
      </KindCard>
    </li>
  );
}
