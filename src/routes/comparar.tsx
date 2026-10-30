import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CompareView } from "@/components/compare-view";
import { validateCompareRouteSearch } from "@/lib/compare-store";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/comparar")({
  validateSearch: (search: Record<string, unknown>) => validateCompareRouteSearch(search),
  head: () => {
    const { meta, links } = buildHead({
      title: "Comparar — Vapelog",
      description:
        "Compara fichas del archivo lado a lado: qué comparten, en qué se diferencian y de dónde sale cada dato publicado.",
      path: "/comparar",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: CompareView,
});
