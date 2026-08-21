import type { Metadata } from "next"
import { isMX } from "@/lib/market"

/**
 * SEO helpers — usados por sitemap, structured data, y metadata
 * generators. Centraliza el BASE_URL para que cambie de Amplify
 * a custom domain solo tocando la env var.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://botasleon.com"

/**
 * Los DOS dominios de la marca, fijos y absolutos.
 *
 * El hreflang tiene que ser recíproco: cada sitio anuncia todas las variantes,
 * incluidas las del otro dominio. Sin esto Google ve botasleon.com/es y
 * botasleon.mx/es como el mismo catálogo en español duplicado en dos dominios,
 * y elige él cuál indexa — normalmente el equivocado. Con esto los lee como
 * variantes regionales de la misma oferta, que es lo que son: mismo producto,
 * distinto país y distinta moneda.
 */
export const US_SITE_URL = "https://botasleon.com"
export const MX_SITE_URL = "https://botasleon.mx"

export const SITE_NAME = "BotasLeón"
export const SITE_DESCRIPTION = isMX
  ? "Botas mexicanas hechas en León, Guanajuato. Vaqueras, clásicas, exóticas y de rancho — curadas par por par. Envío a toda la República."
  : "Comercializadora de botas mexicanas hechas en León, Guanajuato. Vaqueras, clásicas, exóticas y de rancho — curadas par por par. Envío a todo Estados Unidos."

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}

type PageMetadataInput = {
  /** Ruta de la página SIN prefijo de idioma (e.g. "/hombre"). Se usa para el canonical y og:url. */
  path: string
  /** Idioma de la página ("es" | "en"). Prefija el canonical/og:url y emite hreflang. */
  locale?: string
  /**
   * Título sin sufijo de marca. El template del layout agrega " · BotasLeón"
   * automáticamente. NO incluyas " — BotasLeón" aquí (causaría duplicado).
   */
  title: string
  description: string
  /** Imagen OG opcional (URL absoluta o relativa). Por defecto usa la global. */
  ogImage?: string
  /** Si true, marca noindex (útil para /cart, /cuenta, /search). */
  noindex?: boolean
}

/**
 * Genera metadata por página con canonical y og:url correctos.
 *
 * Antes el canonical estaba seteado a SITE_URL en el layout root, lo que
 * hacía que TODAS las páginas declararan canonical=home — Google las
 * trataba como duplicados y desindexaba la taxonomía completa.
 *
 * Ahora el layout NO declara canonical; cada page.tsx llama a este
 * helper para emitir el canonical correcto.
 */
export function pageMetadata({
  path,
  title,
  description,
  ogImage,
  noindex,
  locale,
}: PageMetadataInput): Metadata {
  const lang = locale === "en" ? "en" : locale === "es" ? "es" : null
  const suffix = path === "/" ? "" : path
  // Canonical = la URL con prefijo de idioma (la que responde 200, no la que redirige).
  const url = absoluteUrl(lang ? `/${lang}${suffix}` : path)
  // Absolutas y cruzadas entre dominios: los dos builds emiten el mismo juego.
  const enUS = `${US_SITE_URL}/en${suffix}`
  const esUS = `${US_SITE_URL}/es${suffix}`
  const esMX = `${MX_SITE_URL}/es${suffix}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      // hreflang — le dice a Google qué versión servir por idioma/región.
      ...(lang
        ? {
            languages: {
              "en-US": enUS,
              "es-US": esUS,
              "es-MX": esMX,
              // x-default = a dónde mandar a quien no encaja en ninguna: el
              // sitio en inglés, que es el mercado principal.
              "x-default": enUS,
            },
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      // es_MX solo en el sitio mexicano; el español del .com atiende a la
      // diáspora en Estados Unidos.
      locale: lang === "en" ? "en_US" : isMX ? "es_MX" : "es_US",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(noindex
      ? { robots: { index: false, follow: true } }
      : {}),
  }
}
