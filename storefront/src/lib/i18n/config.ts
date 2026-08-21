/**
 * Configuración de idiomas (i18n) del storefront.
 *
 * Fase 1: traducción de la INTERFAZ del lado del cliente. El idioma vive en un
 * contexto de React (ver ./context) + se persiste en localStorage. Como el sitio
 * es estático (SSG), el render del servidor siempre sale en el idioma por defecto
 * (español) y el cliente cambia a inglés tras hidratar si así corresponde — sin
 * romper el static export ni provocar 500s en Amplify.
 *
 * Fase 2 (futuro): descripciones de producto en inglés vía @inContext(language:)
 * cuando Translate & Adapt esté poblado en Shopify.
 */
import { MARKET } from "@/lib/market"

/** Todos los idiomas que el diccionario sabe traducir. */
export const ALL_LOCALES = ["es", "en"] as const
export type Locale = (typeof ALL_LOCALES)[number]

/**
 * Idiomas que ESTE despliegue publica.
 *
 * México vende solo en español: el sitio .mx atiende a compradores mexicanos y
 * publicar ahí una versión en inglés no le sirve a nadie — pero sí le crea a
 * Google un duplicado del catálogo en español que ya vive en botasleon.com/es.
 * El .com sí conserva los dos: vende a EE.UU. en inglés y a la diáspora en
 * español.
 */
export const LOCALES: readonly Locale[] =
  MARKET === "MX" ? (["es"] as const) : ALL_LOCALES

/** ¿Este despliegue publica más de un idioma? Decide si se pinta el toggle. */
export const IS_MULTILINGUAL = LOCALES.length > 1

/**
 * Idioma por defecto — lo decide el MERCADO del despliegue: botasleon.com vende
 * a Estados Unidos y abre en inglés; botasleon.mx vende en México y abre en
 * español. (Ambos sitios conservan los dos idiomas; solo cambia cuál es el que
 * recibe a quien llega sin preferencia.)
 */
export const DEFAULT_LOCALE: Locale = MARKET === "MX" ? "es" : "en"

/** Clave de localStorage donde se guarda la preferencia manual del visitante. */
export const STORAGE_KEY = "botasleon:locale"

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en"
}

/**
 * ¿Este idioma se publica en ESTE despliegue? `isLocale` sigue aceptando "en"
 * en el build de México a propósito: hay que poder RECONOCER un /en entrante
 * para redirigirlo, cosa distinta de servirlo.
 */
export function isPublishedLocale(value: unknown): value is Locale {
  return isLocale(value) && (LOCALES as readonly string[]).includes(value)
}

/**
 * Detecta el idioma del navegador. Devuelve "en" solo si el visitante lo prefiere
 * claramente (gringo); en cualquier otro caso se queda en español. Corre solo en
 * el cliente (usa navigator).
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE
  const langs =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]
  for (const lang of langs) {
    const lc = (lang || "").toLowerCase()
    // Solo se puede elegir lo que este despliegue publica: en la .mx un
    // navegador en inglés se queda en español, no en una ruta que no existe.
    if (lc.startsWith("es") && isPublishedLocale("es")) return "es"
    if (lc.startsWith("en") && isPublishedLocale("en")) return "en"
  }
  return DEFAULT_LOCALE
}
