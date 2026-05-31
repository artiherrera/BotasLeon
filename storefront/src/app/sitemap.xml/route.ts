import { getProducts, getBrands } from "@/lib/shopify"
import { SITE_URL } from "@/lib/seo"

/**
 * Sitemap.xml via Route Handler (en lugar de app/sitemap.ts).
 *
 * Razón: el MetadataRoute.Sitemap de Next.js 16 al renderse desde
 * sitemap.ts daba 500 en Amplify Hosting (problema de cómo Amplify
 * sirve esa convención).
 *
 * Con force-static, Next pre-renderiza este endpoint a un archivo
 * estático /sitemap.xml en .next/static/ que Amplify sirve sin
 * involucrar runtime.
 */

export const dynamic = "force-static"
export const revalidate = false

type Entry = {
  path: string
  priority: string
  changefreq: string
}

const STATIC_ROUTES: Entry[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/hombre", priority: "0.9", changefreq: "weekly" },
  { path: "/mujer", priority: "0.9", changefreq: "weekly" },
  { path: "/nino", priority: "0.8", changefreq: "weekly" },
  { path: "/marcas", priority: "0.8", changefreq: "weekly" },
  { path: "/outlet", priority: "0.7", changefreq: "weekly" },
  { path: "/search", priority: "0.5", changefreq: "monthly" },
  { path: "/cuenta", priority: "0.4", changefreq: "yearly" },
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

function urlEntry(path: string, priority: string, changefreq: string, lastmod: string) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export async function GET() {
  const now = new Date().toISOString()

  const products = await getProducts({ first: 200 }).catch(() => [])
  const brands = await getBrands().catch(() => [])

  const entries: string[] = [
    ...STATIC_ROUTES.map((r) => urlEntry(r.path, r.priority, r.changefreq, now)),
    ...products.map((p) =>
      urlEntry(`/products/${p.handle}`, "0.8", "weekly", now)
    ),
    ...brands.map((b) =>
      urlEntry(`/marcas/${b.handle}`, "0.7", "weekly", now)
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
