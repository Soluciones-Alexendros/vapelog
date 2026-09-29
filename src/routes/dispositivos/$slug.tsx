import { createFileRoute, notFound } from "@tanstack/react-router";
import type { JSX } from "react";
import { DeviceSheet } from "@/components/sheets";
import { brandById, deviceBySlug } from "@/data/catalog";
import { productImageSource } from "@/data/images";
import { breadcrumbJsonLd, buildHead, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/dispositivos/$slug")({
  beforeLoad: ({ params }) => {
    if (!deviceBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const device = deviceBySlug(params.slug);
    const name = device?.name ?? "Ficha";
    const path = `/dispositivos/${params.slug}`;
    const description = device?.summary ?? "Ficha de dispositivo del archivo Vapelog.";
    const brand = device ? brandById(device.brandId)?.name : undefined;
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
              category: "Dispositivo",
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
              { name: "Dispositivos", url: "/dispositivos" },
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
  return <DeviceSheet slug={slug} />;
}
