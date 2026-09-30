import { Link } from "@tanstack/react-router";
import { coilBySlug, deviceBySlug, liquidBySlug, partBySlug } from "@/data/catalog";
import { KineticHeading } from "@/components/kinetic-heading";
import { liquidVolumeMl } from "@/data/logic";
import { compareFacts, EMPTY, relationRows } from "@/data/specs";
import type { CatalogItem, Coil, Device, Liquid, Part } from "@/data/types";
import { useCompare, type CompareRef } from "@/components/compare-context";
import { ProductPhoto } from "@/components/photo";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

const BEST_DIRECTION: Record<string, "max" | "min"> = {
  power_max_w: "max",
  battery_mah: "max",
  capacity_ml: "max",
  watt_max: "max",
  weight_g: "min",
  volume_ml: "max",
};

export function CompareView() {
  const compare = useCompare();
  const domain = compare.items[0]?.domain;
  if (!domain || compare.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <KineticHeading as="h1" text="Comparador" className="text-4xl text-foreground" />
        <p className="mt-3 text-muted-foreground">
          Todavía no hay fichas. Elige hasta cuatro del mismo tipo.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link to="/dispositivos">Dispositivos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/resistencias">Resistencias</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/liquidos">Líquidos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/componentes">Componentes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rows = compare.items.map(resolve).filter((item): item is Resolved => item !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Hasta cuatro</p>
          <KineticHeading as="h1" text="Comparador" className="mt-2 text-4xl text-foreground" />
        </div>
        <Button type="button" variant="quiet" onClick={compare.clear}>
          Vaciar
        </Button>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Se resalta el valor publicado más alto o más bajo de cada fila numérica cuando procede. No
        hay puntuaciones ni precios: solo el dato que la fuente publica.
      </p>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface-2 shadow-1">
        <Table className="min-w-[40rem]">
          <caption className="sr-only">Comparación de fichas</caption>
          <TableHeader>
            <tr>
              <TableHead className="sticky left-0 z-10 bg-muted">Campo</TableHead>
              {rows.map((row) => (
                <TableHead key={row.ref.slug}>
                  <Link
                    to={row.href}
                    params={{ slug: row.ref.slug }}
                    className="underline decoration-border underline-offset-4"
                  >
                    {row.title}
                  </Link>
                  <Button
                    type="button"
                    variant="quiet"
                    className="mt-1 px-0"
                    onClick={() => compare.remove(row.ref.slug)}
                  >
                    Quitar
                  </Button>
                </TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row" className="sticky left-0 z-10 bg-surface-2 text-foreground">
                Foto
              </TableHead>
              {rows.map((row) => (
                <TableCell key={`foto-${row.ref.slug}`}>
                  <ProductPhoto
                    slug={row.ref.slug}
                    alt={row.title}
                    frame="row"
                    missing={row.device || row.coil ? "note" : "hide"}
                  />
                </TableCell>
              ))}
            </TableRow>
            {fields(rows).map((field) => {
              const best = bestIndices(field.key, rows);
              const direction = BEST_DIRECTION[field.key];
              return (
                <TableRow key={field.key}>
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 bg-surface-2 text-foreground"
                  >
                    {field.label}
                  </TableHead>
                  {field.values.map((value, index) => {
                    const isBest = best.includes(index);
                    return (
                      <TableCell
                        key={`${field.key}-${rows[index]?.ref.slug ?? index}`}
                        className={cn(
                          "tabular-nums",
                          field.published[index] ? "text-foreground" : "text-muted-foreground",
                          isBest && "bg-success/10 font-medium text-success",
                        )}
                      >
                        {value}
                        {isBest ? (
                          <span className="sr-only">
                            {direction === "min"
                              ? " El valor más bajo publicado de la comparación."
                              : " El valor más alto publicado de la comparación."}
                          </span>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface Resolved {
  ref: CompareRef;
  title: string;
  href: "/dispositivos/$slug" | "/resistencias/$slug" | "/liquidos/$slug" | "/componentes/$slug";
  item: CatalogItem;
  device?: Device;
  coil?: Coil;
  liquid?: Liquid;
  part?: Part;
}

function resolve(ref: CompareRef): Resolved | null {
  if (ref.domain === "device") {
    const device = deviceBySlug(ref.slug);
    if (!device) return null;
    return { ref, title: device.name, href: "/dispositivos/$slug", item: device, device };
  }
  if (ref.domain === "coil") {
    const coil = coilBySlug(ref.slug);
    if (!coil) return null;
    return { ref, title: coil.name, href: "/resistencias/$slug", item: coil, coil };
  }
  if (ref.domain === "part") {
    const part = partBySlug(ref.slug);
    if (!part) return null;
    return { ref, title: part.name, href: "/componentes/$slug", item: part, part };
  }
  const liquid = liquidBySlug(ref.slug);
  if (!liquid) return null;
  return { ref, title: liquid.name, href: "/liquidos/$slug", item: liquid, liquid };
}

function fields(rows: Resolved[]) {
  const facts = compareFacts(rows.map((row) => row.item));
  const extras = ["platforms", "kit_platforms"].flatMap((key) => {
    const values = rows.map((row) => relationRows(row.item).find((rel) => rel.key === key));
    if (values.every((row) => row == null)) return [];
    return [
      {
        key,
        label: values.find((row) => row)?.label ?? key,
        values: values.map((row) => row?.value ?? EMPTY),
        published: values.map((row) => row != null && row.value !== EMPTY),
      },
    ];
  });
  return [...facts, ...extras];
}

function toMetric(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "string") {
    if (value === EMPTY || value.trim() === "" || value.trim() === EMPTY) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metricValue(item: CatalogItem, key: string): number | null {
  if (item.domain === "device") {
    if (key === "power_max_w") return toMetric(item.powerMaxW);
    if (key === "power_min_w") return toMetric(item.powerMinW);
    if (key === "battery_mah") return toMetric(item.batteryMah);
    if (key === "capacity_ml") return toMetric(item.capacityMl);
    if (key === "weight_g") return toMetric(item.weightG);
    return null;
  }
  if (item.domain === "coil") {
    if (key === "watt_max") return toMetric(item.wattMax);
    if (key === "watt_min") return toMetric(item.wattMin);
    if (key === "pack_count") return toMetric(item.packCount);
    return null;
  }
  if (item.domain === "liquid" && key === "volume_ml") return toMetric(liquidVolumeMl(item));
  return null;
}

function bestIndices(key: string, rows: Resolved[]): number[] {
  const direction = BEST_DIRECTION[key];
  if (!direction) return [];
  const metrics = rows.map((row) => metricValue(row.item, key));
  const known = metrics.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (new Set(known).size < 2) return [];
  const target = direction === "max" ? Math.max(...known) : Math.min(...known);
  return metrics
    .map((value, index) => (value === target ? index : -1))
    .filter((index) => index >= 0);
}
