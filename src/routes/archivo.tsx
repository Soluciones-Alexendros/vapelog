import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { ArchiveTable } from "@/components/archive-table";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/archivo")({
  head: () => {
    const { meta, links } = buildHead({
      title: "Archivo — Vapelog",
      description:
        "Tabla completa del archivo: dispositivos, resistencias, líquidos y componentes con su ficha, su fuente y su estado. Exporta a CSV y no borra.",
      path: "/archivo",
    });
    return { meta: meta as JSX.IntrinsicElements["meta"][], links };
  },
  component: ArchiveTable,
});
