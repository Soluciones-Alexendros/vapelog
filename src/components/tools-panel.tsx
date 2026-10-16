import { useState } from "react";
import { coils, deviceBySlug, devices } from "@/data/catalog";
import {
  availableOhms,
  mixNicotine,
  powerNotes,
  recommendedPowerForOhms,
  round,
  shotAlternatives,
  shotsForTarget,
  solveOhm,
} from "@/data/logic";
import { formatPlain } from "@/components/labels";
import { Link } from "@tanstack/react-router";
import { KineticHeading } from "@/components/kinetic-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ToolSearch } from "@/components/tool-search";

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
      <KineticHeading as="h1" text="Calculadoras" className="mt-2 text-4xl text-foreground" />
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
  const powerEval =
    device && !("error" in solved) ? powerNotes(device, solved.watts, solved.ohms) : null;
  const notes = powerEval?.notes ?? [];
  const recommendation = recommendedPowerForOhms(num(ohms), coils);

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
              onSearch({ ...search, tab: "ohm", ohms: event.target.value });
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
      {recommendation.hasPublished ? (
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>{recommendation.note}</p>
          <ul className="list-inside list-disc">
            {recommendation.references.map((ref) => (
              <li key={ref.coilId}>
                <Link
                  to="/resistencias/$slug"
                  params={{ slug: ref.coilSlug }}
                  className="underline decoration-border underline-offset-4"
                >
                  {ref.coilName}
                </Link>
                {`: ${formatPlain(ref.wattMin)}–${formatPlain(ref.wattMax)} W`}
              </li>
            ))}
          </ul>
        </div>
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
  const shotCount = (() => {
    if (shots === "") return NaN;
    const parsed = num(shots);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : NaN;
  })();
  const mixed = mixNicotine({
    initialZeroMgMl: num(aroma),
    bottleMl: num(botella),
    shotMl: num(shotMl),
    shotMg: num(shotMg),
    shots: Number.isFinite(shotCount) ? shotCount : 0,
  });
  const target = shotsForTarget(num(aroma), num(shotMl), num(shotMg), num(objetivo), num(botella));
  const alternatives = shotAlternatives(
    num(aroma),
    num(botella),
    num(shotMl),
    num(shotMg),
    num(objetivo),
  );

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
            <Result label="Hueco inicial" value={`${formatPlain(round(mixed.freeMl, 2))} ml`} />
            <Result
              label="Espacio tras la mezcla"
              value={`${formatPlain(round(mixed.remainingMl, 2))} ml`}
            />
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
        {"error" in target ? (
          <p className="text-sm text-primary">{target.error}</p>
        ) : (
          <>
            <p className="text-sm text-foreground">
              {num(objetivo) === 0
                ? `Objetivo 0 mg/ml: no hace falta añadir nicokits. Quedan ${formatPlain(round(target.finalMl, 2))} ml a 0 mg.`
                : `Para acercarse a ${formatPlain(num(objetivo))} mg/ml harían falta ${formatPlain(round(target.shots, 1))} nicokits de ${shotMl} ml a ${shotMg} mg/ml, partiendo de ${aroma} ml a 0 mg. Redondea al entero y vuelve a leer el resultado: un nicokit no se parte con precisión de laboratorio.`}
            </p>
            {target.overflow ? (
              <p className="mt-2 text-sm text-primary" role="alert">
                Esa cantidad exacta desbordaría la botella.
              </p>
            ) : null}
            {alternatives.map((alt) => (
              <p key={alt.shots} className="mt-2 text-sm text-muted-foreground">
                {`Con ${alt.shots} nicokit(s) enteros: ${formatPlain(round(alt.mgPerMl, 2))} mg/ml`}
                {alt.overflow ? " (desborda la botella)" : ""}
              </p>
            ))}
          </>
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
