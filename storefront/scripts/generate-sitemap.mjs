/**
 * Genera /public/sitemap.xml como archivo estático literal.
 *
 * Corre en amplify.yml preBuild después de inyectar .env.production.local
 * y antes de `npm run build`. Amplify sirve public/ como archivos
 * estáticos sin involucrar Next runtime — así garantizamos que
 * sitemap.xml siempre responda 200 con XML.
 *
 * Por qué no app/sitemap.ts ni Route Handler: Amplify devolvía 500
 * con ambas convenciones de Next 16. Plan C es escribir el XML
 * literalmente.
 *
 * Uso local: `node scripts/generate-sitemap.mjs`
 * Uso CI: corre automático en preBuild de amplify.yml
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, "..")

// Cargar env vars desde .env.production.local (CI) o .env.local (dev).
// Parsing manual para evitar dependencia de dotenv.
async function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = await readFile(path, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key && !process.env[key]) process.env[key] = value
  }
}

await loadEnvFile(join(ROOT, ".env.production.local"))
await loadEnvFile(join(ROOT, ".env.local"))

const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  process.env.SHOPIFY_STORE_DOMAIN
const TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-01"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://botasleon.com"

const ENDPOINT = DOMAIN
  ? `https://${DOMAIN}/api/${VERSION}/graphql.json`
  : ""

async function shopify(query) {
  if (!DOMAIN || !TOKEN) {
    console.warn("[sitemap] sin credenciales Shopify, skip product/brand fetch")
    return null
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    console.warn(`[sitemap] Shopify HTTP ${res.status}`)
    return null
  }
  const json = await res.json()
  if (json.errors) {
    console.warn("[sitemap] Shopify errors:", json.errors.map((e) => e.message).join("; "))
  }
  return json.data
}

async function getProductHandles() {
  const data = await shopify(`{
    products(first: 200) {
      edges { node { handle } }
    }
  }`)
  return data?.products?.edges?.map((e) => e.node.handle) ?? []
}

async function getBrandHandles() {
  const data = await shopify(`{
    metaobjects(type: "brand", first: 50) {
      edges {
        node {
          handle
          fields { key value }
        }
      }
    }
  }`)
  const nodes = data?.metaobjects?.edges?.map((e) => e.node) ?? []
  // Solo brands con is_active != false
  return nodes
    .filter((n) => {
      const active = n.fields.find((f) => f.key === "is_active")?.value
      return active !== "false"
    })
    .map((n) => n.handle)
}

// Rutas estáticas indexables. NO incluir /search, /cuenta, /discount (son
// noindex) ni /outlet (oculta/sin inventario): meter páginas noindex en el
// sitemap es una contradicción que Search Console reporta.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/hombre", priority: "0.9", changefreq: "daily" },
  { path: "/mujer", priority: "0.9", changefreq: "daily" },
  { path: "/accesorios", priority: "0.8", changefreq: "daily" },
  { path: "/marcas", priority: "0.8", changefreq: "weekly" },
  { path: "/envios", priority: "0.6", changefreq: "monthly" },
  { path: "/devoluciones", priority: "0.6", changefreq: "monthly" },
  { path: "/guia-tallas", priority: "0.7", changefreq: "monthly" },
  { path: "/contacto", priority: "0.6", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/nosotros", priority: "0.7", changefreq: "monthly" },
  { path: "/proveedores", priority: "0.4", changefreq: "yearly" },
  { path: "/terminos", priority: "0.3", changefreq: "yearly" },
  { path: "/privacidad", priority: "0.3", changefreq: "yearly" },
]

// Sub-rutas long-tail (categorías por estilo/tipo) — valen SEO y deben ir en
// el sitemap. Mantener en sync con VALID_STYLES (hombre/mujer/[estilo]) y
// ACCESSORY_SLUGS (accesorios/[categoria]).
const SUBROUTES = [
  ...["vaqueras", "botines", "clasicas", "rancho", "exoticas"].map((s) => ({
    path: `/hombre/${s}`, priority: "0.75", changefreq: "weekly",
  })),
  ...["vaqueras", "botines", "clasicas", "largas", "exoticas"].map((s) => ({
    path: `/mujer/${s}`, priority: "0.75", changefreq: "weekly",
  })),
  ...["cinturones", "sombreros", "carteras", "cuidado-del-cuero"].map((s) => ({
    path: `/accesorios/${s}`, priority: "0.7", changefreq: "weekly",
  })),
]

function urlEntry(loc, priority, changefreq, lastmod) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function main() {
  const now = new Date().toISOString()
  const [productHandles, brandHandles] = await Promise.all([
    getProductHandles(),
    getBrandHandles(),
  ])

  console.log(
    `[sitemap] static=${STATIC_ROUTES.length} sub=${SUBROUTES.length} products=${productHandles.length} brands=${brandHandles.length}`
  )

  const entries = [
    ...STATIC_ROUTES.map((r) =>
      urlEntry(`${SITE_URL}${r.path}`, r.priority, r.changefreq, now)
    ),
    ...SUBROUTES.map((r) =>
      urlEntry(`${SITE_URL}${r.path}`, r.priority, r.changefreq, now)
    ),
    ...productHandles.map((h) =>
      urlEntry(`${SITE_URL}/products/${h}`, "0.8", "weekly", now)
    ),
    ...brandHandles.map((h) =>
      urlEntry(`${SITE_URL}/marcas/${h}`, "0.7", "weekly", now)
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`

  const publicDir = join(ROOT, "public")
  await mkdir(publicDir, { recursive: true })
  await writeFile(join(publicDir, "sitemap.xml"), xml, "utf8")
  console.log(`[sitemap] wrote public/sitemap.xml (${entries.length} URLs)`)
}

main().catch((err) => {
  console.error("[sitemap] FATAL:", err)
  process.exit(1)
})
