import { createFileRoute, notFound } from "@tanstack/react-router";
import type { JSX } from "react";
import { PartSheet } from "@/components/sheets";
import { brandById, partBySlug } from "@/data/catalog";
import { productImageSource } from "@/data/images";
import { breadcrumbJsonLd, buildHead, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/componentes/$slug")({
  beforeLoad: ({ params }) => {
    if (!partBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const part = partBySlug(params.slug);
    const name = part?.name ?? "Ficha";
    const path = `/componentes/${params.slug}`;
    const description = part?.summary ?? "Ficha de componente del archivo Vapelog.";
    const brand = part ? brandById(part.brandId)?.name : undefined;
    const image = productImageSource(params.slug);
    const { meta, links } = buildHead({
      title: `${name} — Vapelog`,
      description,
      path,
    });
    return {
      meta: meta as JSX.IntrinsicElements["meta"][],
      links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            productJsonLd({
              name,
              brand,
              category: "Componente",
              url: path,
              image,
              description,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Inicio", url: "/" },
              { name: "Componentes", url: "/componentes" },
              { name, url: path },
            ]),
          ),
        },
      ],
    };
  },
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <PartSheet slug={slug} />;
}
