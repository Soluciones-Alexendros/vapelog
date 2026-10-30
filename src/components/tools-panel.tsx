import { useId, useRef, type KeyboardEvent } from "react";
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
import { NICOKIT_EXAMPLE, type ToolSearch } from "@/components/tool-search";

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

const TABS = [
  { id: "ohm" as const, label: "Ley de Ohm" },
  { id: "nicokit" as const, label: "Nicokit" },
];

export function ToolsPanel({
  search,
  onSearch,
}: {
  search: ToolSearch;
  onSearch: (next: ToolSearch) => void;
}) {
  const tab = search.tab ?? "ohm";
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (next: "ohm" | "nicokit") => {
    onSearch({ ...search, tab: next });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }
    if (nextIndex == null) return;
    event.preventDefault();
    selectTab(TABS[nextIndex]!.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Herramientas</p>
      <PageHeading as="h1" text="Calculadoras" className="mt-2 text-4xl text-foreground" />
      <p className="mt-3 text-muted-foreground">
        Ley de Ohm para un montaje regulado, y la mezcla de un shortfill con nicokits. No es una
        autorización para un mod mecánico.
      </p>
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Calculadoras">
        {TABS.map((entry, index) => {
          const selected = tab === entry.id;
          const tabId = `${baseId}-tab-${entry.id}`;
          const panelId = `${baseId}-panel-${entry.id}`;
          return (
            <Button
              key={entry.id}
              type="button"
              role="tab"
              id={tabId}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              variant={selected ? "secondary" : "quiet"}
              className={
                selected
                  ? "font-semibold underline decoration-primary underline-offset-4"
                  : undefined
              }
              onClick={() => selectTab(entry.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {entry.label}
            </Button>
          );
        })}
      </div>
      {tab === "ohm" ? (
        <div role="tabpanel" id={`${baseId}-panel-ohm`} aria-labelledby={`${baseId}-tab-ohm`}>
          <OhmForm search={search} onSearch={onSearch} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`${baseId}-panel-nicokit`}
          aria-labelledby={`${baseId}-tab-nicokit`}
        >
          <NicoForm search={search} onSearch={onSearch} />
        </div>
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
  const datalistId = useId();

  const ohmsParsed = ohmsRaw === "" ? null : parseDecimal(ohmsRaw);
  const wattsParsed = wattsRaw === "" ? null : parseDecimal(wattsRaw);
  const voltsParsed = voltsRaw === "" ? null : parseDecimal(voltsRaw);

  const matchingCoils =
    ohmsParsed != null && Number.isFinite(ohmsParsed)
      ? coils.filter((coil) => Math.abs(round(coil.ohms, 2) - round(ohmsParsed, 2)) < 1e-9)
      : [];

  const incomplete =
    ohmsRaw === "" ||
    (mode === "watts" ? wattsRaw === "" : voltsRaw === "") ||
    ohmsParsed === null ||
    (mode === "watts" ? wattsParsed === null : voltsParsed === null);

  const ambiguous =
    (ohmsRaw !== "" && Number.isNaN(ohmsParsed as number)) ||
    (mode === "watts" && wattsRaw !== "" && Number.isNaN(wattsParsed as number)) ||
    (mode === "volts" && voltsRaw !== "" && Number.isNaN(voltsParsed as number));

  // La fórmula usa el valor tecleado, sin sustituirlo por un ohmio del archivo.
  const solved =
    incomplete || ambiguous
      ? null
      : solveOhm({
          ohms: ohmsParsed as number,
          watts: mode === "watts" ? (wattsParsed as number) : undefined,
          volts: mode === "volts" ? (voltsParsed as number) : undefined,
        });

  const device = deviceSlug ? deviceBySlug(deviceSlug) : undefined;
  const powerEval =
    device && solved && !("error" in solved) ? powerNotes(device, solved.watts, solved.ohms) : null;
  const notes = powerEval?.notes ?? [];
  const recommendation =
    ohmsParsed != null && Number.isFinite(ohmsParsed)
      ? recommendedPowerForOhms(ohmsParsed, coils)
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
          help="Ohmios de la coil. Puedes sugerir un valor del archivo o escribir otro."
        >
          <Input
            id="ohms"
            list={datalistId}
            inputMode="decimal"
            aria-describedby="ohms-help"
            placeholder="p. ej. 0,8"
            value={ohmsRaw}
            onChange={(event) =>
              onSearch({ ...search, tab: "ohm", ohms: event.target.value || undefined })
            }
          />
          <datalist id={datalistId}>
            {ohmOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {`${formatPlain(option)} Ω`}
              </option>
            ))}
          </datalist>
          {matchingCoils.length === 1 ? (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Coincide con «{matchingCoils[0]!.name}»
            </p>
          ) : matchingCoils.length > 1 ? (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Coincide con {matchingCoils.length} resistencias del archivo a{" "}
              {formatPlain(round(ohmsParsed as number, 2))} Ω
            </p>
          ) : null}
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
  const aroma = search.aroma ?? "";
  const botella = search.botella ?? "";
  const shotMl = search.shotMl ?? "";
  const shotMg = search.shotMg ?? "";
  const shots = search.shots ?? "";
  const objetivo = search.objetivo ?? "";

  const aromaParsed = aroma === "" ? null : parseDecimal(aroma);
  const botellaParsed = botella === "" ? null : parseDecimal(botella);
  const shotMlParsed = shotMl === "" ? null : parseDecimal(shotMl);
  const shotMgParsed = shotMg === "" ? null : parseDecimal(shotMg);
  const shotsParsed = shots === "" ? null : parseDecimal(shots);
  const objetivoParsed = objetivo === "" ? null : parseDecimal(objetivo);

  const missing: string[] = [];
  if (aroma === "") missing.push("líquido 0 mg");
  if (botella === "") missing.push("capacidad de la botella");
  if (shotMl === "") missing.push("volumen del nicokit");
  if (shotMg === "") missing.push("graduación del nicokit");
  if (shots === "") missing.push("número de nicokits");

  const shotsNotInteger =
    shotsParsed != null && Number.isFinite(shotsParsed) && !Number.isInteger(shotsParsed);

  const requiredReady =
    missing.length === 0 &&
    !shotsNotInteger &&
    aromaParsed != null &&
    botellaParsed != null &&
    shotMlParsed != null &&
    shotMgParsed != null &&
    shotsParsed != null &&
    [aromaParsed, botellaParsed, shotMlParsed, shotMgParsed, shotsParsed].every(Number.isFinite);

  const mixed = requiredReady
    ? mixNicotine({
        initialZeroMgMl: aromaParsed as number,
        bottleMl: botellaParsed as number,
        shotMl: shotMlParsed as number,
        shotMg: shotMgParsed as number,
        shots: shotsParsed as number,
      })
    : null;

  const targetReady =
    aroma !== "" &&
    shotMl !== "" &&
    shotMg !== "" &&
    objetivo !== "" &&
    aromaParsed != null &&
    shotMlParsed != null &&
    shotMgParsed != null &&
    objetivoParsed != null &&
    [aromaParsed, shotMlParsed, shotMgParsed, objetivoParsed].every(Number.isFinite);

  const target = targetReady
    ? shotsForTarget(
        aromaParsed as number,
        shotMlParsed as number,
        shotMgParsed as number,
        objetivoParsed as number,
        botellaParsed != null && Number.isFinite(botellaParsed) ? botellaParsed : undefined,
      )
    : null;

  const alternatives =
    targetReady &&
    botellaParsed != null &&
    Number.isFinite(botellaParsed) &&
    aromaParsed != null &&
    shotMlParsed != null &&
    shotMgParsed != null &&
    objetivoParsed != null
      ? shotAlternatives(aromaParsed, botellaParsed, shotMlParsed, shotMgParsed, objetivoParsed)
      : [];

  const exampleMix = mixNicotine({ ...NICOKIT_EXAMPLE });
  const exampleMg = "error" in exampleMix ? null : formatPlain(round(exampleMix.mgPerMl, 2));

  const patch = (partial: ToolSearch) => onSearch({ ...search, tab: "nicokit", ...partial });

  const reset = () => {
    onSearch({ tab: "nicokit" });
  };

  const fitCount =
    mixed &&
    !("error" in mixed) &&
    shotMlParsed != null &&
    Number.isFinite(shotMlParsed) &&
    shotMlParsed > 0
      ? Math.floor(mixed.freeMl / shotMlParsed)
      : null;
  const showFitCount =
    fitCount != null && Number.isFinite(fitCount) && fitCount !== Number.POSITIVE_INFINITY;

  return (
    <form
      className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <p className="text-sm text-muted-foreground">
        Distingue el volumen ya en la botella, el volumen añadido por cada shot, la concentración
        del shot y el objetivo final. Unidades en mililitros y mg/ml. Vacío no es cero.
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
            placeholder="50"
            value={aroma}
            onChange={(event) => patch({ aroma: event.target.value || undefined })}
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
            placeholder="60"
            value={botella}
            onChange={(event) => patch({ botella: event.target.value || undefined })}
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
            placeholder="10"
            value={shotMl}
            onChange={(event) => patch({ shotMl: event.target.value || undefined })}
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
            placeholder="20"
            value={shotMg}
            onChange={(event) => patch({ shotMg: event.target.value || undefined })}
          />
        </Field>
        <Field
          id="shots"
          label="Número de nicokits"
          help="Cantidad entera de shots añadidos."
          error={shotsNotInteger ? "Introduce un número entero" : undefined}
        >
          <Input
            id="shots"
            inputMode="numeric"
            aria-describedby="shots-help"
            placeholder="1"
            value={shots}
            onChange={(event) => patch({ shots: event.target.value || undefined })}
          />
        </Field>
        <Field
          id="objetivo"
          label="Objetivo para calcular cuántos hacen falta (mg/ml)"
          unit="mg/ml"
          help="Concentración final deseada; se usa para estimar shots."
          optional
        >
          <Input
            id="objetivo"
            inputMode="decimal"
            aria-describedby="objetivo-help"
            placeholder="3"
            value={objetivo}
            onChange={(event) => patch({ objetivo: event.target.value || undefined })}
          />
        </Field>
      </div>

      {!requiredReady ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          {shotsNotInteger
            ? "Introduce un número entero"
            : missing.length > 0
              ? `Faltan datos: ${missing.join(", ")}.`
              : "Corrige los valores numéricos para ver el balance."}
        </p>
      ) : null}

      {mixed && "error" in mixed ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {mixed.error}
        </p>
      ) : null}

      {mixed && !("error" in mixed) ? (
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
            {showFitCount ? (
              <Result label="Nicokits que caben enteros" value={String(fitCount)} />
            ) : null}
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
      ) : null}

      <div className="mt-6 border-t border-border pt-4">
        {!targetReady ? (
          <p className="text-sm text-muted-foreground" role="status">
            Completa aroma, nicokit, graduación y objetivo para estimar cuántos shots hacen falta.
          </p>
        ) : target && "error" in target ? (
          <p className="text-sm text-destructive" role="alert">
            {target.error}
          </p>
        ) : target && !("error" in target) ? (
          <>
            <p className="text-sm text-foreground">
              {objetivoParsed === 0
                ? `Objetivo 0 mg/ml: no hace falta añadir nicokits. Quedan ${formatPlain(round(target.finalMl, 2))} ml a 0 mg.`
                : `Para acercarse a ${formatPlain(objetivoParsed as number)} mg/ml harían falta ${formatPlain(round(target.shots, 1))} nicokits de ${shotMl} ml a ${shotMg} mg/ml, partiendo de ${aroma} ml a 0 mg. Redondea al entero y vuelve a leer el resultado: un nicokit no se parte con precisión de laboratorio.`}
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
        ) : null}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Fórmula: mg/ml = (nicokits × ml del shot × mg/ml del shot) / (ml de aroma + ml añadidos). Un
        shortfill de {NICOKIT_EXAMPLE.initialZeroMgMl} ml en botella de {NICOKIT_EXAMPLE.bottleMl}{" "}
        ml con un shot de {NICOKIT_EXAMPLE.shotMl} ml a {NICOKIT_EXAMPLE.shotMg} mg/ml queda en{" "}
        {exampleMg ?? "—"} mg/ml.
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
