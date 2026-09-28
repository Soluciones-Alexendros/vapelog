import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/chrome";
import { themeBootScript } from "@/components/ui/theme-toggle";
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
      { name: "theme-color", content: "#FCFAF6" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,640&family=Public+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
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
      </head>
      <body>
        <AppShell>
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
