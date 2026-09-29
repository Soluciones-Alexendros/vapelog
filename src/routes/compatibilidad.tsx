import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CompatLab, parseCompatSearch } from "@/components/compat-lab";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/compatibilidad")({
  validateSearch: (search) => parseCompatSearch(search as Record<string, unknown>),
  head: () => {
    const { meta, links } = buildHead({
      title: "Compatibilidad — Vapelog",
      description:
        "Comprueba si un dispositivo admite una resistencia: resultado nativo, de kit, eléctrico o no, con los motivos y las exclusiones que publica la fuente.",
      path: "/compatibilidad",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CompatLab
      search={search}
      onSearch={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
