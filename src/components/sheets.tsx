import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Battery,
  Cable,
  Calendar,
  CircuitBoard,
  Cylinder,
  Droplets,
  Gauge,
  Package,
  Percent,
  Scale,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  brandById,
  coilBySlug,
  coils,
  deviceBySlug,
  devices,
  genreById,
  liquidBySlug,
  liquids,
  partBySlug,
  parts,
  variationRange,
} from "@/data/catalog";
import {
  compatibility,
  partsForDevice,
  recommendLiquids,
  type LiquidFit,
  type LiquidFitKind,
} from "@/data/logic";
import { EMPTY, relationRows, specFacts, specGroups, variationRows } from "@/data/specs";
import type { CatalogItem, Coil, CompatKind, Device, Domain } from "@/data/types";
import { useCompare } from "@/components/chrome";
import {
  compatLabel,
  compatTone,
  confidenceLabel,
  domainLabel,
  domainPath,
  fitLabel,
  fitTone,
  formatPlain,
  itemTpd,
  toneBgClass,
  toneBorderClass,
  toneTextClass,
  tpdLabel,
} from "@/components/labels";
import { Carousel } from "@/components/carousel";
import { ProductPhoto } from "@/components/photo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

interface SheetSection {
  id: string;
  label: string;
}

const DEVICE_SECTIONS: SheetSection[] = [
  { id: "resumen", label: "Resumen" },
  { id: "especificaciones", label: "Especificaciones" },
  { id: "componentes", label: "Componentes" },
  { id: "compatibilidad", label: "Compatibilidad" },
  { id: "liquidos", label: "Líquidos" },
  { id: "relacionados", label: "Relacionados" },
  { id: "fuentes", label: "Fuentes" },
];

const COIL_SECTIONS: SheetSection[] = [
  { id: "resumen", label: "Resumen" },
  { id: "especificaciones", label: "Especificaciones" },
  { id: "dispositivos", label: "Dispositivos" },
  { id: "relacionados", label: "Relacionados" },
  { id: "fuentes", label: "Fuentes" },
];

const LIQUID_SECTIONS: SheetSection[] = [
  { id: "resumen", label: "Resumen" },
  { id: "especificaciones", label: "Especificaciones" },
  { id: "variaciones", label: "Variaciones" },
  { id: "relacionados", label: "Relacionados" },
  { id: "fuentes", label: "Fuentes" },
];

const PART_SECTIONS: SheetSection[] = [
  { id: "resumen", label: "Resumen" },
  { id: "especificaciones", label: "Especificaciones" },
  { id: "donde", label: "Encaje" },
  { id: "relacionados", label: "Relacionados" },
  { id: "fuentes", label: "Fuentes" },
];

const heroKeys: Record<Domain, string[]> = {
  device: [
    "power_max_w",
    "power_note",
    "battery_mah",
    "battery_kind",
    "chipset",
    "connector",
    "draw",
    "capacity_ml",
    "weight_g",
    "year",
  ],
  coil: ["ohms", "watt_max", "watt_min", "wire_kind", "draw", "pack_count", "connector"],
  liquid: ["genre", "volume_ml", "has_nicotine", "nicotine_mg", "draw", "flavors"],
  part: ["family", "spec", "quantity"],
};

const chipIcons: Record<string, LucideIcon> = {
  power_max_w: Zap,
  power_note: Zap,
  battery_mah: Battery,
  battery_kind: Battery,
  chipset: CircuitBoard,
  connector: Cable,
  draw: Wind,
  capacity_ml: Cylinder,
  weight_g: Scale,
  year: Calendar,
  ohms: Gauge,
  watt_max: Zap,
  watt_min: Zap,
  wire_kind: CircuitBoard,
  pack_count: Package,
  volume_ml: Droplets,
  nicotine_mg: Percent,
  genre: Package,
  has_nicotine: Percent,
  flavors: Droplets,
  family: Package,
  spec: CircuitBoard,
  quantity: Package,
};

export function DeviceSheet({ slug }: { slug: string }) {
  const device = deviceBySlug(slug);
  if (!device) return <Missing />;
  return <DeviceBody key={device.slug} device={device} />;
}

function DeviceBody({ device }: { device: Device }) {
  const grouped = useMemo(() => {
    const buckets: Record<CompatKind, { coil: Coil; reasons: string[] }[]> = {
      nativa: [],
      kit: [],
      electrica: [],
      no: [],
    };
    for (const coil of coils) {
      const result = compatibility(device, coil);
      buckets[result.kind].push({ coil, reasons: result.reasons });
    }
    return buckets;
  }, [device]);

  const usable = [...grouped.nativa, ...grouped.kit, ...grouped.electrica];
  const [coilSlug, setCoilSlug] = useState(usable[0]?.coil.slug ?? "");
  const coil = coils.find((item) => item.slug === coilSlug);
  const fits = useMemo(() => (coil ? recommendLiquids(coil, liquids) : []), [coil]);
  const fitsByKind = useMemo(() => groupFits(fits), [fits]);
  const required = useMemo(() => partsForDevice(device, parts), [device]);

  return (
    <Sheet
      item={device}
      sections={DEVICE_SECTIONS}
      fact={[device.power, device.draws.join(" · ")].filter(Boolean).join(" · ")}
    >
      <Ficha item={device} />

      <SheetSectionBlock id="componentes" title="Componentes para usarlo">
        {required.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            La batería va integrada y esta ficha no tiene un recambio de boquilla distinto de la
            cápsula.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {required.map((part) => (
              <li
                key={part.id}
                className="rounded-lg border border-border bg-surface-2 p-3 shadow-1"
              >
                <Link
                  to="/componentes/$slug"
                  params={{ slug: part.slug }}
                  className="text-foreground underline decoration-border underline-offset-4"
                >
                  {part.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{part.quantityNote}</p>
              </li>
            ))}
          </ul>
        )}
      </SheetSectionBlock>

      <SheetSectionBlock id="compatibilidad" title="Compatibilidad">
        <CompatBlock grouped={grouped} />
      </SheetSectionBlock>

      <SheetSectionBlock id="liquidos" title="Líquido según la resistencia">
        {usable.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay resistencias del archivo que crucen con este dispositivo.
          </p>
        ) : (
          <>
            <label className="mt-4 block text-sm text-muted-foreground" htmlFor="coil-fit">
              Resistencia
            </label>
            <select
              id="coil-fit"
              className="mt-2 max-w-md"
              value={coilSlug}
              onChange={(event) => setCoilSlug(event.target.value)}
            >
              {usable.map((row) => (
                <option key={row.coil.id} value={row.coil.slug}>
                  {row.coil.name}
                </option>
              ))}
            </select>
            {coil && !coil.refillable ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Esta cápsula llega precargada. No se rellena con los líquidos del archivo.
              </p>
            ) : (
              <LiquidFits key={coilSlug} byKind={fitsByKind} />
            )}
          </>
        )}
      </SheetSectionBlock>
    </Sheet>
  );
}

export function CoilSheet({ slug }: { slug: string }) {
  const coil = coilBySlug(slug);
  if (!coil) return <Missing />;
  const matches = devices
    .map((device) => ({ device, result: compatibility(device, coil) }))
    .filter((row) => row.result.kind !== "no");
  return (
    <Sheet
      item={coil}
      sections={COIL_SECTIONS}
      fact={[`${formatPlain(coil.ohms)} Ω`, coil.draws.join(" · ")].filter(Boolean).join(" · ")}
    >
      <Ficha item={coil} />

      <SheetSectionBlock id="dispositivos" title="Dispositivos compatibles">
        {matches.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ningún dispositivo del archivo cruza con esta resistencia.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {matches.map((row) => {
              const tone = compatTone(row.result.kind);
              return (
                <li
                  key={row.device.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-surface-2 p-3 shadow-1",
                    toneBorderClass(tone),
                  )}
                >
                  <ProductPhoto
                    slug={row.device.slug}
                    alt={row.device.name}
                    frame="thumb"
                    missing="note"
                  />
                  <div className="min-w-0">
                    <Link
                      to="/dispositivos/$slug"
                      params={{ slug: row.device.slug }}
                      className="text-foreground underline decoration-border underline-offset-4"
                    >
                      {row.device.name}
                    </Link>
                    <p className={cn("mt-1 text-xs font-medium uppercase", toneTextClass(tone))}>
                      {compatLabel(row.result.kind)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.result.reasons[0]}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SheetSectionBlock>
    </Sheet>
  );
}

export function LiquidSheet({ slug }: { slug: string }) {
  const liquid = liquidBySlug(slug);
  if (!liquid) return <Missing />;
  const range = variationRange(liquid);
  const spanText = (values: { min: number; max: number }) =>
    values.min === values.max
      ? formatPlain(values.min)
      : `${formatPlain(values.min)}–${formatPlain(values.max)}`;
  const volumeText = range ? spanText(range.volumeMl) : "Sin dato";
  const strengths = liquid.variations
    .filter((variation) => variation.hasNicotine && variation.nicotineMg != null)
    .map((variation) => variation.nicotineMg as number);
  const nicotineText = strengths.length
    ? spanText({ min: Math.min(...strengths), max: Math.max(...strengths) })
    : null;
  const nicokit = liquid.variations.find(
    (variation) => !variation.hasNicotine && variation.assumedBottleMl != null,
  );
  const genreText = genreById(liquid.genreId)?.es ?? liquid.genreId;
  const nicotineSuffix = nicotineText ? ` · ${nicotineText} mg/ml` : " · sin nicotina";
  return (
    <Sheet
      item={liquid}
      sections={LIQUID_SECTIONS}
      fact={`${genreText} · ${volumeText} ml${nicotineSuffix}`}
    >
      <Ficha item={liquid} />

      <SheetSectionBlock id="variaciones" title="Variaciones">
        <p className="mt-2 text-sm text-muted-foreground">
          Cada variación es un envase con su volumen, graduación y ratio publicados.
        </p>
        <div className="mt-4">
          <SpecTable rows={variationRows(liquid)} />
        </div>
      </SheetSectionBlock>

      <p className="mt-6 text-sm text-muted-foreground">
        La venta con nicotina en la UE está sujeta a la TPD: como máximo 10 ml y 20 mg/ml por
        envase, con advertencias y notificación previa. Un shortfill a 0 mg puede ser mayor; la
        mezcla resultante tiene que leerse en la calculadora, no asumirse legal por el simple hecho
        de salir de un bote grande.
      </p>
      {nicokit ? (
        <Button asChild className="mt-6">
          <Link
            to="/herramientas"
            search={{
              tab: "nicokit",
              aroma: String(nicokit.volumeMl),
              botella: String(nicokit.assumedBottleMl),
            }}
          >
            Abrir en la calculadora de nicokit
          </Link>
        </Button>
      ) : null}
    </Sheet>
  );
}

export function PartSheet({ slug }: { slug: string }) {
  const part = partBySlug(slug);
  if (!part) return <Missing />;
  const hosts = devices.filter((device) => partsForDevice(device, [part]).length > 0);
  return (
    <Sheet item={part} sections={PART_SECTIONS} fact={part.spec}>
      <Ficha item={part} />

      <SheetSectionBlock id="donde" title="Dónde hace falta">
        {hosts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ningún dispositivo del archivo declara esta pieza como recambio.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {hosts.map((device) => (
              <li
                key={device.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 shadow-1"
              >
                <ProductPhoto slug={device.slug} alt={device.name} frame="thumb" missing="note" />
                <Link
                  to="/dispositivos/$slug"
                  params={{ slug: device.slug }}
                  className="min-w-0 text-foreground underline decoration-border underline-offset-4"
                >
                  {device.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SheetSectionBlock>
    </Sheet>
  );
}

function Sheet({
  item,
  fact,
  sections,
  children,
}: {
  item: CatalogItem;
  fact: string;
  sections: SheetSection[];
  children: ReactNode;
}) {
  const compare = useCompare();
  const brand = brandById(item.brandId);
  const path = domainPath(item.domain);
  const chips = heroChips(item);

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-sm text-muted-foreground" aria-label="Migas">
        <Link to="/" className="hover:text-primary">
          Catálogo
        </Link>
        <span className="mx-2" aria-hidden>
          ›
        </span>
        <Link to={path} className="hover:text-primary">
          {domainLabel(item.domain)}
        </Link>
        <span className="mx-2" aria-hidden>
          ›
        </span>
        <span className="text-foreground">{item.name}</span>
      </nav>

      <p className="mt-6 text-xs font-medium tracking-widest text-primary uppercase">
        {brand?.name} · {brand?.country}
      </p>
      <h1 className="mt-2 text-4xl text-foreground sm:text-5xl">{item.name}</h1>
      <p className="mt-3 text-muted-foreground">{fact}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline">{confidenceLabel(item.confidence)}</Badge>
        <Badge variant="outline">{tpdLabel(itemTpd(item))}</Badge>
        <Badge variant="muted">{item.status === "historico" ? "Histórico" : "Referenciado"}</Badge>
        <Badge variant="muted">{item.archiveId}</Badge>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={compare.has(item.slug) ? "default" : "secondary"}
          aria-pressed={compare.has(item.slug)}
          className={
            compare.has(item.slug) ? "font-semibold underline underline-offset-4" : undefined
          }
          onClick={() => compare.toggle({ domain: item.domain, slug: item.slug })}
        >
          {compare.has(item.slug) ? "En el comparador" : "Comparar"}
        </Button>
        <Button asChild variant="secondary">
          <Link
            to="/compatibilidad"
            search={{
              device: item.domain === "device" ? item.slug : "",
              coil: item.domain === "coil" ? item.slug : "",
            }}
          >
            Abrir en el cruce
          </Link>
        </Button>
      </div>

      <div
        id="resumen"
        data-ficha-section
        className="mt-10 grid scroll-mt-28 gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start"
      >
        {item.domain === "device" || item.domain === "coil" ? (
          <ProductPhoto
            slug={item.slug}
            alt={`${brand?.name ?? ""} ${item.name}`.trim()}
            frame="hero"
            missing="note"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center rounded-md border border-border bg-surface-3 p-6 text-center text-sm text-muted-foreground">
            Sin foto de fabricante en este dominio.
          </div>
        )}
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {chips.map((chip) => {
              const Icon = chipIcons[chip.key] ?? Gauge;
              return (
                <div
                  key={chip.key}
                  className="rounded-md border border-border bg-surface-2 p-3 shadow-1"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="text-xs tracking-wide uppercase">{chip.label}</span>
                  </div>
                  <p
                    className={
                      chip.published
                        ? "mt-2 text-sm font-medium text-foreground tabular-nums"
                        : "mt-2 text-sm text-muted-foreground"
                    }
                  >
                    {chip.display}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-base text-foreground">{item.summary}</p>
        </div>
      </div>

      <SheetIndex sections={sections} />

      <div>{children}</div>

      <RelatedItems item={item} />

      {item.caveats.length > 0 ? (
        <SheetSectionBlock id="limites" title="Límites de esta ficha">
          <ul className="mt-4 flex flex-col gap-3">
            {item.caveats.map((caveat) => (
              <li
                key={caveat}
                className="border-l-2 border-warning pl-4 text-sm text-muted-foreground"
              >
                {caveat}
              </li>
            ))}
          </ul>
        </SheetSectionBlock>
      ) : null}

      <SheetSectionBlock id="fuentes" title="Fuentes">
        {item.sources.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Sin URL citada. El nombre es de mercado; la etiqueta del lote manda. Está marcado como
            supuesto no verificado.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {item.sources.map((source) => (
              <li key={source.url}>
                <ExternalLink
                  href={source.url}
                  className="text-sm break-all text-foreground underline decoration-border underline-offset-4"
                >
                  {source.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </SheetSectionBlock>
    </article>
  );
}

function SheetIndex({ sections }: { sections: SheetSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-ficha-section]")).filter(
      (node) => sections.some((section) => section.id === node.id),
    );
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActive(visible[0]!.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Secciones de la ficha"
      className="sticky top-12 z-20 -mx-4 mt-8 border-y border-border bg-background/95 px-4 py-2 backdrop-blur"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {sections.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-sm px-3 text-sm whitespace-nowrap transition-colors duration-2 ease-out",
                  current
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SheetSectionBlock({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-ficha-section className={cn("mt-10 scroll-mt-28", className)}>
      <h2 className="text-2xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function CompatBlock({
  grouped,
}: {
  grouped: Record<CompatKind, { coil: Coil; reasons: string[] }[]>;
}) {
  const fitting: { kind: CompatKind; rows: { coil: Coil; reasons: string[] }[] }[] = [
    { kind: "nativa", rows: grouped.nativa },
    { kind: "kit", rows: grouped.kit },
    { kind: "electrica", rows: grouped.electrica },
  ];
  const hasFitting = fitting.some((group) => group.rows.length > 0);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Encaje separado en plataforma propia, tanque del kit y rosca 510. Lo que no cruza queda
        plegado, no borrado.
      </p>
      {hasFitting ? (
        fitting.map((group) =>
          group.rows.length > 0 ? (
            <CompatGroup key={group.kind} kind={group.kind} rows={group.rows} />
          ) : null,
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Ninguna resistencia del archivo encaja por plataforma ni por rosca 510 con este
          dispositivo.
        </p>
      )}
      {grouped.no.length > 0 ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="no">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <span className={toneTextClass(compatTone("no"))}>{compatLabel("no")}</span>
                <Badge variant="muted">{grouped.no.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <CompatRows rows={grouped.no} tone={compatTone("no")} label={compatLabel("no")} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}

function CompatGroup({
  kind,
  rows,
}: {
  kind: CompatKind;
  rows: { coil: Coil; reasons: string[] }[];
}) {
  const tone = compatTone(kind);
  return (
    <div className={cn("rounded-lg border p-4", toneBorderClass(tone), toneBgClass(tone))}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={cn("text-lg", toneTextClass(tone))}>{compatLabel(kind)}</h3>
        <Badge variant="muted">{rows.length}</Badge>
      </div>
      <CompatRows rows={rows} tone={tone} label={compatLabel(kind)} className="mt-3" />
    </div>
  );
}

function CompatRows({
  rows,
  tone,
  label,
  className,
}: {
  rows: { coil: Coil; reasons: string[] }[];
  tone: ReturnType<typeof compatTone>;
  label?: string;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className={cn("text-sm", toneTextClass(tone), className)}>
        Sin resistencias en este grupo.
      </p>
    );
  }
  return (
    <Carousel className={className} ariaLabel={label}>
      {rows.map((row) => (
        <li key={row.coil.id} className="w-72 shrink-0 snap-start">
          <Link
            to="/resistencias/$slug"
            params={{ slug: row.coil.slug }}
            className="flex h-full items-center gap-3 rounded-md border border-border bg-surface-2 p-2 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <ProductPhoto slug={row.coil.slug} alt={row.coil.name} frame="thumb" missing="note" />
            <div className="min-w-0">
              <span className="block underline decoration-border underline-offset-4">
                {row.coil.name}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">{row.reasons[0]}</p>
            </div>
          </Link>
        </li>
      ))}
    </Carousel>
  );
}

function LiquidFits({ byKind }: { byKind: Record<LiquidFitKind, LiquidFit[]> }) {
  const direct = byKind.directo;
  const total = direct.length + byKind.posible.length + byKind.evitar.length;

  if (total === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Ningún líquido del archivo cruza con esta resistencia.
      </p>
    );
  }

  const groups: { kind: LiquidFitKind; rows: LiquidFit[] }[] = [
    { kind: "posible", rows: byKind.posible },
    { kind: "evitar", rows: byKind.evitar },
  ];

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div
        className={cn("rounded-lg border p-4", toneBorderClass("success"), toneBgClass("success"))}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("text-lg", toneTextClass(fitTone("directo")))}>
            {fitLabel("directo")}
          </h3>
          <Badge variant="muted">{direct.length}</Badge>
        </div>
        <LiquidRows rows={direct} className="mt-3" label={fitLabel("directo")} />
      </div>

      {groups.some((group) => group.rows.length > 0) ? (
        <Accordion type="multiple">
          {groups.map((group) =>
            group.rows.length > 0 ? (
              <AccordionItem key={group.kind} value={group.kind}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <span className={toneTextClass(fitTone(group.kind))}>
                      {fitLabel(group.kind)}
                    </span>
                    <Badge variant="muted">{group.rows.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <LiquidRows rows={group.rows} label={fitLabel(group.kind)} />
                </AccordionContent>
              </AccordionItem>
            ) : null,
          )}
        </Accordion>
      ) : null}

      <p className="text-xs text-muted-foreground">
        La lectura cruza formato y calada publicados. No es una recomendación de consumo: la
        etiqueta del envase manda.
      </p>
    </div>
  );
}

function LiquidRows({
  rows,
  className,
  label,
}: {
  rows: LiquidFit[];
  className?: string;
  label?: string;
}) {
  return (
    <Carousel className={className} ariaLabel={label}>
      {rows.map((fit) => (
        <li key={fit.liquid.id} className="w-72 shrink-0 snap-start">
          <Link
            to="/liquidos/$slug"
            params={{ slug: fit.liquid.slug }}
            className="flex h-full flex-col gap-1 rounded-md border border-border bg-surface-2 p-3 text-foreground shadow-1 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="underline decoration-border underline-offset-4">
                {fit.liquid.name}
              </span>
              <span
                className={cn("text-xs tracking-widest uppercase", toneTextClass(fitTone(fit.fit)))}
              >
                {fitLabel(fit.fit)}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{fit.reason}</span>
          </Link>
        </li>
      ))}
    </Carousel>
  );
}

function groupFits(fits: LiquidFit[]): Record<LiquidFitKind, LiquidFit[]> {
  const groups: Record<LiquidFitKind, LiquidFit[]> = { directo: [], posible: [], evitar: [] };
  for (const fit of fits) groups[fit.fit].push(fit);
  return groups;
}

function Ficha({ item }: { item: CatalogItem }) {
  const relations = relationRows(item);
  const groups = specGroups(item);
  return (
    <SheetSectionBlock id="especificaciones" title="Especificaciones">
      <p className="mt-2 text-sm text-muted-foreground">
        La misma clave en todas las fichas de este tipo. Si la fuente no publica el dato, la casilla
        se queda vacía: no se inventa.
      </p>
      {relations.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg text-foreground">Relaciones</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No son características: el cruce las lee como filas, no como texto del diccionario.
          </p>
          <div className="mt-3">
            <SpecTable
              rows={relations.map((row) => ({
                key: row.key,
                label: row.label,
                display: row.value,
                published: row.value !== EMPTY,
              }))}
            />
          </div>
        </div>
      ) : null}
      <Accordion type="multiple" defaultValue={groups.map((group) => group.id)} className="mt-6">
        {groups.map((group) => (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger>{group.label}</AccordionTrigger>
            <AccordionContent>
              <SpecTable rows={group.facts} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SheetSectionBlock>
  );
}

function SpecTable({
  rows,
}: {
  rows: {
    key: string;
    label: string;
    display: string;
    published: boolean;
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dato</TableHead>
            <TableHead>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableHead scope="row" className="w-[12rem] text-muted-foreground">
                {row.label}
              </TableHead>
              <TableCell
                className={row.published ? "text-foreground tabular-nums" : "text-muted-foreground"}
              >
                {row.display}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function heroChips(item: CatalogItem) {
  const facts = specFacts(item);
  const byKey = new Map(facts.map((fact) => [fact.key, fact]));
  const picked: typeof facts = [];
  for (const key of heroKeys[item.domain]) {
    const fact = byKey.get(key);
    if (!fact) continue;
    if (picked.some((row) => row.key === fact.key)) continue;
    picked.push(fact);
    if (picked.length >= 8) break;
  }
  return picked;
}

function RelatedItems({ item }: { item: CatalogItem }) {
  const pool =
    item.domain === "device"
      ? devices
      : item.domain === "coil"
        ? coils
        : item.domain === "liquid"
          ? liquids
          : parts;
  const related = pool
    .filter(
      (row) =>
        row.id !== item.id &&
        (row.brandId === item.brandId || (item.familyId != null && row.familyId === item.familyId)),
    )
    .slice(0, 6);
  if (related.length === 0) return null;
  const path = domainPath(item.domain);
  return (
    <SheetSectionBlock id="relacionados" title="Relacionados">
      <p className="mt-2 text-sm text-muted-foreground">Misma marca o familia en el archivo.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((row) => (
          <li key={row.id} className="rounded-lg border border-border bg-surface-2 p-3 shadow-1">
            <Link
              to={`${path}/$slug`}
              params={{ slug: row.slug }}
              className="text-foreground underline decoration-border underline-offset-4"
            >
              {row.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{brandById(row.brandId)?.name}</p>
          </li>
        ))}
      </ul>
    </SheetSectionBlock>
  );
}

function Missing() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-4xl text-foreground">Esa ficha no está</h1>
      <p className="mt-3 text-muted-foreground">El archivo no tiene ese identificador.</p>
      <Button asChild variant="secondary" className="mt-6">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
