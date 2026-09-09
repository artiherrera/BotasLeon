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

/**
 * Zonas de Estados Unidos. Se listan explícitamente para poder DESCARTAR, que
 * es la parte que importa.
 *
 * México y Estados Unidos comparten desfase horario —Monterrey y Chicago son
 * ambos UTC−6— pero NO comparten identificador: el navegador reporta
 * "America/Monterrey" o "America/Chicago", nunca el desfase. Por eso la zona
 * distingue bien y el desfase no serviría.
 */
const ZONAS_US = [
  "America/New_York", "America/Detroit", "America/Chicago", "America/Denver",
  "America/Phoenix", "America/Los_Angeles", "America/Anchorage",
  "America/Boise", "America/Indiana/Indianapolis", "America/Kentucky/Louisville",
  "America/North_Dakota/Center", "America/Menominee", "America/Juneau",
  "America/Sitka", "America/Nome", "America/Adak", "Pacific/Honolulu",
]

/**
 * Corre solo en el navegador.
 *
 * LA ZONA HORARIA MANDA, EL IDIOMA SOLO DESEMPATA. Antes el idioma era una
 * señal independiente, y eso mandaba al sitio en pesos a un paisano en Chicago
 * con el navegador en es-MX: justo el comprador de la diáspora al que se le
 * paga publicidad, que debe ver dólares y envío a Estados Unidos. Ahora una zona
 * estadounidense descarta México aunque el idioma diga es-MX, y el idioma solo
 * decide cuando la zona no dice nada útil (navegadores que reportan "UTC" por
 * privacidad).
 */
export function pareceMexico(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (ZONAS_MX.includes(tz)) return true
    if (ZONAS_US.includes(tz)) return false
    // Zona desconocida o enmascarada: recién aquí pesa el idioma.
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

/**
 * Dominios donde la tienda vende de verdad.
 *
 * La redirección por país manda a https://botasleon.mx, que es un sitio EN
 * VIVO. Si se dispara desde una copia local o desde una vista previa, saca de
 * su propia pantalla a quien está revisando y lo deposita en producción — y
 * como pasa a los pocos milisegundos de cargar, lo que parece es que el sitio
 * local "no tiene ninguno de los cambios". Pasó de verdad, revisando el
 * rediseño desde México: se veía un instante la tipografía nueva y enseguida
 * el sitio viejo.
 *
 * Por eso solo se redirige desde los dominios de venta. Una vista previa de
 * Amplify tampoco debe rebotar: quien la abre quiere ver ESA rama.
 */
const DOMINIOS_PUBLICADOS = ["botasleon.com", "botasleon.mx"]

export function esSitioPublicado(hostname: string): boolean {
  const h = (hostname || "").toLowerCase()
  return DOMINIOS_PUBLICADOS.some((d) => h === d || h.endsWith("." + d))
}

/** Cookie que recuerda "me quedo en este sitio". */
export const COOKIE_MERCADO = "botasleon:mercado-elegido"

/** El sitio mexicano, con el mismo camino. La .mx solo publica español. */
export function equivalenteMx(pathname: string, search: string): string {
  const sinIdioma = pathname.replace(/^\/(es|en)(?=\/|$)/, "")
  return `https://botasleon.mx/es${sinIdioma}${search}`
}
