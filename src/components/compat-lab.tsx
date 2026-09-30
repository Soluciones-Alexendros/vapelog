import { Link } from "@tanstack/react-router";
import { coilBySlug, coils, deviceBySlug, devices, liquids } from "@/data/catalog";
import { compatibility, recommendLiquids, type LiquidFit, type LiquidFitKind } from "@/data/logic";
import {
  compatLabel,
  compatTone,
  fitLabel,
  fitTone,
  formatPlain,
  toneBorderClass,
  toneTextClass,
} from "@/components/labels";
import { ProductPhoto } from "@/components/photo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CompatSearch } from "@/components/compat-search";

export function CompatLab({
  search,
  onSearch,
}: {
  search: CompatSearch;
  onSearch: (next: CompatSearch) => void;
}) {
  const deviceSlug = search.device || devices[0]?.slug || "";
  const coilSlug =
    search.coil || coils.find((coil) => coil.slug.includes("0-8"))?.slug || coils[0]?.slug || "";
  const device = deviceBySlug(deviceSlug);
  const coil = coilBySlug(coilSlug);
  const result = device && coil ? compatibility(device, coil) : null;
  const fits = coil ? recommendLiquids(coil, liquids) : [];
  const byKind = groupFits(fits);
  const total = fits.length;
  const tone = result ? compatTone(result.kind) : "muted";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Laboratorio</p>
      <h1 className="mt-2 text-4xl text-foreground">Cruce</h1>
      <p className="mt-3 text-muted-foreground">
        Un mod con rosca 510 no “acepta una coil”. Acepta un atomizador, y la coil tiene que ser de
        ese atomizador. Aquí se separan las tres cosas.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label className="block text-sm text-muted-foreground" htmlFor="device">
            Dispositivo
          </label>
          <select
            id="device"
            className="mt-2"
            value={deviceSlug}
            onChange={(event) => onSearch({ ...search, device: event.target.value })}
          >
            {devices.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground" htmlFor="coil">
            Resistencia
          </label>
          <select
            id="coil"
            className="mt-2"
            value={coilSlug}
            onChange={(event) => onSearch({ ...search, coil: event.target.value })}
          >
            {coils.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.wattMin != null && item.wattMax != null
                  ? `${item.name} · ${formatPlain(item.ohms)} Ω · ${item.wattMin}–${item.wattMax} W`
                  : `${item.name} · ${formatPlain(item.ohms)} Ω`}
              </option>
            ))}
          </select>
        </div>
      </form>

      {device && coil && result ? (
        <section
          className={cn("mt-6 rounded-lg border bg-surface-2 p-5 shadow-1", toneBorderClass(tone))}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <ProductPhoto slug={device.slug} alt={device.name} frame="thumb" missing="note" />
              <span className="text-muted-foreground" aria-hidden>
                ×
              </span>
              <ProductPhoto slug={coil.slug} alt={coil.name} frame="thumb" missing="note" />
            </div>
            <h2 className="min-w-0 flex-1 text-2xl text-foreground">
              {device.name}{" "}
              <span className="text-muted-foreground" aria-hidden>
                ×
              </span>{" "}
              {coil.name}
            </h2>
            <Badge
              variant="outline"
              className={cn("border", toneBorderClass(tone), toneTextClass(tone))}
            >
              {compatLabel(result.kind)}
            </Badge>
          </div>
          <p
            className={cn(
              "mt-4 text-xs font-medium tracking-widest uppercase",
              toneTextClass(tone),
            )}
          >
            {compatLabel(result.kind)}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {result.reasons.map((reason, index) => (
              <li
                key={reason}
                className={cn(
                  "flex gap-3 text-sm",
                  index === 0 ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    index === 0 ? "bg-current" : "bg-border-strong",
                  )}
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link
              to="/dispositivos/$slug"
              params={{ slug: device.slug }}
              className="text-foreground underline decoration-border underline-offset-4"
            >
              Ficha del dispositivo
            </Link>
            <Link
              to="/resistencias/$slug"
              params={{ slug: coil.slug }}
              className="text-foreground underline decoration-border underline-offset-4"
            >
              Ficha de la resistencia
            </Link>
            <Link
              to="/herramientas"
              search={{ tab: "ohm", ohms: String(coil.ohms) }}
              className="text-foreground underline decoration-border underline-offset-4"
            >
              Abrir en la calculadora de Ohm
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-2xl text-foreground">Líquidos para esa resistencia</h2>
        {!coil ? (
          <p className="mt-3 text-sm text-muted-foreground" role="alert">
            Esa resistencia no está en el archivo. Revisa el enlace.
          </p>
        ) : !coil.refillable ? (
          <p className="mt-3 text-sm text-muted-foreground">
            La cápsula elegida llega precargada y no se rellena.
          </p>
        ) : total === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ningún líquido del archivo cruza con esa resistencia.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="tabular-nums text-foreground">{total}</span> líquidos cruzan con la
              calada publicada. Se agrupan por tipo de encaje.
            </p>
            <Accordion type="multiple" className="mt-4">
              {(["directo", "posible", "evitar"] as const).map((kind) => {
                const rows = byKind[kind];
                if (rows.length === 0) return null;
                return (
                  <AccordionItem
                    key={kind}
                    value={kind}
                    className={cn("border", toneBorderClass(fitTone(kind)))}
                  >
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <span className={toneTextClass(fitTone(kind))}>{fitLabel(kind)}</span>
                        <Badge variant="muted">{rows.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex flex-col gap-2">
                        {rows.map((fit) => (
                          <li
                            key={fit.liquid.id}
                            className="rounded-md border border-border bg-surface-2 p-3"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <Link
                                to="/liquidos/$slug"
                                params={{ slug: fit.liquid.slug }}
                                className="text-foreground underline decoration-border underline-offset-4"
                              >
                                {fit.liquid.name}
                              </Link>
                              <span
                                className={cn(
                                  "text-xs tracking-widest uppercase",
                                  toneTextClass(fitTone(fit.fit)),
                                )}
                              >
                                {fitLabel(fit.fit)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{fit.reason}</p>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </section>
    </div>
  );
}

function groupFits(fits: LiquidFit[]): Record<LiquidFitKind, LiquidFit[]> {
  const groups: Record<LiquidFitKind, LiquidFit[]> = { directo: [], posible: [], evitar: [] };
  for (const fit of fits) groups[fit.fit].push(fit);
  return groups;
}
