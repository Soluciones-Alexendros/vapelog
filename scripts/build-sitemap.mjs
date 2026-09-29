#!/usr/bin/env node
// Genera public/sitemap.xml en frío (sin build previo) a partir del catálogo.
// Deriva las fichas importando src/data/catalog.ts con el type-stripping de
// Node (>= 22.18); si no está disponible, cae a un parser de las fuentes.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DATA_DIR = join(ROOT, "src", "data");
const OUT_FILE = join(ROOT, "public", "sitemap.xml");

const DEFAULT_SITE_BASE = "https://vapelog.es";
const SITE_BASE = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? DEFAULT_SITE_BASE).replace(
  /\/+$/,
  "",
);

const LASTMOD = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/dispositivos", changefreq: "weekly", priority: "0.8" },
  { path: "/resistencias", changefreq: "weekly", priority: "0.8" },
  { path: "/liquidos", changefreq: "weekly", priority: "0.8" },
  { path: "/componentes", changefreq: "weekly", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/modelo", changefreq: "monthly", priority: "0.4" },
  { path: "/comparar", changefreq: "monthly", priority: "0.5" },
  { path: "/compatibilidad", changefreq: "monthly", priority: "0.5" },
  { path: "/herramientas", changefreq: "monthly", priority: "0.5" },
  { path: "/archivo", changefreq: "monthly", priority: "0.5" },
];

const DOMAIN_ROUTES = [
  { prefix: "/dispositivos", key: "devices" },
  { prefix: "/resistencias", key: "coils" },
  { prefix: "/liquidos", key: "liquids" },
  { prefix: "/componentes", key: "parts" },
];

function slugsOf(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => item?.slug)
    .filter((slug) => typeof slug === "string" && slug.length > 0);
}

async function importData(fileName) {
  return import(pathToFileURL(join(DATA_DIR, fileName)).href);
}

async function loadCatalogFromModule() {
  const catalog = await importData("catalog.ts");
  let posts;
  try {
    const blog = await importData("blog.ts");
    posts = slugsOf(blog.blogPosts);
  } catch {
    posts = [];
  }
  return {
    source: "module",
    devices: slugsOf(catalog.devices),
    coils: slugsOf(catalog.coils),
    liquids: slugsOf(catalog.liquids),
    parts: slugsOf(catalog.parts),
    posts,
  };
}

function findArrayBody(source, exportName) {
  const marker = new RegExp(`export\\s+const\\s+${exportName}\\b[\\s\\S]*?=\\s*\\[`);
  const match = marker.exec(source);
  if (!match) return "";
  const start = match.index + match[0].length;
  let depth = 1;
  let quote = null;
  let i = start;
  for (; i < source.length && depth > 0; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "[") depth++;
    else if (ch === "]") depth--;
  }
  return source.slice(start, i - 1);
}

function slugsFromBody(body) {
  const found = new Set();
  for (const m of body.matchAll(/slug:\s*["']([^"']+)["']/g)) found.add(m[1]);
  for (const m of body.matchAll(/coilPod\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']/g)) {
    found.add(m[1]);
  }
  return [...found];
}

async function readSource(fileName) {
  return readFile(join(DATA_DIR, fileName), "utf8");
}

async function loadCatalogFromSource() {
  const [catalog, expansion, heads, blog] = await Promise.all([
    readSource("catalog.ts"),
    readSource("expansion.ts"),
    readSource("heads.ts"),
    readSource("blog.ts").catch(() => ""),
  ]);

  const liquidsFiles = (await readdir(DATA_DIR)).filter((name) => /^liquids-.*\.ts$/.test(name));
  const liquidSource = await Promise.all(liquidsFiles.map((name) => readSource(name)));

  const devices = [
    ...slugsFromBody(findArrayBody(catalog, "devices")),
    ...slugsFromBody(findArrayBody(expansion, "extraDevices")),
  ];
  const coils = [
    ...slugsFromBody(findArrayBody(catalog, "coils")),
    ...slugsFromBody(findArrayBody(expansion, "extraCoils")),
    ...slugsFromBody(findArrayBody(heads, "headCoils")),
  ];
  const liquids = [...slugsFromBody(findArrayBody(catalog, "liquids"))];
  for (const source of liquidSource) {
    for (const m of source.matchAll(/export\s+const\s+(\w*Liquids)\b/g)) {
      liquids.push(...slugsFromBody(findArrayBody(source, m[1])));
    }
  }
  const parts = [...slugsFromBody(findArrayBody(expansion, "extraParts"))];

  return {
    source: "source",
    devices,
    coils,
    liquids,
    parts,
    posts: slugsFromBody(blog),
  };
}

async function deriveEntries() {
  let catalog;
  try {
    catalog = await loadCatalogFromModule();
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(`[sitemap] import TS falló, uso parser de fuentes: ${error.message}`);
    }
    catalog = await loadCatalogFromSource();
  }

  const seen = new Set();
  const entries = [];

  const add = (path, changefreq, priority) => {
    if (seen.has(path)) return;
    seen.add(path);
    entries.push({
      loc: `${SITE_BASE}${path}`,
      lastmod: LASTMOD,
      changefreq,
      priority,
    });
  };

  for (const route of STATIC_ROUTES) add(route.path, route.changefreq, route.priority);

  for (const { prefix, key } of DOMAIN_ROUTES) {
    for (const slug of catalog[key]) add(`${prefix}/${slug}`, "monthly", "0.6");
  }
  for (const slug of catalog.posts) add(`/blog/${slug}`, "monthly", "0.5");

  return { entries, source: catalog.source, catalog };
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderSitemap(entries) {
  const body = entries
    .map((entry) =>
      [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ].join("\n"),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  const { entries, source, catalog } = await deriveEntries();
  if (entries.length === 0) {
    throw new Error("sitemap sin URLs: el catálogo no se pudo derivar");
  }

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, renderSitemap(entries), "utf8");

  const fichas =
    catalog.devices.length + catalog.coils.length + catalog.liquids.length + catalog.parts.length;
  console.log(
    `sitemap: ${entries.length} URLs (${STATIC_ROUTES.length} estáticas, ${fichas} fichas, ${catalog.posts.length} posts) · fuente=${source} · base=${SITE_BASE}`,
  );
}

main().catch((error) => {
  console.error(`[sitemap] ${error.message}`);
  process.exitCode = 1;
});
