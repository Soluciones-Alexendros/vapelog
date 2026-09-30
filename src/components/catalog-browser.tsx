import { FichaLink } from "@/components/ficha-link";
import { puff } from "@/lib/smoke/emit-bus";
import { transitionNameForPhoto } from "@/lib/view-transition";
import { brandById, genreById, taxonById } from "@/data/catalog";
import { catalogImage } from "@/data/images";
import {
  buildFacets,
  chipsFor,
  factLine,
  query,
  specCells,
  without,
  type CatalogSearch,
} from "@/data/search";
import type { CatalogItem, Domain } from "@/data/types";
import { useCompare } from "@/components/compare-context";
import { confidenceLabel, domainLabel, itemTpd, tpdLabel } from "@/components/labels";
import { ProductPhoto } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { Package, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

      <div className={`${heading ? "mt-6" : "mt-4"} lg:hidden`}>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtros
          {chips.length > 0 ? (
            <span className="tabular-nums text-primary">{chips.length}</span>
          ) : null}
        </Button>
      </div>

      <div
        className={`${heading ? "mt-6" : "mt-4 lg:mt-0"} grid min-w-0 gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]`}
      >
        <div className="hidden h-fit rounded-lg border border-border bg-surface-2 p-4 shadow-1 lg:sticky lg:top-36 lg:block lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto">
          <form onSubmit={(event) => event.preventDefault()}>
            <FilterFields
              search={search}
              onSearch={onSearch}
              facets={facets}
              showTpd={showTpd}
              idPrefix={domain}
            />
          </form>
        </div>

        <section className="min-w-0">
          {chips.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground shadow-1 transition-colors duration-2 ease-out hover:border-border-strong"
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
            <p className="mt-8 rounded-lg border border-border bg-surface-2 p-6 text-muted-foreground shadow-1">
              Ninguna ficha cumple esas características a la vez. Quita una y el recuento de al lado
              dice cuántas quedan.
            </p>
          ) : null}

          {vista === "tabla" && filtered.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface-2 shadow-1">
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
                        <TableCell className="sticky left-0 z-10 bg-surface-2 text-foreground">
                          {brand}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {domain === "device" || domain === "coil" ? (
                              <CardMedia item={item} brand={brand} frame="thumb" />
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
                              onClick={(event) => {
                                puff(event.clientX, event.clientY);
                                compare.toggle({ domain, slug: item.slug });
                              }}
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
                        ? "reveal flex flex-col overflow-hidden rounded-md border border-border bg-surface-2 shadow-1 transition-[border-color,box-shadow] duration-2 ease-out hover:border-primary hover:shadow-2"
                        : "reveal flex items-start gap-3 overflow-hidden rounded-md border border-border bg-surface-2 p-3 shadow-1 transition-[border-color,box-shadow] duration-2 ease-out hover:border-primary hover:shadow-2"
                    }
                  >
                    {showPhoto ? (
                      <CardMedia
                        item={item}
                        brand={brand}
                        frame={vista === "grid" ? "card" : "row"}
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
                          onClick={(event) => {
                            puff(event.clientX, event.clientY);
                            compare.toggle({ domain, slug: item.slug });
                          }}
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

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto max-lg:top-auto max-lg:right-0 max-lg:bottom-0 max-lg:left-0 max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-t-lg max-lg:rounded-b-none">
          <DialogTitle>Filtros</DialogTitle>
          <DialogDescription>
            Filtra el listado por las características publicadas en cada ficha.
          </DialogDescription>
          <form onSubmit={(event) => event.preventDefault()}>
            <FilterFields
              search={search}
              onSearch={onSearch}
              facets={facets}
              showTpd={showTpd}
              idPrefix={`${domain}-m`}
            />
          </form>
          <Button type="button" className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>
            Ver {filtered.length} fichas
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterFields({
  search,
  onSearch,
  facets,
  showTpd,
  idPrefix,
}: {
  search: CatalogSearch;
  onSearch: (next: CatalogSearch) => void;
  facets: ReturnType<typeof buildFacets>;
  showTpd: boolean;
  idPrefix: string;
}) {
  const set = (patch: Partial<CatalogSearch>) => {
    const next: CatalogSearch = { ...search, ...patch };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") delete next[key as keyof CatalogSearch];
    }
    onSearch(next);
  };

  return (
    <>
      <label className="block text-sm text-muted-foreground" htmlFor={`${idPrefix}-q`}>
        Texto dentro de estos filtros
      </label>
      <Input
        id={`${idPrefix}-q`}
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
            htmlFor={`${idPrefix}-${facet.key}`}
          >
            {facet.legend}
            <select
              id={`${idPrefix}-${facet.key}`}
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
                        name={`${idPrefix}-${facet.key}`}
                        className="size-4"
                        checked={active}
                        onChange={() => {
                          if (facet.key === "familia") set({ familia: option.id, sub: undefined });
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
    </>
  );
}

function CardMedia({
  item,
  brand,
  frame,
}: {
  item: CatalogItem;
  brand: string;
  frame: "card" | "row" | "thumb";
}) {
  if (catalogImage(item.slug)) {
    return (
      <ProductPhoto
        slug={item.slug}
        alt={`${brand} ${item.name}`.trim()}
        frame={frame}
        missing="note"
        transitionName={transitionNameForPhoto(item.slug)}
      />
    );
  }
  const family = taxonById(item.familyId ?? "")?.es ?? domainLabel(item.domain);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 bg-surface-3 p-3 text-center outline outline-1 -outline-offset-1 outline-border",
        frame === "card"
          ? "aspect-square w-full"
          : frame === "row"
            ? "size-20 shrink-0"
            : "size-12 shrink-0",
      )}
    >
      <Package className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-xs leading-tight text-muted-foreground">{family}</p>
      <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">Sin foto</p>
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
  return (
    <FichaLink domain={domain} slug={slug} className={className}>
      {children}
    </FichaLink>
  );
}
