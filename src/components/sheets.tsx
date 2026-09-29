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
import { useMemo, useState, type ReactNode } from "react";
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
import { compatibility, partsForDevice, recommendLiquids } from "@/data/logic";
import { EMPTY, relationRows, specFacts, specGroups, variationRows } from "@/data/specs";
import type { CatalogItem, Coil, Confidence, Device, Domain } from "@/data/types";
import { useCompare } from "@/components/chrome";
import {
  confidenceLabel,
  domainLabel,
  domainPath,
  formatPlain,
  itemTpd,
  tpdLabel,
} from "@/components/labels";
import { ProductPhoto } from "@/components/photo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "@/components/ui/external-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    const buckets: Record<string, { coil: Coil; reasons: string[] }[]> = {
      nativa: [],
      kit: [],
      electrica: [],
      no: [],
    };
    for (const coil of coils) {
      const result = compatibility(device, coil);
      buckets[result.kind]?.push({ coil, reasons: result.reasons });
    }
    return buckets;
  }, [device]);
  const usable = [...(grouped.nativa ?? []), ...(grouped.kit ?? []), ...(grouped.electrica ?? [])];
  const [coilSlug, setCoilSlug] = useState(usable[0]?.coil.slug ?? "");
  const coil = coils.find((item) => item.slug === coilSlug);
  const fits = coil ? recommendLiquids(coil, liquids) : [];
  const required = partsForDevice(device, parts);

  return (
    <Sheet
      item={device}
      fact={[device.power, device.draws.join(" · ")].filter(Boolean).join(" · ")}
    >
      <Ficha item={device} />
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Componentes para usarlo</h2>
        {required.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            La batería va integrada y esta ficha no tiene un recambio de boquilla distinto de la
            cápsula.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {required.map((part) => (
              <li key={part.id} className="rounded-lg border border-border bg-card p-3">
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
      </section>
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Cruces con resistencias</h2>
        <CompatList title="Plataforma propia" rows={grouped.nativa ?? []} />
        <CompatList title="Tanque incluido en el kit" rows={grouped.kit ?? []} />
        <CompatList title="Solo compatibilidad eléctrica 510" rows={grouped.electrica ?? []} />
        <details className="mt-4 rounded-lg border border-border bg-card p-4">
          <summary className="min-h-11 cursor-pointer text-sm text-muted-foreground">
            No encajan ({grouped.no?.length ?? 0})
          </summary>
          <CompatList title="" rows={grouped.no ?? []} />
        </details>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Líquido según la coil</h2>
        {usable.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay coils del archivo que crucen con este dispositivo.
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
              <ul className="mt-4 flex flex-col gap-2">
                {fits.map((fit) => (
                  <li key={fit.liquid.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        to="/liquidos/$slug"
                        params={{ slug: fit.liquid.slug }}
                        className="text-foreground underline decoration-border underline-offset-4"
                      >
                        {fit.liquid.name}
                      </Link>
                      <span className="text-xs tracking-widest text-primary uppercase">
                        {fit.fit}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{fit.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
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
      fact={[`${formatPlain(coil.ohms)} Ω`, coil.draws.join(" · ")].filter(Boolean).join(" · ")}
    >
      <Ficha item={coil} />
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Dispositivos del archivo</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {matches.map((row) => (
            <li key={row.device.id} className="rounded-lg border border-border bg-card p-3">
              <Link
                to="/dispositivos/$slug"
                params={{ slug: row.device.slug }}
                className="text-foreground underline decoration-border underline-offset-4"
              >
                {row.device.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{row.result.reasons[0]}</p>
            </li>
          ))}
        </ul>
      </section>
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
    <Sheet item={liquid} fact={`${genreText} · ${volumeText} ml${nicotineSuffix}`}>
      <Ficha item={liquid} />
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Variaciones</h2>
        <SpecTable rows={variationRows(liquid)} />
      </section>
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
    <Sheet item={part} fact={part.spec}>
      <Ficha item={part} />
      <section className="mt-10">
        <h2 className="text-2xl text-foreground">Dónde hace falta</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {hosts.map((device) => (
            <li key={device.id} className="rounded-lg border border-border bg-card p-3">
              <Link
                to="/dispositivos/$slug"
                params={{ slug: device.slug }}
                className="text-foreground underline decoration-border underline-offset-4"
              >
                {device.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Sheet>
  );
}

function Sheet({ item, fact, children }: { item: CatalogItem; fact: string; children: ReactNode }) {
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

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
        {item.domain === "device" || item.domain === "coil" ? (
          <ProductPhoto
            slug={item.slug}
            alt={`${brand?.name ?? ""} ${item.name}`.trim()}
            frame="hero"
            missing="note"
          />
        ) : (
          <div className="rounded-md border border-border bg-muted p-6 text-sm text-muted-foreground">
            Sin foto de fabricante en este dominio.
          </div>
        )}
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {chips.map((chip) => {
              const Icon = chipIcons[chip.key] ?? Gauge;
              return (
                <div key={chip.key} className="rounded-md border border-border bg-card p-3">
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

      <div className="mt-10">{children}</div>

      <RelatedItems item={item} />

      {item.caveats.length > 0 ? (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Límites de esta ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {item.caveats.map((caveat) => (
                <li
                  key={caveat}
                  className="border-l-2 border-primary pl-4 text-sm text-muted-foreground"
                >
                  {caveat}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fuentes</CardTitle>
        </CardHeader>
        <CardContent>
          {item.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin URL citada. El nombre es de mercado; la etiqueta del lote manda. Está marcado como
              supuesto no verificado.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
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
        </CardContent>
      </Card>
    </article>
  );
}

function Ficha({ item }: { item: CatalogItem }) {
  const relations = relationRows(item);
  const groups = specGroups(item);
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        La misma clave en todas las fichas de este tipo. Si la fuente no publica el dato, la casilla
        se queda vacía: no se inventa.
      </p>
      {relations.length > 0 ? (
        <section>
          <h2 className="text-2xl text-foreground">Relaciones</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No son características: el cruce las lee como filas, no como texto del diccionario.
          </p>
          <SpecTable
            rows={relations.map((row) => ({
              key: row.key,
              label: row.label,
              display: row.value,
              published: row.value !== EMPTY,
              confidence: null,
            }))}
          />
        </section>
      ) : null}
      <Accordion type="multiple" defaultValue={groups.map((group) => group.id)}>
        {groups.map((group) => (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger>{group.label}</AccordionTrigger>
            <AccordionContent>
              <SpecTable rows={group.facts} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
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
    confidence: string | null;
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dato</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Confianza</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const confidence = publishedConfidence(row.confidence);
            return (
              <TableRow key={row.key}>
                <TableHead scope="row" className="w-[12rem] text-muted-foreground">
                  {row.label}
                </TableHead>
                <TableCell
                  className={
                    row.published ? "text-foreground tabular-nums" : "text-muted-foreground"
                  }
                >
                  {row.display}
                </TableCell>
                <TableCell className="text-xs tracking-wide text-muted-foreground uppercase">
                  {row.published && confidence ? confidenceLabel(confidence) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
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
    <section className="mt-10">
      <h2 className="text-2xl text-foreground">Relacionados</h2>
      <p className="mt-2 text-sm text-muted-foreground">Misma marca o familia en el archivo.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((row) => (
          <li key={row.id} className="rounded-lg border border-border bg-card p-3">
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
    </section>
  );
}

function publishedConfidence(value: string | null): Confidence | null {
  if (value === "fabricante" || value === "ficha" || value === "distribuidor") return value;
  return null;
}

function CompatList({ title, rows }: { title: string; rows: { coil: Coil; reasons: string[] }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4">
      {title ? <h3 className="text-lg text-foreground">{title}</h3> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.coil.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <ProductPhoto slug={row.coil.slug} alt={row.coil.name} frame="thumb" />
            <div className="min-w-0">
              <Link
                to="/resistencias/$slug"
                params={{ slug: row.coil.slug }}
                className="text-foreground underline decoration-border underline-offset-4"
              >
                {row.coil.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{row.reasons[0]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
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
