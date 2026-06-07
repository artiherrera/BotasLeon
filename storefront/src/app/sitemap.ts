import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"
import { getBrands, getProducts } from "@/lib/shopify"
import { ACCESSORY_SLUGS } from "@/lib/shopify/taxonomy"

/**
 * sitemap.xml dinámico — Next.js 16 lo genera en build como /sitemap.xml.
 * El robots.ts ya apunta a esta URL.
 *
 * Estrategia:
 *  - Rutas estáticas (home, info, legal, categorías top-level) declaradas
 *    a mano con prioridad/frecuencia coherentes.
 *  - Sub-rutas long-tail (/hombre/vaqueras etc) generadas desde listas
 *    locales para mantenerse en sync con generateStaticParams.
 *  - Marcas y productos: fetch dinámico de Shopify en build. Si Shopify
 *    falla, no rompe el sitemap — entrega lo estático y omite lo
 *    dinámico (catch → []).
 *
 * Excluído deliberadamente:
 *  - /cart, /cuenta — privadas (también disallow en robots.ts)
 *  - /search — sin valor SEO
 *  - /outlet — oculta en nav, baja prioridad hasta que tenga inventario
 *  - /discount — landing transaccional, no para indexar
 */

const BOOT_STYLES_HOMBRE = ["vaqueras", "botines", "clasicas", "rancho", "exoticas"]
const BOOT_STYLES_MUJER = ["vaqueras", "botines", "clasicas", "largas", "exoticas"]

type Entry = MetadataRoute.Sitemap[number]

function entry(
  path: string,
  priority: number,
  changeFrequency: Entry["changeFrequency"],
  lastModified?: Date
): Entry {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastMod = new Date()

  // Estáticas — info, legal, categorías top-level
  const staticPages: Entry[] = [
    entry("/", 1.0, "daily", lastMod),
    // Categorías top-level
    entry("/hombre", 0.9, "daily", lastMod),
    entry("/mujer", 0.9, "daily", lastMod),
    entry("/marcas", 0.8, "weekly", lastMod),
    entry("/accesorios", 0.8, "daily", lastMod),
    entry("/products", 0.9, "daily", lastMod),
    // Info
    entry("/nosotros", 0.5, "monthly", lastMod),
    entry("/contacto", 0.5, "yearly", lastMod),
    entry("/faq", 0.5, "monthly", lastMod),
    entry("/guia-tallas", 0.6, "yearly", lastMod),
    entry("/envios", 0.5, "monthly", lastMod),
    entry("/devoluciones", 0.5, "monthly", lastMod),
    entry("/proveedores", 0.4, "monthly", lastMod),
    // Legal
    entry("/privacidad", 0.3, "yearly", lastMod),
    entry("/terminos", 0.3, "yearly", lastMod),
  ]

  // Sub-rutas de botas por género/estilo
  const bootSubroutes: Entry[] = [
    ...BOOT_STYLES_HOMBRE.map((s) => entry(`/hombre/${s}`, 0.75, "weekly", lastMod)),
    ...BOOT_STYLES_MUJER.map((s) => entry(`/mujer/${s}`, 0.75, "weekly", lastMod)),
  ]

  // Sub-rutas de accesorios por categoría
  const accessorySubroutes: Entry[] = ACCESSORY_SLUGS.map((s) =>
    entry(`/accesorios/${s}`, 0.7, "weekly", lastMod)
  )

  // Marcas dinámicas — handle del metaobject Brand
  let brandRoutes: Entry[] = []
  try {
    const brands = await getBrands()
    brandRoutes = brands.map((b) =>
      entry(`/marcas/${b.handle}`, 0.7, "weekly", lastMod)
    )
  } catch (e) {
    console.error("[sitemap] getBrands failed:", e instanceof Error ? e.message : e)
  }

  // Productos dinámicos — usar el handle de cada producto.
  // Cap a 250 para mantener el sitemap dentro de los límites razonables;
  // si el catálogo crece a 1000+, partir en sitemap-index multi-file.
  let productRoutes: Entry[] = []
  try {
    const { products } = await getProducts({ first: 250 })
    productRoutes = products.map((p) =>
      entry(`/products/${p.handle}`, 0.6, "weekly", lastMod)
    )
  } catch (e) {
    console.error("[sitemap] getProducts failed:", e instanceof Error ? e.message : e)
  }

  return [
    ...staticPages,
    ...bootSubroutes,
    ...accessorySubroutes,
    ...brandRoutes,
    ...productRoutes,
  ]
}
