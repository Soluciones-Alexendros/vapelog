import { createFileRoute, notFound } from "@tanstack/react-router";
import type { JSX } from "react";
import { CoilSheet } from "@/components/sheets";
import { brandById, coilBySlug } from "@/data/catalog";
import { productImageSource } from "@/data/images";
import { breadcrumbJsonLd, buildHead, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/resistencias/$slug")({
  beforeLoad: ({ params }) => {
    if (!coilBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const coil = coilBySlug(params.slug);
    const name = coil?.name ?? "Ficha";
    const path = `/resistencias/${params.slug}`;
    const description = coil?.summary ?? "Ficha de resistencia del archivo Vapelog.";
    const brand = coil ? brandById(coil.brandId)?.name : undefined;
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
              category: "Resistencia",
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
              { name: "Resistencias", url: "/resistencias" },
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
  return <CoilSheet slug={slug} />;
}
