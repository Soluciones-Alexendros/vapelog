import { createFileRoute, Link } from "@tanstack/react-router";
import type { JSX } from "react";
import { buildHead } from "@/lib/seo";
import { KineticHeading } from "@/components/kinetic-heading";
import { CatalogBrowser } from "@/components/catalog-browser";
import { FichaLink } from "@/components/ficha-link";
import { transitionNameForPhoto } from "@/lib/view-transition";
import { parseCatalogSearch, type CatalogSearch } from "@/data/search";
import { brandById } from "@/data/catalog";
import { exampleCount, exampleQueries, itemsFor } from "@/data/search";
import { normalize } from "@/data/logic";
import type { CatalogItem, Domain } from "@/data/types";
import { ProductPhoto } from "@/components/photo";
import { Button } from "@/components/ui/button";

type FinderSearch = CatalogSearch & { dominio?: Domain };

const domains = [
  { id: "coil" as const, label: "Resistencias" },
  { id: "device" as const, label: "Dispositivos" },
  { id: "liquid" as const, label: "Líquidos" },
  { id: "part" as const, label: "Componentes" },
];

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): FinderSearch => {
    const dominio = search.dominio;
    const domain: Domain | undefined =
      dominio === "device" || dominio === "coil" || dominio === "liquid" || dominio === "part"
        ? dominio
        : undefined;
    return { ...parseCatalogSearch(search), dominio: domain };
  },
  head: () => {
    const { meta } = buildHead({
      title: "Buscador — Vapelog",
      description:
        "Busca por característica en todo el archivo: filtra dispositivos, resistencias, líquidos y componentes por los datos publicados en cada ficha, sin inventar coincidencias.",
      path: "/buscar",
    });
    return {
      meta: [
        ...meta,
        { name: "robots", content: "noindex, follow" },
      ] as JSX.IntrinsicElements["meta"][],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { dominio, ...catalog } = search;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Buscador</p>
      <KineticHeading
        as="h1"
        text="Por característica, no por eslogan"
        className="mt-2 text-4xl text-foreground"
      />
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cada filtro es un dato de la ficha y se suma al anterior. Resistencia integrada más una
        marca deja solo las cápsulas de esa marca. Si la marca no está en el archivo, el resultado
        es cero: no se inventa la ficha.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        La comparativa de precios por tienda es el paso siguiente. La comercialización, cuando esta
        estructura ya no se mueva.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Sección">
        <Button
          asChild
          variant={!dominio ? "secondary" : "quiet"}
          className={
            !dominio ? "font-semibold underline decoration-primary underline-offset-4" : undefined
          }
        >
          <Link to="/buscar" search={shared(catalog)} role="tab" aria-selected={!dominio}>
            Consultas
          </Link>
        </Button>
        {domains.map((entry) => {
          const selected = dominio === entry.id;
          return (
            <Button
              key={entry.id}
              asChild
              variant={selected ? "secondary" : "quiet"}
              className={
                selected
                  ? "font-semibold underline decoration-primary underline-offset-4"
                  : undefined
              }
            >
              <Link
                to="/buscar"
                search={{ ...shared(catalog), dominio: entry.id }}
                role="tab"
                aria-selected={selected}
              >
                {entry.label}
              </Link>
            </Button>
          );
        })}
      </div>

      {dominio ? (
        <div className="mt-6">
          <CatalogBrowser
            heading={false}
            domain={dominio}
            search={catalog}
            onSearch={(next) => void navigate({ search: { ...next, dominio } })}
            title={domains.find((entry) => entry.id === dominio)?.label ?? "Buscar"}
            lede=""
          />
        </div>
      ) : (
        <FinderHome q={catalog.q ?? ""} />
      )}
    </div>
  );
}

function shared(search: CatalogSearch): CatalogSearch {
  const next: CatalogSearch = {};
  if (search.q) next.q = search.q;
  if (search.marca) next.marca = search.marca;
  if (search.vista) next.vista = search.vista;
  return next;
}

function FinderHome({ q }: { q: string }) {
  const navigate = Route.useNavigate();
  return (
    <>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const text = String(data.get("q") ?? "");
          void navigate({ search: text ? { q: text } : {} });
        }}
      >
        <label className="sr-only" htmlFor="finder-q">
          Buscar por nombre en todo el archivo
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
          <span aria-hidden="true" className="font-mono text-lg text-primary">
            &gt;
          </span>
          <input
            id="finder-q"
            name="q"
            defaultValue={q}
            placeholder="Nombre, marca o cifra"
            className="font-mono sm:max-w-md"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Buscar el nombre
        </button>
      </form>

      <h2 className="mt-10 text-2xl text-foreground">Consultas armadas</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {exampleQueries.map((example) => (
          <li key={example.id}>
            <ExampleLink example={example} />
          </li>
        ))}
      </ul>

      {q ? <TextHits q={q} /> : null}
    </>
  );
}

function ExampleLink({ example }: { example: (typeof exampleQueries)[number] }) {
  const count = exampleCount(example);
  const inner = (
    <>
      <p className="text-xs tracking-widest text-primary uppercase tabular-nums">{count} fichas</p>
      <h3 className="mt-2 text-2xl text-foreground">{example.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{example.text}</p>
    </>
  );
  const className =
    "flex h-full flex-col rounded-md border border-border bg-card p-5 hover:border-primary";
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
  if (example.domain === "liquid") {
    return (
      <Link to="/liquidos" search={example.search} preload="intent" className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/componentes" search={example.search} preload="intent" className={className}>
      {inner}
    </Link>
  );
}

function TextHits({ q }: { q: string }) {
  const needle = normalize(q);
  const hits = (["device", "coil", "liquid", "part"] as const)
    .flatMap((domain) => itemsFor(domain))
    .filter((item) => {
      const brand = brandById(item.brandId)?.name ?? "";
      return normalize(`${item.name} ${brand} ${item.summary} ${item.tags.join(" ")}`).includes(
        needle,
      );
    });
  return (
    <section className="mt-10">
      <h2 className="text-2xl text-foreground">Nombre «{q}»</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {hits.length} fichas en todo el archivo. Para cruzar características, entra en una sección.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {hits.slice(0, 20).map((item) => (
          <li key={item.id} className="border border-border p-4">
            <Hit item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Hit({ item }: { item: CatalogItem }) {
  const brand = brandById(item.brandId)?.name;
  const photo =
    item.domain === "device" || item.domain === "coil" ? (
      <ProductPhoto
        slug={item.slug}
        alt=""
        frame="thumb"
        transitionName={transitionNameForPhoto(item.slug)}
      />
    ) : null;
  const label =
    item.domain === "device"
      ? "Dispositivo"
      : item.domain === "coil"
        ? "Resistencia"
        : item.domain === "part"
          ? "Componente"
          : "Líquido";
  const body = (
    <div>
      <p className="text-xs tracking-widest text-primary uppercase">
        {brand} · {label}
      </p>
      <p className="mt-1 text-xl text-foreground">{item.name}</p>
    </div>
  );
  if (item.domain === "device") {
    return (
      <FichaLink domain={item.domain} slug={item.slug} className="flex items-center gap-3">
        {photo}
        {body}
      </FichaLink>
    );
  }
  if (item.domain === "coil") {
    return (
      <FichaLink domain={item.domain} slug={item.slug} className="flex items-center gap-3">
        {photo}
        {body}
      </FichaLink>
    );
  }
  return (
    <FichaLink domain={item.domain} slug={item.slug} className="flex items-center gap-3">
      {photo}
      {body}
    </FichaLink>
  );
}
