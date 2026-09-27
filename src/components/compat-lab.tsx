import { Link } from "@tanstack/react-router";
import { coilBySlug, coils, deviceBySlug, devices, liquids } from "@/data/catalog";
import { compatibility, recommendLiquids } from "@/data/logic";
import { formatPlain } from "@/components/labels";

export interface CompatSearch {
  device?: string;
  coil?: string;
}

export function parseCompatSearch(search: Record<string, unknown>): CompatSearch {
  return {
    device: typeof search.device === "string" ? search.device : undefined,
    coil: typeof search.coil === "string" ? search.coil : undefined,
  };
}

const kindLabel = {
  nativa: "Encaja en la plataforma",
  kit: "Encaja en el tanque del kit",
  electrica: "Solo cruce eléctrico",
  no: "No encaja",
} as const;

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
                {item.name} · {formatPlain(item.ohms)} Ω
              </option>
            ))}
          </select>
        </div>
      </form>
      {device && coil && result ? (
        <section className="border border-border bg-card mt-6 rounded-lg p-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {kindLabel[result.kind]}
          </p>
          <h2 className="mt-2 text-3xl text-foreground">
            {device.name} × {coil.name}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {result.reasons.map((reason) => (
              <li key={reason} className="text-sm text-muted-foreground">
                {reason}
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
          </div>
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="text-2xl text-foreground">Líquidos para esa resistencia</h2>
        {!coil?.refillable ? (
          <p className="mt-3 text-sm text-muted-foreground">
            La cápsula elegida llega precargada y no se rellena.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {fits.map((fit) => (
              <li key={fit.liquid.id} className="border border-border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    to="/liquidos/$slug"
                    params={{ slug: fit.liquid.slug }}
                    className="text-foreground underline decoration-border underline-offset-4"
                  >
                    {fit.liquid.name}
                  </Link>
                  <span className="text-xs tracking-widest text-primary uppercase">{fit.fit}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{fit.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
