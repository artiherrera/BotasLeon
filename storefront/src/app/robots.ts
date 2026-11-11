import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * robots.txt dinámico — Next.js 16 lo genera al build como /robots.txt.
 * Le dice a Google/Bing qué crawlear y dónde está el sitemap.
 *
 * Bloqueamos rutas privadas del usuario (carrito, cuenta) que no
 * aportan SEO y pueden inflar el crawl budget.
 */

/**
 * RAMAS DE PRUEBA: fuera del índice, enteras.
 *
 * Un preview de Amplify sirve el sitio completo en una dirección pública
 * (aunque lleve contraseña) y con precios que todavía no están aprobados. Si
 * Google lo alcanza, acaba indexando una copia del catálogo con otros precios
 * y compitiendo con la tienda de verdad.
 *
 * Se enciende con la variable de entorno NEXT_PUBLIC_NOINDEX=true, que se pone
 * SOLO en la rama de preview desde la consola de Amplify. En main y mx no
 * existe, así que esto no cambia nada ahí.
 */
const SIN_INDEXAR = process.env.NEXT_PUBLIC_NOINDEX === "true"

export default function robots(): MetadataRoute.Robots {
  if (SIN_INDEXAR) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // NO bloqueamos /_next/: Google necesita el CSS/JS para renderizar y
        // rankear bien. Solo bloqueamos rutas privadas/internas sin valor SEO.
        // Rutas privadas en ambos idiomas (/es/… y /en/…) — comodín por prefijo.
        disallow: [
          "/*/cart",
          "/*/cuenta",
          "/*/cotizador",
          "/*/discount",
          "/*/search",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
