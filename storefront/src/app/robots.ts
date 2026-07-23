import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * robots.txt dinámico — Next.js 16 lo genera al build como /robots.txt.
 * Le dice a Google/Bing qué crawlear y dónde está el sitemap.
 *
 * Bloqueamos rutas privadas del usuario (carrito, cuenta) que no
 * aportan SEO y pueden inflar el crawl budget.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // NO bloqueamos /_next/: Google necesita el CSS/JS para renderizar y
        // rankear bien. Solo bloqueamos rutas privadas/internas sin valor SEO.
        disallow: ["/cart", "/cuenta", "/api/", "/cotizador"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
