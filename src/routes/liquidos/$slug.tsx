import { createFileRoute, notFound } from "@tanstack/react-router";
import type { JSX } from "react";
import { LiquidSheet } from "@/components/sheets";
import { brandById, liquidBySlug } from "@/data/catalog";
import { productImageSource } from "@/data/images";
import { breadcrumbJsonLd, buildHead, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/liquidos/$slug")({
  beforeLoad: ({ params }) => {
    if (!liquidBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const liquid = liquidBySlug(params.slug);
    const name = liquid?.name ?? "Ficha";
    const path = `/liquidos/${params.slug}`;
    const description = liquid?.summary ?? "Ficha de líquido del archivo Vapelog.";
    const brand = liquid ? brandById(liquid.brandId)?.name : undefined;
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
              category: "Líquido",
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
              { name: "Líquidos", url: "/liquidos" },
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
  return <LiquidSheet slug={slug} />;
}
