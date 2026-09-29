import { Link } from "@tanstack/react-router";
import { brandById, genreById, taxonById } from "@/data/catalog";
import {
  buildFacets,
  chipsFor,
  factLine,
  parseCatalogSearch,
  query,
  specCells,
  without,
  type CatalogSearch,
} from "@/data/search";
import type { Domain } from "@/data/types";
import { useCompare } from "@/components/chrome";
import { confidenceLabel, itemTpd, tpdLabel } from "@/components/labels";
import { ProductPhoto } from "@/components/photo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";

export type { CatalogSearch };
export { parseCatalogSearch };

export function CatalogBrowser({
  domain,
  search,
  onSearch,
  title,
  lede,
  heading = true,
}: {
  domain: Domain;
  search: CatalogSearch;
  onSearch: (next: CatalogSearch) => void;
  title: string;
  lede: string;
  heading?: boolean;
}) {
  const vista = search.vista ?? "grid";
  const compare = useCompare();
  const filtered = query(domain, search);
  const facets = buildFacets(domain, search);
  const chips = chipsFor(search);
  const showTpd = domain === "device" || domain === "liquid";

  const set = (patch: Partial<CatalogSearch>) => {
    const next: CatalogSearch = { ...search, ...patch };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") delete next[key as keyof CatalogSearch];
    }
    onSearch(next);
  };

  return (
    <div className={heading ? "mx-auto max-w-6xl px-4 py-8" : ""}>
      {heading ? (
        <>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Catálogo</p>
          <h1 className="mt-2 text-4xl text-foreground">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>
        </>
      ) : null}

      <div
        className={`${heading ? "mt-6" : ""} grid min-w-0 gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]`}
      >
        <form
          className="border border-border bg-card h-fit rounded-lg p-4 lg:sticky lg:top-36 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-sm text-muted-foreground" htmlFor={`${domain}-q`}>
            Texto dentro de estos filtros
          </label>
          <Input
            id={`${domain}-q`}
            value={search.q ?? ""}
            onChange={(event) => set({ q: event.target.value })}
            placeholder="Modelo o cifra"
            className="mt-2"
          />

          {facets.map((facet) =>
            facet.control === "select" ? (
              <label
                key={facet.key}
                className="mt-5 block text-sm text-muted-foreground"
                htmlFor={`${domain}-${facet.key}`}
              >
                {facet.legend}
                <select
                  id={`${domain}-${facet.key}`}
                  className="mt-2 text-foreground"
                  value={typeof search[facet.key] === "string" ? String(search[facet.key]) : ""}
                  onChange={(event) => {
                    const nextId = event.target.value || undefined;
                    if (facet.key === "familia") set({ familia: nextId, sub: undefined });
                    else set({ [facet.key]: nextId });
                  }}
                >
                  <option value="">Todas</option>
                  {facet.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <fieldset key={facet.key} className="mt-5">
                <legend className="text-sm text-muted-foreground">{facet.legend}</legend>
                <div className="mt-1 flex flex-col" role="radiogroup" aria-label={facet.legend}>
                  {facet.options.map((option) => {
                    const active = search[facet.key] === option.id;
                    return (
                      <label
                        key={option.id}
                        className={
                          active
                            ? "flex min-h-11 cursor-pointer items-center justify-between gap-3 border-l-2 border-primary pr-1 pl-2 text-sm"
                            : "flex min-h-11 cursor-pointer items-center justify-between gap-3 border-l-2 border-transparent pr-1 pl-2 text-sm hover:border-border"
                        }
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`${domain}-${facet.key}`}
                            className="size-4"
                            checked={active}
                            onChange={() => {
                              if (facet.key === "familia")
                                set({ familia: option.id, sub: undefined });
                              else set({ [facet.key]: option.id });
                            }}
                          />
                          <span
                            className={
                              active
                                ? "font-semibold text-foreground underline decoration-primary underline-offset-4"
                                : "text-muted-foreground"
                            }
                          >
                            {option.label}
                          </span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{option.count}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ),
          )}

          {showTpd ? (
            <label className="mt-5 flex min-h-11 items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4"
                checked={search.tpd === "si"}
                onChange={(event) => set({ tpd: event.target.checked ? "si" : undefined })}
              />
              Solo ficha TPD estricta
            </label>
          ) : null}

          <Button
            type="button"
            variant="quiet"
            className="mt-2 px-0"
            onClick={() => onSearch(search.vista ? { vista: search.vista } : {})}
          >
            Limpiar filtros
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            El precio de cada tienda no está. Entra cuando la ficha deje de moverse.
          </p>
        </form>

        <section className="min-w-0">
          {chips.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-foreground border border-border bg-card"
                    onClick={() => onSearch(without(search, chip.key))}
                  >
                    {chip.label}
                    <X className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">Quitar {chip.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin filtros: el listado es el archivo entero de esta sección.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="tabular-nums text-foreground">{filtered.length}</span> fichas con
              estas características
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor={`${domain}-orden`}>
                Orden
                <select
                  id={`${domain}-orden`}
                  className="mt-1 w-auto min-w-36"
                  value={search.orden ?? "nombre"}
                  onChange={(event) =>
                    set({
                      orden:
                        event.target.value === "nombre"
                          ? undefined
                          : (event.target.value as CatalogSearch["orden"]),
                    })
                  }
                >
                  <option value="nombre">Nombre</option>
                  <option value="marca">Marca</option>
                  {domain === "coil" ? <option value="ohm">Ohmios</option> : null}
                  {domain === "coil" || domain === "device" ? (
                    <option value="vatios">Vatios</option>
                  ) : null}
                </select>
              </label>
              <div className="flex gap-2" role="group" aria-label="Vista">
                {(
                  [
                    ["grid", "Fichas"],
                    ["lista", "Lista"],
                    ["tabla", "Comparativa"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    type="button"
                    variant={vista === id ? "secondary" : "quiet"}
                    aria-pressed={vista === id}
                    className={
                      vista === id
                        ? "font-semibold underline decoration-primary underline-offset-4"
                        : undefined
                    }
                    onClick={() => set({ vista: id })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="border border-border bg-card mt-8 rounded-lg p-6 text-muted-foreground">
              Ninguna ficha cumple esas características a la vez. Quita una y el recuento de al lado
              dice cuántas quedan.
            </p>
          ) : null}

          {vista === "tabla" && filtered.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-md border border-border bg-card">
              <Table className="min-w-max">
                <caption className="sr-only">{title}</caption>
                <TableHeader>
                  <tr>
                    <TableHead className="sticky left-0 z-10 bg-muted">Marca</TableHead>
                    <TableHead>Ficha</TableHead>
                    {specCells(filtered[0]).map((cell) => (
                      <TableHead key={cell.label}>{cell.label}</TableHead>
                    ))}
                    <TableHead>Fuente</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const brand = brandById(item.brandId)?.name ?? "";
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="sticky left-0 z-10 bg-card text-foreground">
                          {brand}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {domain === "device" || domain === "coil" ? (
                              <ProductPhoto
                                slug={item.slug}
                                alt={`${brand} ${item.name}`.trim()}
                                frame="thumb"
                              />
                            ) : null}
                            <ItemLink
                              domain={domain}
                              slug={item.slug}
                              className="text-foreground underline decoration-border underline-offset-4"
                            >
                              {item.name}
                            </ItemLink>
                          </div>
                        </TableCell>
                        {specCells(item).map((cell) => (
                          <TableCell key={cell.label} className="tabular-nums">
                            {cell.value}
                          </TableCell>
                        ))}
                        <TableCell>
                          {confidenceLabel(item.confidence)}
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="quiet"
                              aria-pressed={compare.has(item.slug)}
                              className={
                                compare.has(item.slug)
                                  ? "font-semibold underline decoration-primary underline-offset-4"
                                  : undefined
                              }
                              onClick={() => compare.toggle({ domain, slug: item.slug })}
                            >
                              {compare.has(item.slug) ? "En el comparador" : "Comparar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {vista !== "tabla" && filtered.length > 0 ? (
            <ul
              className={
                vista === "grid" ? "mt-4 grid gap-3 sm:grid-cols-2" : "mt-4 flex flex-col gap-3"
              }
            >
              {filtered.map((item) => {
                const brand = brandById(item.brandId)?.name ?? "";
                const showPhoto = domain === "device" || domain === "coil";
                return (
                  <li
                    key={item.id}
                    className={
                      vista === "grid"
                        ? "flex flex-col overflow-hidden rounded-md border border-border bg-card hover:border-primary"
                        : "flex items-start gap-3 overflow-hidden rounded-md border border-border bg-card p-3 hover:border-primary"
                    }
                  >
                    {showPhoto ? (
                      <ProductPhoto
                        slug={item.slug}
                        alt={`${brand} ${item.name}`}
                        frame={vista === "grid" ? "card" : "row"}
                        missing="note"
                      />
                    ) : null}
                    <div
                      className={
                        vista === "grid"
                          ? "flex flex-1 flex-col p-4"
                          : "flex min-w-0 flex-1 flex-col py-1"
                      }
                    >
                      <p className="text-xs font-medium tracking-widest text-primary uppercase">
                        {brand}
                      </p>
                      <h2 className="mt-2 text-2xl text-foreground">{item.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.domain === "liquid"
                          ? genreById(item.genreId)?.es
                          : taxonById(item.subId ?? "")?.es}{" "}
                        · {factLine(item)}
                      </p>
                      {domain === "device" || domain === "liquid" ? (
                        <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                          {tpdLabel(itemTpd(item))}
                        </p>
                      ) : null}
                      {vista === "lista" ? (
                        <p className="mt-3 text-sm text-muted-foreground">{item.summary}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <ItemLink
                          domain={domain}
                          slug={item.slug}
                          className={buttonVariants({ variant: "secondary" })}
                        >
                          Abrir ficha
                        </ItemLink>
                        <Button
                          type="button"
                          variant="quiet"
                          aria-pressed={compare.has(item.slug)}
                          className={
                            compare.has(item.slug)
                              ? "font-semibold underline decoration-primary underline-offset-4"
                              : undefined
                          }
                          onClick={() => compare.toggle({ domain, slug: item.slug })}
                        >
                          {compare.has(item.slug) ? "En el comparador" : "Comparar"}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ItemLink({
  domain,
  slug,
  className,
  children,
}: {
  domain: Domain;
  slug: string;
  className?: string;
  children: string;
}) {
  if (domain === "device") {
    return (
      <Link to="/dispositivos/$slug" params={{ slug }} className={className}>
        {children}
      </Link>
    );
  }
  if (domain === "coil") {
    return (
      <Link to="/resistencias/$slug" params={{ slug }} className={className}>
        {children}
      </Link>
    );
  }
  if (domain === "part") {
    return (
      <Link to="/componentes/$slug" params={{ slug }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/liquidos/$slug" params={{ slug }} className={className}>
      {children}
    </Link>
  );
}
