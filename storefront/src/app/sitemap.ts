import type { MetadataRoute } from "next"
import { getProducts, getBrands } from "@/lib/shopify"
import { SITE_URL } from "@/lib/seo"

/**
 * Sitemap dinámico — Next.js 16 lo genera al build como /sitemap.xml.
 * Google + Bing lo descubren automáticamente vía robots.txt.
 *
 * Cuenta rutas estáticas + un entry por producto y por marca.
 * Cada uno con prioridad y frecuencia recomendada.
 */

export const revalidate = 3600 // regenerar 1 vez por hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/products", priority: 0.9, changeFrequency: "daily" },
    { path: "/hombre", priority: 0.9, changeFrequency: "weekly" },
    { path: "/mujer", priority: 0.9, changeFrequency: "weekly" },
    { path: "/nino", priority: 0.8, changeFrequency: "weekly" },
    { path: "/marcas", priority: 0.8, changeFrequency: "weekly" },
    { path: "/outlet", priority: 0.7, changeFrequency: "weekly" },
    { path: "/search", priority: 0.5, changeFrequency: "monthly" },
    { path: "/cuenta", priority: 0.4, changeFrequency: "yearly" },
    { path: "/envios", priority: 0.6, changeFrequency: "monthly" },
    { path: "/devoluciones", priority: 0.6, changeFrequency: "monthly" },
    { path: "/guia-tallas", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contacto", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/nosotros", priority: 0.7, changeFrequency: "monthly" },
    { path: "/proveedores", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
  ]

  // Productos
  const products = await getProducts({ first: 200 }).catch(() => [])
  const brands = await getBrands().catch(() => [])

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...brands.map((b) => ({
      url: `${SITE_URL}/marcas/${b.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
