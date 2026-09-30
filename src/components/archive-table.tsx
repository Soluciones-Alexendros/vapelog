import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  brandById,
  coils,
  devices,
  genreById,
  liquids,
  parts,
  taxonById,
  variationRange,
} from "@/data/catalog";
import type { Domain, Liquid, TpdStatus } from "@/data/types";
import { powerSummary } from "@/data/specs";
import {
  confidenceLabel,
  domainLabel,
  formatPlain,
  itemTpd,
  toneTextClass,
  tpdLabel,
  tpdTone,
} from "@/components/labels";
import { ProductPhoto } from "@/components/photo";
import { KineticHeading } from "@/components/kinetic-heading";
import { Button } from "@/components/ui/button";

interface Row {
  domain: Domain;
  hrefDomain: Domain;
  slug: string;
  brand: string;
  name: string;
  genre: string;
  detail: string;
  confidence: string;
  tpd: string;
  tpdStatus: TpdStatus;
}

const column = createColumnHelper<Row>();

function liquidDetail(item: Liquid): string {
  const range = variationRange(item);
  if (!range) return "Sin dato publicado";
  const span = (values: { min: number; max: number }) =>
    values.min === values.max
      ? formatPlain(values.min)
      : `${formatPlain(values.min)}–${formatPlain(values.max)}`;
  const strengths = item.variations
    .filter((variation) => variation.hasNicotine && variation.nicotineMg != null)
    .map((variation) => variation.nicotineMg as number);
  const nicotine = strengths.length
    ? `${span({ min: Math.min(...strengths), max: Math.max(...strengths) })} mg/ml`
    : "sin nicotina";
  return `${span(range.volumeMl)} ml · ${nicotine}`;
}

export function ArchiveTable() {
  const data = useMemo<Row[]>(() => {
    const deviceRows: Row[] = devices.map((item) => ({
      domain: "device",
      hrefDomain: "device",
      slug: item.slug,
      brand: brandById(item.brandId)?.name ?? item.brandId,
      name: item.name,
      genre: taxonById(item.subId ?? "")?.es ?? "",
      detail: powerSummary(item) || "Sin dato publicado",
      confidence: confidenceLabel(item.confidence),
      tpd: tpdLabel(itemTpd(item)),
      tpdStatus: itemTpd(item),
    }));
    const coilRows: Row[] = coils.map((item) => ({
      domain: "coil",
      hrefDomain: "coil",
      slug: item.slug,
      brand: brandById(item.brandId)?.name ?? item.brandId,
      name: item.name,
      genre: taxonById(item.subId ?? "")?.es ?? "",
      detail: [`${formatPlain(item.ohms)} Ω`, item.draws.join(" · ")].filter(Boolean).join(" · "),
      confidence: confidenceLabel(item.confidence),
      tpd: tpdLabel(itemTpd(item)),
      tpdStatus: itemTpd(item),
    }));
    const liquidRows: Row[] = liquids.map((item) => ({
      domain: "liquid",
      hrefDomain: "liquid",
      slug: item.slug,
      brand: brandById(item.brandId)?.name ?? item.brandId,
      name: item.name,
      genre: genreById(item.genreId)?.es ?? "",
      detail: liquidDetail(item),
      confidence: confidenceLabel(item.confidence),
      tpd: tpdLabel(itemTpd(item)),
      tpdStatus: itemTpd(item),
    }));
    const partRows: Row[] = parts.map((item) => ({
      domain: "part",
      hrefDomain: "part",
      slug: item.slug,
      brand: brandById(item.brandId)?.name ?? item.brandId,
      name: item.name,
      genre: taxonById(item.subId ?? "")?.es ?? "",
      detail: item.spec,
      confidence: confidenceLabel(item.confidence),
      tpd: tpdLabel(itemTpd(item)),
      tpdStatus: itemTpd(item),
    }));
    return [...deviceRows, ...coilRows, ...liquidRows, ...partRows];
  }, []);

  const [sorting, setSorting] = useState<SortingState>([{ id: "brand", desc: false }]);
  const [filter, setFilter] = useState("");

  const columns = useMemo(
    () => [
      column.accessor("domain", {
        header: "Tipo",
        cell: (info) => domainLabel(info.getValue()),
      }),
      column.accessor("brand", { header: "Marca" }),
      column.accessor("name", { header: "Nombre" }),
      column.accessor("genre", { header: "Género" }),
      column.accessor("detail", { header: "Dato" }),
      column.accessor("confidence", { header: "Fuente" }),
      column.accessor("tpd", {
        header: "Régimen",
        cell: (info) => (
          <span className={toneTextClass(tpdTone(info.row.original.tpdStatus))}>
            {info.getValue()}
          </span>
        ),
      }),
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 es librería válida; la regla marca incompatibilidad de compilación, no un bug.
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportCsv = () => {
    const header = ["Tipo", "Marca", "Nombre", "Género", "Dato", "Fuente", "Régimen"];
    const body = table
      .getSortedRowModel()
      .rows.map((row) => [
        domainLabel(row.original.domain),
        row.original.brand,
        row.original.name,
        row.original.genre,
        row.original.detail,
        row.original.confidence,
        row.original.tpd,
      ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vapelog.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Datos</p>
      <KineticHeading as="h1" text="Tabla del archivo" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Lectura de todas las fichas. No hay alta ni borrado: sin cuentas, una escritura abierta no
        es un archivo, es un tablón.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="archivo-q">
          Filtrar la tabla
        </label>
        <input
          id="archivo-q"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por marca, nombre o dato"
          className="sm:max-w-sm"
        />
        <Button type="button" variant="secondary" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto border border-border bg-surface-2 shadow-1">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <caption className="sr-only">Fichas de Vapelog</caption>
          <thead className="bg-muted text-muted-foreground">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={
                      header.index === 0
                        ? "sticky left-0 z-10 bg-muted px-3 py-3 font-medium"
                        : "px-3 py-3 font-medium"
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="min-h-11 text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="ml-1 text-muted-foreground">
                          {header.column.getIsSorted() === "asc"
                            ? "↑"
                            : header.column.getIsSorted() === "desc"
                              ? "↓"
                              : ""}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={
                      index === 0
                        ? "sticky left-0 z-10 bg-surface-2 px-3 py-3 text-muted-foreground"
                        : "px-3 py-3 text-muted-foreground"
                    }
                  >
                    {cell.column.id === "name" ? (
                      <NameLink row={row.original} />
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NameLink({ row }: { row: Row }) {
  const photo =
    row.hrefDomain === "device" || row.hrefDomain === "coil" ? (
      <ProductPhoto slug={row.slug} alt="" frame="thumb" />
    ) : null;
  const label = (
    <span className="text-foreground underline decoration-border underline-offset-4">
      {row.name}
    </span>
  );
  if (row.hrefDomain === "device") {
    return (
      <Link
        to="/dispositivos/$slug"
        params={{ slug: row.slug }}
        className="flex items-center gap-3"
      >
        {photo}
        {label}
      </Link>
    );
  }
  if (row.hrefDomain === "coil") {
    return (
      <Link
        to="/resistencias/$slug"
        params={{ slug: row.slug }}
        className="flex items-center gap-3"
      >
        {photo}
        {label}
      </Link>
    );
  }
  if (row.hrefDomain === "part") {
    return (
      <Link
        to="/componentes/$slug"
        params={{ slug: row.slug }}
        className="text-foreground underline decoration-border underline-offset-4"
      >
        {row.name}
      </Link>
    );
  }
  return (
    <Link
      to="/liquidos/$slug"
      params={{ slug: row.slug }}
      className="text-foreground underline decoration-border underline-offset-4"
    >
      {row.name}
    </Link>
  );
}
