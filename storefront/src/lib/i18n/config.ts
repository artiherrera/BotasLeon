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
export const LOCALES = ["es", "en"] as const
export type Locale = (typeof LOCALES)[number]

/** Idioma por defecto — el del render del servidor (evita mismatch de hidratación). */
export const DEFAULT_LOCALE: Locale = "es"

/** Clave de localStorage donde se guarda la preferencia manual del visitante. */
export const STORAGE_KEY = "botasleon:locale"

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en"
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
    if (lc.startsWith("es")) return "es"
    if (lc.startsWith("en")) return "en"
  }
  return DEFAULT_LOCALE
}
