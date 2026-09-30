import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { brandById } from "@/data/catalog";
import { normalize } from "@/data/logic";
import { exampleCount, exampleQueries, itemsFor } from "@/data/search";
import type { Domain } from "@/data/types";
import { domainLabel } from "@/components/labels";
import { FichaLink } from "@/components/ficha-link";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Paleta de comandos y búsqueda (F7).
 *
 * Lee `src/data/search.ts` (`itemsFor`, `exampleQueries`) sin nuevas
 * dependencias (Radix Dialog ya está). Atajo `/` para abrir, `Esc` para
 * cerrar (Radix), navegación por teclado con flechas entre enlaces,
 * accesible con rol `dialog` + título/descripción ARIA.
 */

const COMMANDS = [
  { id: "inicio", label: "Inicio", hint: "El catálogo", to: "/" },
  {
    id: "dispositivos",
    label: "Dispositivos",
    hint: "Formato, vatios y batería",
    to: "/dispositivos",
  },
  {
    id: "resistencias",
    label: "Resistencias",
    hint: "Ohmios, calada y malla",
    to: "/resistencias",
  },
  { id: "liquidos", label: "Líquidos", hint: "Sales y shortfill", to: "/liquidos" },
  { id: "componentes", label: "Componentes", hint: "Celdas y boquillas", to: "/componentes" },
  { id: "buscar", label: "Buscar", hint: "Por característica", to: "/buscar" },
  { id: "cruce", label: "Cruce", hint: "Dispositivo × resistencia", to: "/compatibilidad" },
  { id: "calculo", label: "Cálculo", hint: "Ohm y nicokit", to: "/herramientas" },
  { id: "tabla", label: "Tabla", hint: "Archivo completo", to: "/archivo" },
  { id: "blog", label: "Blog", hint: "Novedades", to: "/blog" },
  { id: "modelo", label: "Modelo", hint: "Modelo de datos", to: "/modelo" },
  { id: "comparar", label: "Comparador", hint: "Hasta cuatro fichas", to: "/comparar" },
] as const;

type CommandTo = (typeof COMMANDS)[number]["to"];

interface FichaHit {
  id: string;
  domain: Domain;
  slug: string;
  name: string;
  brand: string;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function resultAnchors(list: HTMLElement | null): HTMLAnchorElement[] {
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLAnchorElement>("a"));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Atajo `/` para abrir (fuera de campos editables y sin modificadores).
  useEffect(() => {
    if (open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setQ("");
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const hits = useMemo<FichaHit[]>(() => {
    const needle = normalize(q.trim());
    if (!needle) return [];
    const domains: Domain[] = ["device", "coil", "liquid", "part"];
    const out: FichaHit[] = [];
    for (const domain of domains) {
      for (const item of itemsFor(domain)) {
        const brand = brandById(item.brandId)?.name ?? "";
        const haystack = normalize(`${item.name} ${brand} ${item.archiveId} ${item.summary}`);
        if (!haystack.includes(needle)) continue;
        out.push({ id: item.id, domain, slug: item.slug, name: item.name, brand });
        if (out.length >= 8) return out;
      }
    }
    return out;
  }, [q]);

  const commands = useMemo<{ id: string; label: string; hint: string; to: CommandTo }[]>(() => {
    const needle = normalize(q.trim());
    if (!needle) return [...COMMANDS];
    return COMMANDS.filter((command) =>
      normalize(`${command.label} ${command.hint}`).includes(needle),
    );
  }, [q]);

  const close = () => setOpen(false);

  const focusResult = (index: number) => {
    const anchors = resultAnchors(listRef.current);
    if (anchors.length === 0) return;
    const clamped = ((index % anchors.length) + anchors.length) % anchors.length;
    anchors[clamped]?.focus();
  };

  // Flechas entre resultados: un solo manejador en el contenedor (burbujeo
  // desde cualquier enlace), así las fichas (FichaLink) no necesitan props.
  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    const anchors = resultAnchors(listRef.current);
    const at = anchors.indexOf(target);
    if (at < 0) return;
    event.preventDefault();
    if (event.key === "ArrowDown") focusResult(at + 1);
    else if (at === 0) inputRef.current?.focus();
    else focusResult(at - 1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQ("");
          setOpen(true);
        }}
        aria-label="Abrir búsqueda (barra /)"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:text-foreground"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden md:inline">Buscar</span>
        <kbd
          aria-hidden
          className="hidden rounded-sm border border-border px-1 text-xs text-muted-foreground md:inline"
        >
          /
        </kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-label="Buscar en Vapelog"
          className="max-h-[80dvh] overflow-y-auto"
          onOpenAutoFocus={(event) => {
            // El input ya recibe foco por efecto; evita el scroll de Radix.
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogTitle>Buscar en Vapelog</DialogTitle>
          <DialogDescription>
            Fichas y secciones del archivo. Pulsa / para abrir y Esc para cerrar; las flechas mueven
            el foco entre resultados.
          </DialogDescription>
          <div className="mt-4">
            <label className="sr-only" htmlFor="paleta-q">
              Buscar fichas y secciones
            </label>
            <Input
              id="paleta-q"
              ref={inputRef}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="XROS, 0,4 Ω, sales…"
              autoComplete="off"
              aria-controls="paleta-lista"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  focusResult(0);
                }
              }}
            />
          </div>
          <div
            ref={listRef}
            id="paleta-lista"
            role="group"
            aria-label="Resultados"
            onKeyDown={onListKeyDown}
          >
            <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
              {hits.length} fichas · {commands.length} secciones
            </p>
            {hits.length > 0 ? (
              <section aria-label="Fichas" className="mt-3">
                <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Fichas
                </h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {hits.map((hit) => (
                    <li key={hit.id}>
                      <FichaLink
                        domain={hit.domain}
                        slug={hit.slug}
                        onNavigate={close}
                        className="flex min-h-11 flex-col justify-center rounded-sm px-3 py-1.5 hover:bg-muted focus-visible:bg-muted"
                      >
                        <span className="text-sm text-foreground">{hit.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {hit.brand} · {domainLabel(hit.domain)}
                        </span>
                      </FichaLink>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {commands.length > 0 ? (
              <section aria-label="Secciones" className="mt-4">
                <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Secciones
                </h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {commands.map((command) => (
                    <li key={command.id}>
                      <Link
                        to={command.to}
                        onClick={close}
                        className="flex min-h-11 flex-col justify-center rounded-sm px-3 py-1.5 hover:bg-muted focus-visible:bg-muted"
                      >
                        <span className="text-sm text-foreground">{command.label}</span>
                        <span className="text-xs text-muted-foreground">{command.hint}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {q.trim() && hits.length === 0 && commands.length === 0 ? (
              <p className="mt-4 rounded-md border border-border p-4 text-sm text-muted-foreground">
                Sin coincidencias en el archivo. Prueba con marca, modelo u ohmios.
              </p>
            ) : null}
            {!q.trim() ? (
              <section aria-label="Consultas armadas" className="mt-4">
                <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Consultas armadas
                </h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {exampleQueries.slice(0, 3).map((example) => (
                    <li key={example.id}>
                      <Link
                        to={
                          example.domain === "coil"
                            ? "/resistencias"
                            : example.domain === "device"
                              ? "/dispositivos"
                              : "/liquidos"
                        }
                        search={example.search}
                        onClick={close}
                        className="flex min-h-11 flex-col justify-center rounded-sm px-3 py-1.5 hover:bg-muted focus-visible:bg-muted"
                      >
                        <span className="text-sm text-foreground">
                          {example.title} · {exampleCount(example)} fichas
                        </span>
                        <span className="text-xs text-muted-foreground">{example.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
