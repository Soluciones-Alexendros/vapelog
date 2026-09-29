import { useState } from "react";
import { coils, deviceBySlug, devices } from "@/data/catalog";
import {
  availableOhms,
  mixNicotine,
  powerNotes,
  recommendedPowerForOhms,
  round,
  shotsForTarget,
  solveOhm,
} from "@/data/logic";
import { formatPlain, toneTextClass } from "@/components/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ToolSearch {
  tab?: "ohm" | "nicokit";
  ohms?: string;
  watts?: string;
  volts?: string;
  device?: string;
  aroma?: string;
  botella?: string;
  shotMl?: string;
  shotMg?: string;
  shots?: string;
  objetivo?: string;
}

export function parseToolSearch(search: Record<string, unknown>): ToolSearch {
  const text = (key: string) => (typeof search[key] === "string" ? search[key] : undefined);
  const tab = search.tab === "nicokit" ? "nicokit" : search.tab === "ohm" ? "ohm" : undefined;
  return {
    tab,
    ohms: text("ohms"),
    watts: text("watts"),
    volts: text("volts"),
    device: text("device"),
    aroma: text("aroma"),
    botella: text("botella"),
    shotMl: text("shotMl"),
    shotMg: text("shotMg"),
    shots: text("shots"),
    objetivo: text("objetivo"),
  };
}

function num(value: string): number {
  return Number(value.replace(",", "."));
}

export function ToolsPanel({
  search,
  onSearch,
}: {
  search: ToolSearch;
  onSearch: (next: ToolSearch) => void;
}) {
  const tab = search.tab ?? "ohm";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Herramientas</p>
      <h1 className="mt-2 text-4xl text-foreground">Cálculo</h1>
      <p className="mt-3 text-muted-foreground">
        Ley de Ohm para un montaje regulado, y la mezcla de un shortfill con nicokits. No es una
        autorización para un mod mecánico.
      </p>
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Calculadoras">
        <Button
          type="button"
          role="tab"
          aria-selected={tab === "ohm"}
          variant={tab === "ohm" ? "secondary" : "quiet"}
          className={
            tab === "ohm"
              ? "font-semibold underline decoration-primary underline-offset-4"
              : undefined
          }
          onClick={() => onSearch({ ...search, tab: "ohm" })}
        >
          Ley de Ohm
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={tab === "nicokit"}
          variant={tab === "nicokit" ? "secondary" : "quiet"}
          className={
            tab === "nicokit"
              ? "font-semibold underline decoration-primary underline-offset-4"
              : undefined
          }
          onClick={() => onSearch({ ...search, tab: "nicokit" })}
        >
          Nicokit
        </Button>
      </div>
      {tab === "ohm" ? (
        <OhmForm search={search} onSearch={onSearch} />
      ) : (
        <NicoForm search={search} onSearch={onSearch} />
      )}
    </div>
  );
}

function OhmForm({
  search,
  onSearch,
}: {
  search: ToolSearch;
  onSearch: (next: ToolSearch) => void;
}) {
  const [mode, setMode] = useState<"watts" | "volts">(search.volts ? "volts" : "watts");
  const ohmOptions = availableOhms(coils);
  const parsedOhms = search.ohms != null && search.ohms !== "" ? num(search.ohms) : NaN;
  const matchedOption = !Number.isNaN(parsedOhms)
    ? ohmOptions.find((option) => round(option, 2) === round(parsedOhms, 2))
    : undefined;
  const ohms =
    matchedOption != null
      ? String(matchedOption)
      : ohmOptions.some((option) => round(option, 2) === round(0.8, 2))
        ? "0.8"
        : ohmOptions[0] != null
          ? String(ohmOptions[0])
          : "0.8";
  const watts = search.watts ?? "14";
  const volts = search.volts ?? "3.7";
  const deviceSlug = search.device ?? "";
  const solved = solveOhm({
    ohms: num(ohms),
    watts: mode === "watts" ? num(watts) : undefined,
    volts: mode === "volts" ? num(volts) : undefined,
  });
  const device = deviceSlug ? deviceBySlug(deviceSlug) : undefined;
  const notes = device && !("error" in solved) ? powerNotes(device, solved.watts, solved.ohms) : [];
  const recommendation = recommendedPowerForOhms(num(ohms), coils);
  const currentWatts = mode === "watts" ? num(watts) : "error" in solved ? NaN : solved.watts;
  const rangeMin = recommendation.wattMin;
  const rangeMax = recommendation.wattMax;
  const hasRange = recommendation.hasPublished && rangeMin != null && rangeMax != null;
  const inRecommendedRange =
    hasRange &&
    rangeMin != null &&
    rangeMax != null &&
    currentWatts >= rangeMin &&
    currentWatts <= rangeMax;

  return (
    <form
      className="border border-border bg-card mt-6 rounded-lg p-4 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <fieldset>
        <legend className="text-sm text-muted-foreground">
          Dato de partida, además de la resistencia
        </legend>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            aria-pressed={mode === "watts"}
            variant={mode === "watts" ? "secondary" : "quiet"}
            className={
              mode === "watts"
                ? "font-semibold underline decoration-primary underline-offset-4"
                : undefined
            }
            onClick={() => setMode("watts")}
          >
            Potencia
          </Button>
          <Button
            type="button"
            aria-pressed={mode === "volts"}
            variant={mode === "volts" ? "secondary" : "quiet"}
            className={
              mode === "volts"
                ? "font-semibold underline decoration-primary underline-offset-4"
                : undefined
            }
            onClick={() => setMode("volts")}
          >
            Voltaje
          </Button>
        </div>
      </fieldset>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-muted-foreground" htmlFor="ohms">
            Resistencia (Ω)
          </label>
          <select
            id="ohms"
            className="mt-2"
            value={ohms}
            onChange={(event) => {
              const v = event.target.value;
              const rec = recommendedPowerForOhms(num(v), coils);
              if (!rec.hasPublished || rec.representative == null) {
                onSearch({ ...search, tab: "ohm", ohms: v });
                return;
              }
              if (mode === "watts") {
                onSearch({ ...search, tab: "ohm", ohms: v, watts: String(rec.representative) });
                return;
              }
              const sv = solveOhm({ ohms: num(v), watts: rec.representative });
              if (!("error" in sv)) {
                onSearch({
                  ...search,
                  tab: "ohm",
                  ohms: v,
                  volts: String(round(sv.volts, 2)),
                });
              } else {
                onSearch({ ...search, tab: "ohm", ohms: v });
              }
            }}
          >
            <option value="">Selecciona resistencia</option>
            {ohmOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {`${formatPlain(option)} Ω`}
              </option>
            ))}
          </select>
        </div>
        {mode === "watts" ? (
          <Field
            id="watts"
            label="Potencia (W)"
            value={watts}
            onChange={(watts) => onSearch({ ...search, tab: "ohm", watts, volts: undefined })}
          />
        ) : (
          <Field
            id="volts"
            label="Voltaje (V)"
            value={volts}
            onChange={(volts) => onSearch({ ...search, tab: "ohm", volts, watts: undefined })}
          />
        )}
      </div>
      {hasRange ? (
        <p className={`mt-2 text-sm ${toneTextClass(inRecommendedRange ? "success" : "warning")}`}>
          {`Sugerido: ${formatPlain(rangeMin)}–${formatPlain(rangeMax)} W`}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{recommendation.note}</p>
      )}
      <label className="mt-4 block text-sm text-muted-foreground" htmlFor="device-fit">
        Contrastar con un dispositivo del archivo
      </label>
      <select
        id="device-fit"
        className="mt-2"
        value={deviceSlug}
        onChange={(event) =>
          onSearch({ ...search, tab: "ohm", device: event.target.value || undefined })
        }
      >
        <option value="">Ninguno</option>
        {devices.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
      {"error" in solved ? (
        <p className="mt-6 text-sm text-primary" role="alert">
          {solved.error}
        </p>
      ) : (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result label="Voltaje" value={`${formatPlain(round(solved.volts, 2))} V`} />
          <Result label="Corriente" value={`${formatPlain(round(solved.amps, 2))} A`} />
          <Result label="Potencia" value={`${formatPlain(round(solved.watts, 2))} W`} />
          <Result label="Resistencia" value={`${formatPlain(round(solved.ohms, 2))} Ω`} />
        </dl>
      )}
      {notes.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note} className="text-sm text-muted-foreground">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function NicoForm({
  search,
  onSearch,
}: {
  search: ToolSearch;
  onSearch: (next: ToolSearch) => void;
}) {
  const aroma = search.aroma ?? "50";
  const botella = search.botella ?? "60";
  const shotMl = search.shotMl ?? "10";
  const shotMg = search.shotMg ?? "20";
  const shots = search.shots ?? "1";
  const objetivo = search.objetivo ?? "3";
  const mixed = mixNicotine({
    aromaMl: num(aroma),
    bottleMl: num(botella),
    shotMl: num(shotMl),
    shotMg: num(shotMg),
    shots: num(shots),
  });
  const target = shotsForTarget(num(aroma), num(shotMl), num(shotMg), num(objetivo));
  const reachableShots =
    typeof target === "number"
      ? Array.from(new Set([Math.floor(target), Math.ceil(target)])).filter((k) => k >= 0)
      : [];

  const patch = (partial: ToolSearch) => onSearch({ ...search, tab: "nicokit", ...partial });

  return (
    <form
      className="border border-border bg-card mt-6 rounded-lg p-4 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="aroma"
          label="Líquido 0 mg ya en la botella (ml)"
          value={aroma}
          onChange={(aroma) => patch({ aroma })}
        />
        <Field
          id="botella"
          label="Capacidad de la botella (ml)"
          value={botella}
          onChange={(botella) => patch({ botella })}
        />
        <Field
          id="shotMl"
          label="Volumen de cada nicokit (ml)"
          value={shotMl}
          onChange={(shotMl) => patch({ shotMl })}
        />
        <Field
          id="shotMg"
          label="Graduación del nicokit (mg/ml)"
          value={shotMg}
          onChange={(shotMg) => patch({ shotMg })}
        />
        <Field
          id="shots"
          label="Número de nicokits"
          value={shots}
          onChange={(value) => {
            if (value === "") {
              patch({ shots: "" });
              return;
            }
            const parsed = num(value);
            if (!Number.isNaN(parsed)) patch({ shots: String(Math.max(0, Math.round(parsed))) });
          }}
        />
        <Field
          id="objetivo"
          label="Objetivo para calcular cuántos hacen falta (mg/ml)"
          value={objetivo}
          onChange={(objetivo) => patch({ objetivo })}
        />
      </div>
      {"error" in mixed ? (
        <p className="mt-6 text-sm text-primary" role="alert">
          {mixed.error}
        </p>
      ) : (
        <div className="mt-6">
          <dl className="grid grid-cols-2 gap-3">
            <Result label="Volumen final" value={`${formatPlain(round(mixed.finalMl, 2))} ml`} />
            <Result label="Graduación" value={`${formatPlain(round(mixed.mgPerMl, 2))} mg/ml`} />
            <Result label="Hueco libre" value={`${formatPlain(round(mixed.freeMl, 2))} ml`} />
            <Result
              label="Nicokits que caben enteros"
              value={String(Math.floor(mixed.freeMl / num(shotMl)))}
            />
          </dl>
          {mixed.overflow ? (
            <p className="mt-4 text-sm text-primary" role="alert">
              Esos nicokits no caben en el hueco de la botella.
            </p>
          ) : null}
          {mixed.overTpdStrength ? (
            <p className="mt-2 text-sm text-primary">
              La mezcla supera 20 mg/ml. Ese techo es el de la venta TPD de líquidos con nicotina.
            </p>
          ) : null}
        </div>
      )}
      <div className="mt-6 border-t border-border pt-4">
        {typeof target === "number" ? (
          <>
            <p className="text-sm text-foreground">
              Para acercarse a {formatPlain(num(objetivo))} mg/ml harían falta{" "}
              <span className="tabular-nums">{formatPlain(round(target, 1))}</span> nicokits de{" "}
              {shotMl} ml a {shotMg} mg/ml, partiendo de {aroma} ml a 0 mg. Redondea al entero y
              vuelve a leer el resultado: un nicokit no se parte con precisión de laboratorio.
            </p>
            {reachableShots.map((k) => {
              const probe = mixNicotine({
                aromaMl: num(aroma),
                bottleMl: num(botella),
                shotMl: num(shotMl),
                shotMg: num(shotMg),
                shots: k,
              });
              if ("error" in probe) return null;
              return (
                <p key={k} className="mt-2 text-sm text-muted-foreground">
                  {`Con ${k} nicokit(s) enteros: ${formatPlain(round(probe.mgPerMl, 2))} mg/ml`}
                </p>
              );
            })}
          </>
        ) : (
          <p className="text-sm text-primary">{target.error}</p>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Fórmula: mg/ml = (nicokits × ml del shot × mg/ml del shot) / (ml de aroma + ml añadidos). Un
        shortfill de 50 ml en botella de 60 ml con un shot de 10 ml a 20 mg/ml queda en 3,33 mg/ml.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        inputMode="decimal"
        className="mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <dt className="text-xs tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-2 font-display text-2xl text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
