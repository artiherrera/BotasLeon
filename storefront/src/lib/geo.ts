/**
 * Detección del país del visitante, para mandarlo al sitio de su moneda.
 *
 * Hay dos vías porque no está garantizado que la primera exista:
 *
 *  1. CABECERA DEL CDN. CloudFront puede inyectar el país, pero solo si la
 *     distribución que administra Amplify está configurada para reenviarlo, y
 *     eso no lo controlamos. Por eso se leen varios nombres posibles y se acepta
 *     que no venga ninguno.
 *  2. ZONA HORARIA DEL NAVEGADOR. Sin red, sin permisos y sin servicios de
 *     terceros. Para este caso es MÁS fiable que la IP: un mexicano de viaje en
 *     Texas normalmente sigue queriendo ver pesos.
 */

/** Nombres con los que distintos CDNs mandan el país. */
const CABECERAS_PAIS = [
  "cloudfront-viewer-country",
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-amz-cf-viewer-country",
]

export function paisDesdeCabeceras(h: Headers): string | null {
  for (const nombre of CABECERAS_PAIS) {
    const v = h.get(nombre)
    if (v && v.length === 2) return v.toUpperCase()
  }
  return null
}

/** Zonas horarias de México. Cubre las cuatro del país. */
const ZONAS_MX = [
  "America/Mexico_City", "America/Monterrey", "America/Tijuana",
  "America/Cancun", "America/Merida", "America/Chihuahua",
  "America/Hermosillo", "America/Mazatlan", "America/Matamoros",
  "America/Ojinaga", "America/Bahia_Banderas",
]

/** Corre solo en el navegador. */
export function pareceMexico(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (ZONAS_MX.includes(tz)) return true
    // Respaldo por idioma, para navegadores sin zona horaria fiable.
    return (navigator.languages || [navigator.language]).some((l) =>
      (l || "").toLowerCase().startsWith("es-mx")
    )
  } catch {
    return false
  }
}

/**
 * Rastreadores. NO se les redirige: Googlebot rastrea desde Estados Unidos, y
 * mandarlo a la .mx haría que dejara de indexar la .com. Dejándolo pasar, ve lo
 * mismo que un visitante estadounidense — que es justo lo consistente.
 */
const BOTS =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|lighthouse|headless/i

export const esRastreador = (ua: string | null): boolean => BOTS.test(ua || "")

/** Cookie que recuerda "me quedo en este sitio". */
export const COOKIE_MERCADO = "botasleon:mercado-elegido"

/** El sitio mexicano, con el mismo camino. La .mx solo publica español. */
export function equivalenteMx(pathname: string, search: string): string {
  const sinIdioma = pathname.replace(/^\/(es|en)(?=\/|$)/, "")
  return `https://botasleon.mx/es${sinIdioma}${search}`
}
