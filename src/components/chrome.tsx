import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Scale } from "lucide-react";
import { BrandLogo } from "@/components/brand-mark";
import { CommandPalette } from "@/components/command-palette";
import { CompareContext, useCompare, type CompareRef } from "@/components/compare-context";
import { RevealManager } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const catalogNav = [
  { to: "/dispositivos", label: "Dispositivos", exact: false },
  { to: "/resistencias", label: "Resistencias", exact: false },
  { to: "/liquidos", label: "Líquidos", exact: false },
  { to: "/componentes", label: "Componentes", exact: false },
] as const;

const secondaryNav = [
  { to: "/buscar", label: "Buscar", exact: true },
  { to: "/compatibilidad", label: "Cruce", exact: false },
  { to: "/herramientas", label: "Cálculo", exact: false },
  { to: "/archivo", label: "Tabla", exact: false },
  { to: "/blog", label: "Blog", exact: false },
  { to: "/modelo", label: "Modelo", exact: false },
] as const;

function readStoredCompare(): CompareRef[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem("vapelog-compare");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareRef[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          (item.domain === "device" ||
            item.domain === "coil" ||
            item.domain === "liquid" ||
            item.domain === "part") &&
          typeof item.slug === "string",
      )
      .slice(0, 4);
  } catch {
    /* selección ilegible: se ignora */
    return [];
  }
}

function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareRef[]>(readStoredCompare);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("vapelog-compare", JSON.stringify(items));
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }, [items]);

  const api = useMemo(
    () => ({
      items,
      notice,
      has: (slug: string) => items.some((item) => item.slug === slug),
      remove: (slug: string) => setItems((current) => current.filter((item) => item.slug !== slug)),
      clear: () => {
        setItems([]);
        setNotice(null);
      },
      toggle: (item: CompareRef) => {
        const exists = items.some((current) => current.slug === item.slug);
        if (exists) {
          setItems((current) => current.filter((entry) => entry.slug !== item.slug));
          setNotice(null);
          return;
        }
        if (items.length > 0 && items[0]?.domain !== item.domain) {
          setItems([item]);
          setNotice(
            "El comparador solo mezcla fichas del mismo tipo. La selección anterior se ha sustituido.",
          );
          return;
        }
        if (items.length >= 4) {
          setNotice("El comparador admite cuatro fichas.");
          return;
        }
        setItems((current) => [...current, item]);
        setNotice(null);
      },
    }),
    [items, notice],
  );

  return <CompareContext.Provider value={api}>{children}</CompareContext.Provider>;
}

function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const compare = useCompare();

  const active = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 lg:gap-4">
        <Link to="/" className="flex min-h-11 shrink-0 items-center" aria-label="Vapelog">
          <BrandLogo className="h-6 w-auto sm:h-8" />
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4" aria-label="Catálogo">
          {catalogNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active(item.to, item.exact) ? "page" : undefined}
              className={
                active(item.to, item.exact)
                  ? "inline-flex min-h-11 items-center border-b-2 border-primary text-base font-medium text-foreground"
                  : "inline-flex min-h-11 items-center border-b-2 border-transparent text-base font-medium text-foreground hover:border-primary focus-visible:border-primary"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <CommandPalette />
          <ThemeToggle />
          <Link
            to="/comparar"
            className="inline-flex min-h-11 items-center gap-1 px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:text-foreground"
          >
            <Scale className="size-4 sm:hidden" aria-hidden />
            <span className="sr-only sm:not-sr-only">Comparador</span>
            {compare.items.length > 0 ? (
              <span className="tabular-nums text-primary">{compare.items.length}</span>
            ) : null}
          </Link>
        </div>
      </div>
      <div className="border-t border-border">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 px-4"
          aria-label="Otras secciones"
        >
          {secondaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active(item.to, item.exact) ? "page" : undefined}
              className={
                active(item.to, item.exact)
                  ? "inline-flex min-h-9 items-center text-sm text-muted-foreground underline decoration-border underline-offset-4"
                  : "inline-flex min-h-9 items-center text-sm text-muted-foreground hover:text-foreground focus-visible:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="font-medium text-foreground">Vapelog</p>
          <p className="mt-2 max-w-xl">
            Vapelog — archivo de referencia para adultos. No vende nicotina ni sustituye la etiqueta
            del lote. España / UE.
          </p>
        </div>
        <nav aria-label="Catálogo">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Catálogo
          </p>
          <ul className="mt-2 flex flex-col">
            {catalogNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center text-foreground hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Archivo">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Archivo
          </p>
          <ul className="mt-2 flex flex-col">
            <li>
              <Link
                to="/archivo"
                className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
              >
                Tabla
              </Link>
            </li>
            <li>
              <Link
                to="/modelo"
                className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
              >
                Modelo
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function CompareDock() {
  const compare = useCompare();
  if (compare.items.length === 0 && !compare.notice) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums text-foreground">{compare.items.length}</span> en el
          comparador
          {compare.notice ? (
            <span className="mt-1 block text-primary">{compare.notice}</span>
          ) : null}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="quiet" onClick={compare.clear}>
            Vaciar
          </Button>
          <Link
            to="/comparar"
            className="inline-flex min-h-11 items-center bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Comparar
          </Link>
        </div>
      </div>
    </div>
  );
}

function RouteFocus() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    // La ruta puede llegar antes que su chunk (code-splitting): el h1 nuevo
    // aún no está en el DOM cuando corre el efecto. Se reintenta de forma
    // acotada hasta que aparece. Con overlay modal (AgeGate) el foco lo
    // retiene el diálogo: no robarlo.
    let cancelled = false;
    const timers: number[] = [];
    const focusH1 = () => {
      if (cancelled) return;
      if (document.querySelector('[role="dialog"]')) return;
      const h1 = document.querySelector("main h1");
      if (!(h1 instanceof HTMLElement)) return;
      if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(() => {
      if (!cancelled) {
        focusH1();
      }
    });
    for (const delay of [150, 500]) {
      timers.push(window.setTimeout(focusH1, delay));
    }
    focusH1();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [pathname]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(true);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    // Sincronización post-hidratación con sessionStorage, que no existe en SSR:
    // el contenido viaja en el HTML y el gate solo lo cubre como overlay.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionStorage.getItem("vapelog-edad") !== "ok") setAllowed(false);
    setChecked(true);
  }, []);

  return (
    <CompareProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <Header />
      <RouteFocus />
      <RevealManager />
      {/* Solo se monta cuando bloquea: montarlo cerrado y abrirlo después
          dispara un race de react-remove-scroll (classList de null). */}
      {checked && !allowed ? <AgeGate open onAllow={() => setAllowed(true)} /> : null}
      <main id="contenido" className="pb-28">
        {children}
      </main>
      <Footer />
      <CompareDock />
    </CompareProvider>
  );
}

function AgeGate({ open, onAllow }: { open: boolean; onAllow: () => void }) {
  const [decision, setDecision] = useState<"ask" | "out">("ask");
  return (
    <Dialog open={open}>
      <DialogContent
        aria-describedby="edad-cuerpo"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <p className="text-xs font-medium tracking-widest text-primary uppercase">
          Productos con nicotina · UE
        </p>
        <DialogTitle className="mt-4">Vapelog</DialogTitle>
        <DialogDescription id="edad-cuerpo">
          Este archivo describe dispositivos, resistencias y líquidos de vapeo. En España y en la UE
          no se venden a menores de 18 años.
        </DialogDescription>
        <p className="mt-3 text-sm text-muted-foreground">
          No es una tienda ni un consejo sanitario. Las fichas citan la fuente y marcan lo que no
          está verificado. La interfaz está en español.
        </p>
        {decision === "out" ? (
          <p className="mt-6 text-sm text-foreground" role="status">
            Sin la confirmación de edad el catálogo no se abre.
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {decision === "out" ? (
            <Button type="button" onClick={() => setDecision("ask")}>
              Volver a la pregunta
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                sessionStorage.setItem("vapelog-edad", "ok");
                onAllow();
              }}
            >
              Tengo 18 años o más
            </Button>
          )}
          {decision === "ask" ? (
            <Button type="button" variant="secondary" onClick={() => setDecision("out")}>
              Salir
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
