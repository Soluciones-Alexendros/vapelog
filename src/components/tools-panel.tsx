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
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ToolSearch } from "@/components/tool-search";

function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if ((trimmed.match(/,/g) ?? []).length > 1) return Number.NaN;
  if ((trimmed.match(/\./g) ?? []).length > 1) return Number.NaN;
  if (trimmed.includes(",") && trimmed.includes(".")) return Number.NaN;
  const normalized = trimmed.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
}

function num(value: string): number {
  return parseDecimal(value) ?? Number.NaN;
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
      <PageHeading as="h1" text="Calculadoras" className="mt-2 text-4xl text-foreground" />
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
  const mode: "watts" | "volts" = search.volts != null && search.volts !== "" ? "volts" : "watts";
  const ohmOptions = availableOhms(coils);
  const ohmsRaw = search.ohms ?? "";
  const wattsRaw = search.watts ?? "";
  const voltsRaw = search.volts ?? "";
  const deviceSlug = search.device ?? "";

  const ohmsParsed = ohmsRaw === "" ? null : parseDecimal(ohmsRaw);
  const wattsParsed = wattsRaw === "" ? null : parseDecimal(wattsRaw);
  const voltsParsed = voltsRaw === "" ? null : parseDecimal(voltsRaw);

  const matchedOption =
    ohmsParsed != null && Number.isFinite(ohmsParsed)
      ? ohmOptions.find((option) => round(option, 2) === round(ohmsParsed, 2))
      : undefined;

  const incomplete =
    ohmsRaw === "" ||
    (mode === "watts" ? wattsRaw === "" : voltsRaw === "") ||
    ohmsParsed === null ||
    (mode === "watts" ? wattsParsed === null : voltsParsed === null);

  const ambiguous =
    (ohmsRaw !== "" && Number.isNaN(ohmsParsed as number)) ||
    (mode === "watts" && wattsRaw !== "" && Number.isNaN(wattsParsed as number)) ||
    (mode === "volts" && voltsRaw !== "" && Number.isNaN(voltsParsed as number));

  const solved =
    incomplete || ambiguous
      ? null
      : solveOhm({
          ohms: matchedOption ?? (ohmsParsed as number),
          watts: mode === "watts" ? (wattsParsed as number) : undefined,
          volts: mode === "volts" ? (voltsParsed as number) : undefined,
        });

  const device = deviceSlug ? deviceBySlug(deviceSlug) : undefined;
  const powerEval =
    device && solved && !("error" in solved) ? powerNotes(device, solved.watts, solved.ohms) : null;
  const notes = powerEval?.notes ?? [];
  const recommendation =
    ohmsParsed != null && Number.isFinite(ohmsParsed)
      ? recommendedPowerForOhms(matchedOption ?? ohmsParsed, coils)
      : null;

  const setMode = (next: "watts" | "volts") => {
    if (next === "watts") {
      onSearch({ ...search, tab: "ohm", volts: undefined });
    } else {
      onSearch({ ...search, tab: "ohm", watts: undefined });
    }
  };

  const reset = () => {
    onSearch({ tab: "ohm" });
  };

  return (
    <form
      className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <fieldset>
        <legend className="text-sm font-medium text-foreground">Qué datos conoces</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          Indica la resistencia y exactamente uno de potencia o voltaje. El resto se calcula.
          Ejemplo de partida: 0,8 Ω y 14 W.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            aria-pressed={mode === "watts"}
            variant={mode === "watts" ? "secondary" : "quiet"}
            onClick={() => setMode("watts")}
          >
            Resistencia y potencia
          </Button>
          <Button
            type="button"
            aria-pressed={mode === "volts"}
            variant={mode === "volts" ? "secondary" : "quiet"}
            onClick={() => setMode("volts")}
          >
            Resistencia y voltaje
          </Button>
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          id="ohms"
          label="Resistencia"
          unit="Ω"
          help="Ohmios de la coil. Puedes elegir un valor del archivo o escribir otro."
        >
          <select
            id="ohms"
            aria-describedby="ohms-help"
            value={
              matchedOption != null
                ? String(matchedOption)
                : ohmsRaw !== "" && ohmOptions.every((o) => round(o, 2) !== round(num(ohmsRaw), 2))
                  ? ""
                  : ohmsRaw
            }
            onChange={(event) => {
              onSearch({ ...search, tab: "ohm", ohms: event.target.value || undefined });
            }}
          >
            <option value="">Selecciona o deja vacío</option>
            {ohmOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {`${formatPlain(option)} Ω`}
              </option>
            ))}
          </select>
          <Input
            className="mt-2"
            inputMode="decimal"
            placeholder="o escribe Ω"
            aria-label="Resistencia en ohmios, entrada libre"
            value={matchedOption != null ? String(matchedOption) : ohmsRaw}
            onChange={(event) =>
              onSearch({ ...search, tab: "ohm", ohms: event.target.value || undefined })
            }
          />
        </Field>

        {mode === "watts" ? (
          <Field
            id="watts"
            label="Potencia"
            unit="W"
            help="Vatios del regulado. Vacío no es cero."
            error={
              ambiguous && wattsRaw !== "" && Number.isNaN(wattsParsed as number)
                ? "Usa un solo separador decimal (coma o punto)."
                : undefined
            }
          >
            <Input
              id="watts"
              inputMode="decimal"
              aria-describedby="watts-help"
              value={wattsRaw}
              onChange={(event) =>
                onSearch({
                  ...search,
                  tab: "ohm",
                  watts: event.target.value || undefined,
                  volts: undefined,
                })
              }
            />
          </Field>
        ) : (
          <Field
            id="volts"
            label="Voltaje"
            unit="V"
            help="Voltios aplicados. Vacío no es cero."
            error={
              ambiguous && voltsRaw !== "" && Number.isNaN(voltsParsed as number)
                ? "Usa un solo separador decimal (coma o punto)."
                : undefined
            }
          >
            <Input
              id="volts"
              inputMode="decimal"
              aria-describedby="volts-help"
              value={voltsRaw}
              onChange={(event) =>
                onSearch({
                  ...search,
                  tab: "ohm",
                  volts: event.target.value || undefined,
                  watts: undefined,
                })
              }
            />
          </Field>
        )}
      </div>

      {recommendation?.hasPublished ? (
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
      ) : recommendation ? (
        <p className="mt-2 text-sm text-muted-foreground">{recommendation.note}</p>
      ) : null}

      <Field
        id="device-fit"
        label="Contrastar con un dispositivo del archivo"
        optional
        help="Compara la cifra con la ventana publicada del aparato. No es un dictamen de seguridad."
        className="mt-4"
      >
        <select
          id="device-fit"
          aria-describedby="device-fit-help"
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
      </Field>

      {ambiguous ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          Entrada numérica ambigua. Corrige el valor (una coma o un punto, no ambos).
        </p>
      ) : null}

      {incomplete && !ambiguous ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Faltan datos independientes. Completa resistencia y{" "}
          {mode === "watts" ? "potencia" : "voltaje"} para ver el resultado.
        </p>
      ) : null}

      {solved && "error" in solved ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {solved.error}
        </p>
      ) : null}

      {solved && !("error" in solved) ? (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-foreground">Resultado</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result label="Voltaje" value={`${formatPlain(round(solved.volts, 2))} V`} />
            <Result label="Corriente" value={`${formatPlain(round(solved.amps, 2))} A`} />
            <Result label="Potencia" value={`${formatPlain(round(solved.watts, 2))} W`} />
            <Result label="Resistencia" value={`${formatPlain(round(solved.ohms, 2))} Ω`} />
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === "watts"
              ? `Con ${formatPlain(round(solved.ohms, 2))} Ω y ${formatPlain(round(solved.watts, 2))} W: I = √(W/Ω) = ${formatPlain(round(solved.amps, 2))} A; V = I·Ω = ${formatPlain(round(solved.volts, 2))} V.`
              : `Con ${formatPlain(round(solved.ohms, 2))} Ω y ${formatPlain(round(solved.volts, 2))} V: I = V/Ω = ${formatPlain(round(solved.amps, 2))} A; W = V·I = ${formatPlain(round(solved.watts, 2))} W.`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cálculo eléctrico ideal. No afirma que la configuración sea segura, no equivale a la
            corriente de descarga de la batería en un mod regulado y no deduce CDR ni
            compatibilidad.
          </p>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note} className="text-sm text-muted-foreground">
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6">
        <Button type="button" variant="quiet" onClick={reset}>
          Reiniciar
        </Button>
      </div>
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
    if (shots === "") return Number.NaN;
    const parsed = num(shots);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : Number.NaN;
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

  const reset = () => {
    onSearch({
      tab: "nicokit",
      aroma: "50",
      botella: "60",
      shotMl: "10",
      shotMg: "20",
      shots: "1",
      objetivo: "3",
    });
  };

  return (
    <form
      className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <p className="text-sm text-muted-foreground">
        Distingue el volumen ya en la botella, el volumen añadido por cada shot, la concentración
        del shot y el objetivo final. Unidades en mililitros y mg/ml.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          id="aroma"
          label="Líquido 0 mg ya en la botella (ml)"
          unit="ml"
          help="Volumen existente a 0 mg/ml antes de añadir nicokits."
        >
          <Input
            id="aroma"
            inputMode="decimal"
            aria-describedby="aroma-help"
            value={aroma}
            onChange={(event) => patch({ aroma: event.target.value })}
          />
        </Field>
        <Field
          id="botella"
          label="Capacidad de la botella (ml)"
          unit="ml"
          help="Volumen máximo de la botella (objetivo de llenado)."
        >
          <Input
            id="botella"
            inputMode="decimal"
            aria-describedby="botella-help"
            value={botella}
            onChange={(event) => patch({ botella: event.target.value })}
          />
        </Field>
        <Field
          id="shotMl"
          label="Volumen de cada nicokit (ml)"
          unit="ml"
          help="Volumen de un shot individual."
        >
          <Input
            id="shotMl"
            inputMode="decimal"
            aria-describedby="shotMl-help"
            value={shotMl}
            onChange={(event) => patch({ shotMl: event.target.value })}
          />
        </Field>
        <Field
          id="shotMg"
          label="Graduación del nicokit (mg/ml)"
          unit="mg/ml"
          help="Concentración de nicotina del shot."
        >
          <Input
            id="shotMg"
            inputMode="decimal"
            aria-describedby="shotMg-help"
            value={shotMg}
            onChange={(event) => patch({ shotMg: event.target.value })}
          />
        </Field>
        <Field id="shots" label="Número de nicokits" help="Cantidad entera de shots añadidos.">
          <Input
            id="shots"
            inputMode="numeric"
            aria-describedby="shots-help"
            value={shots}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                patch({ shots: "" });
                return;
              }
              const parsed = num(value);
              if (!Number.isNaN(parsed)) patch({ shots: String(Math.max(0, Math.round(parsed))) });
            }}
          />
        </Field>
        <Field
          id="objetivo"
          label="Objetivo para calcular cuántos hacen falta (mg/ml)"
          unit="mg/ml"
          help="Concentración final deseada; se usa para estimar shots."
        >
          <Input
            id="objetivo"
            inputMode="decimal"
            aria-describedby="objetivo-help"
            value={objetivo}
            onChange={(event) => patch({ objetivo: event.target.value })}
          />
        </Field>
      </div>
      {"error" in mixed ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {mixed.error}
        </p>
      ) : (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-foreground">Balance de la mezcla</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
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
            <p className="mt-4 text-sm text-destructive" role="alert">
              Esos nicokits no caben en el hueco de la botella.
            </p>
          ) : null}
          {mixed.overTpdStrength ? (
            <p className="mt-2 text-sm text-warning">
              La mezcla supera 20 mg/ml. Ese techo es el de la venta TPD de líquidos con nicotina.
            </p>
          ) : null}
        </div>
      )}
      <div className="mt-6 border-t border-border pt-4">
        {"error" in target ? (
          <p className="text-sm text-destructive" role="alert">
            {target.error}
          </p>
        ) : (
          <>
            <p className="text-sm text-foreground">
              {num(objetivo) === 0
                ? `Objetivo 0 mg/ml: no hace falta añadir nicokits. Quedan ${formatPlain(round(target.finalMl, 2))} ml a 0 mg.`
                : `Para acercarse a ${formatPlain(num(objetivo))} mg/ml harían falta ${formatPlain(round(target.shots, 1))} nicokits de ${shotMl} ml a ${shotMg} mg/ml, partiendo de ${aroma} ml a 0 mg. Redondea al entero y vuelve a leer el resultado: un nicokit no se parte con precisión de laboratorio.`}
            </p>
            {target.overflow ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
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
      <div className="mt-6">
        <Button type="button" variant="quiet" onClick={reset}>
          Reiniciar
        </Button>
      </div>
    </form>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <dt className="text-xs tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
