import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { blogPosts, categoryLabel, formatPostDate } from "@/data/blog";
import { exampleCount, exampleQueries } from "@/data/search";
import { brandById, coils, devices, liquids, parts } from "@/data/catalog";
import type { CatalogItem, Domain } from "@/data/types";
import { domainLabel } from "@/components/labels";
import { CountUp } from "@/components/count-up";
import { KineticHeading } from "@/components/kinetic-heading";
import { FichaLink } from "@/components/ficha-link";
import { transitionNameForPhoto } from "@/lib/view-transition";
import { ProductPhoto } from "@/components/photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KindCard } from "@/components/ui/kind-card";
import { useCardFx } from "@/components/ui/use-card-fx";
import { kindOf } from "@/lib/kind";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({ component: Home });

const latestPosts = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);

const highlights: CatalogItem[] = [devices[0], coils[0], liquids[0], parts[0]].filter(
  (item): item is CatalogItem => item != null,
);

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const domainsRef = useRef<HTMLUListElement>(null);
  useCardFx(domainsRef);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <KineticHeading
        as="p"
        text="Mercado UE · fichas con fuente"
        className="text-xs font-medium tracking-widest text-primary uppercase"
      />
      <KineticHeading
        as="h1"
        text="El catálogo"
        className="mt-3 max-w-3xl text-4xl text-foreground sm:text-5xl term-caret"
      />
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cuatro listas. El resto del archivo —búsqueda, cruce, cálculo— sirve para recorrerlas, no
        para sustituirlas.
      </p>

      <ul ref={domainsRef} className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="mt-14">
        <h2 className="text-lg text-muted-foreground">Novedades</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Lo último que se publica en el blog y una ficha por dominio para entrar al archivo.
          Vapelog no guarda fecha de alta de cada ficha, así que aquí no se finge un orden de
          novedad.
        </p>

        {latestPosts.length > 0 ? (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {latestPosts.map((post) => (
              <li key={post.slug} className="reveal">
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="flex h-full flex-col rounded-lg border border-border bg-surface-2 p-4 shadow-1 transition-[border-color,box-shadow] duration-2 ease-out hover:border-primary hover:shadow-2"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="muted">{categoryLabel(post.category)}</Badge>
                    <time
                      dateTime={post.date}
                      className="text-xs tracking-widest text-muted-foreground uppercase tabular-nums"
                    >
                      {formatPostDate(post.date)}
                    </time>
                  </div>
                  <h3 className="mt-3 text-lg text-foreground">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {highlights.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-base text-muted-foreground">Una ficha por dominio</h3>
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {highlights.map((item) => (
                <li key={item.id} className="reveal">
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
                Ver la tabla completa del archivo
              </Link>
            </p>
          </div>
        ) : null}
      </section>

      <Separator className="mt-14" />
      <section className="mt-8">
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
            <li key={example.id} className="reveal">
              <ExampleCard example={example} />
            </li>
          ))}
        </ul>
      </section>

      <nav
        className="mt-10 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6"
        aria-label="Herramientas"
      >
        <Link
          to="/compatibilidad"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Cruce dispositivo × resistencia
        </Link>
        <Link
          to="/herramientas"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Ohm y nicokit
        </Link>
        <Link
          to="/archivo"
          className="min-h-11 text-muted-foreground underline decoration-border underline-offset-4"
        >
          Tabla completa
        </Link>
      </nav>
      <aside className="mt-4 border-l-2 border-border pl-4 text-sm text-muted-foreground">
        Los precios de tienda y la vía de monetización esperan a que las fichas dejen de moverse. No
        se rellenan ofertas de ejemplo. El modelo de datos está en{" "}
        <Link
          to="/modelo"
          className="text-muted-foreground underline decoration-border underline-offset-4"
        >
          Modelo
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
        <CountUp value={count} /> fichas
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
    <li className="reveal">
      <KindCard kind={kindOf(domain)} className="h-full">
        <Link to={href} preload="intent" className="flex h-full flex-col p-3 pt-2">
          <p className="text-xs tracking-widest text-primary uppercase tabular-nums">
            <CountUp value={count} /> fichas
          </p>
          <h2 className="mt-2 text-3xl text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        </Link>
      </KindCard>
    </li>
  );
}
