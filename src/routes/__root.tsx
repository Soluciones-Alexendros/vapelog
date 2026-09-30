import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/chrome";
import { SmokeCanvas } from "@/components/smoke-canvas";
import { themeBootScript, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/components/ui/theme-toggle";
import { SITE_URL } from "@/lib/site";
import appCss from "../styles.css?url";

const DESCRIPTION =
  "Catálogo técnico de dispositivos, resistencias y líquidos de vapeo para el mercado de la UE. Fichas con fuente, cruce y calculadoras. No es una tienda.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vapelog" },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Vapelog" },
      { property: "og:title", content: "Vapelog" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: `${SITE_URL}/og.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        children: themeBootScript,
      },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Dos metas con media: la API meta() deduplica por `name`, así que
            se emiten como JSX estático. El toggle las sincroniza con el tema
            efectivo tras la hidratación (el script de arranque no las toca:
            mutarlas rompería la adopción de React 19 y duplicaría la etiqueta). */}
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={THEME_COLOR_LIGHT}
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLOR_DARK} />
      </head>
      <body>
        <SmokeCanvas />
        <AppShell>
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
