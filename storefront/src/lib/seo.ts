import type { Metadata } from "next"

/**
 * SEO helpers — usados por sitemap, structured data, y metadata
 * generators. Centraliza el BASE_URL para que cambie de Amplify
 * a custom domain solo tocando la env var.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://botasleon.com"

export const SITE_NAME = "BotasLeón"
export const SITE_DESCRIPTION =
  "Comercializadora de botas mexicanas hechas en León, Guanajuato. Vaqueras, clásicas, exóticas y de rancho — curadas par por par. Envío a México y Estados Unidos."

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}

type PageMetadataInput = {
  /** Ruta de la página (e.g. "/hombre"). Se usa para el canonical y og:url. */
  path: string
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
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_MX",
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
