import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { exampleCount, exampleQueries } from "@/data/search";
import { coils, devices, liquids, parts } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">
        Mercado UE · fichas con fuente
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl text-foreground sm:text-5xl">El catálogo</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cuatro listas. El resto del archivo —búsqueda, cruce, cálculo— sirve para recorrerlas, no
        para sustituirlas.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DomainCard
          href="/dispositivos"
          title="Dispositivos"
          count={devices.length}
          text="Formato, techo de vatios, batería integrada o celda externa, conector 510 o propio."
        />
        <DomainCard
          href="/resistencias"
          title="Resistencias"
          count={coils.length}
          text="Cápsula con resistencia integrada o cabezal de tanque, más ohmios, calada, malla y marca."
        />
        <DomainCard
          href="/liquidos"
          title="Líquidos"
          count={liquids.length}
          text="Sales, freebase o shortfill a 0 mg, volumen y ratio."
        />
        <DomainCard
          href="/componentes"
          title="Componentes"
          count={parts.length}
          text="La celda que el mod no trae, y la boquilla que en un pod no se vende suelta."
        />
      </ul>

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
            <li key={example.id}>
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
        {count} fichas
      </p>
      <h3 className="mt-2 text-lg text-muted-foreground">{example.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{example.text}</p>
    </>
  );
  if (example.domain === "coil") {
    return (
      <Link to="/resistencias" search={example.search} className={className}>
        {inner}
      </Link>
    );
  }
  if (example.domain === "device") {
    return (
      <Link to="/dispositivos" search={example.search} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/liquidos" search={example.search} className={className}>
      {inner}
    </Link>
  );
}

function DomainCard({
  href,
  title,
  count,
  text,
}: {
  href: "/dispositivos" | "/resistencias" | "/liquidos" | "/componentes";
  title: string;
  count: number;
  text: string;
}) {
  return (
    <li>
      <Card className="h-full hover:border-primary">
        <Link to={href} className="flex h-full flex-col">
          <CardHeader>
            <p className="text-xs tracking-widest text-primary uppercase tabular-nums">
              {count} fichas
            </p>
            <CardTitle className="mt-2 text-3xl">{title}</CardTitle>
            <CardDescription className="mt-2">{text}</CardDescription>
          </CardHeader>
        </Link>
      </Card>
    </li>
  );
}
