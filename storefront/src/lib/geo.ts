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

/**
 * Zonas horarias de México. TODAS las de IANA, incluidas las heredadas.
 *
 * ESTA LISTA YA NO ES UNA COMODIDAD, ES UN SEGURO. Mientras la regla fue
 * "¿parece México?", olvidar una zona solo significaba que esa persona no se
 * movía: inofensivo. Ahora que la regla de salida es "¿está FUERA de México?",
 * una zona que falte aquí manda a un mexicano al sitio en dólares, con envío
 * internacional y sin el envío gratis que le toca.
 *
 * Por eso está America/Ciudad_Juarez, que IANA separó de Chihuahua en 2022 y
 * aquí faltaba: son 1.5 millones de personas que habrían acabado en la .com.
 * Y por eso están los alias viejos (Mexico/General, America/Santa_Isabel…),
 * que navegadores y sistemas sin actualizar todavía reportan.
 */
const ZONAS_MX = [
  "America/Mexico_City", "America/Monterrey", "America/Tijuana",
  "America/Cancun", "America/Merida", "America/Chihuahua",
  "America/Ciudad_Juarez", "America/Hermosillo", "America/Mazatlan",
  "America/Matamoros", "America/Ojinaga", "America/Bahia_Banderas",
  // Alias heredados que siguen vivos en equipos sin actualizar.
  "America/Santa_Isabel", "America/Ensenada",
  "Mexico/General", "Mexico/BajaNorte", "Mexico/BajaSur",
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
 * Zonas que NO dicen dónde está nadie.
 *
 * Los navegadores con protección de huella digital (Tor, Firefox endurecido,
 * algunos modos privados) reportan "UTC" en vez de la zona real. Eso no es
 * "está en Londres": es "no te lo voy a decir". Tratarlo como extranjero
 * sacaría de la .mx justo a los mexicanos más celosos de su privacidad.
 */
const ZONAS_OPACAS = ["UTC", "GMT", "Universal", "Zulu", "Factory", "localtime"]

/**
 * El camino de vuelta: ¿este visitante está FUERA de México?
 *
 * Cualquier zona horaria conocida que no sea mexicana cuenta — no solo las de
 * Estados Unidos. Un colombiano, un español o un guatemalteco en la .mx verían
 * pesos y envío nacional en un sitio que no les puede surtir así; la .com, que
 * cobra en dólares y calcula envío internacional, sí.
 *
 * El único caso en que NO se mueve a nadie es la zona enmascarada. Ahí no se
 * adivina, y el idioma tampoco desempata: sacar a un mexicano de su propio
 * sitio por una corazonada cuesta una venta en el mercado principal, y dejar a
 * un extranjero viendo pesos cuesta mucho menos.
 */
export function estaFueraDeMexico(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return false
    if (ZONAS_MX.includes(tz)) return false
    if (ZONAS_OPACAS.includes(tz) || tz.startsWith("Etc/")) return false
    return true
  } catch {
    return false
  }
}

/**
 * Rastreadores. NO se les redirige: Googlebot rastrea desde Estados Unidos, y
 * mandarlo a la .mx haría que dejara de indexar la .com. Dejándolo pasar, ve lo
 * mismo que un visitante estadounidense — que es justo lo consistente.
 *
 * En el sentido inverso el freno es todavía más importante: la .mx redirige a
 * quien está en Estados Unidos, y Googlebot rastrea DESDE ahí. Sin este freno,
 * botasleon.mx mandaría a Google a la .com en cada página y el sitio mexicano
 * desaparecería del índice entero.
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

/**
 * El sitio en dólares, con el mismo camino.
 *
 * A diferencia de la .mx, la .com publica los dos idiomas, así que hay que
 * elegir uno. Quien llega viene de un sitio que solo existe en español, así
 * que el español no se le quita a quien lo entiende: solo se pasa a inglés si
 * el navegador no lista ningún español. Un chicano con el navegador en es-US
 * conserva su idioma y solo cambia de moneda, que es lo único que estaba mal.
 */
export function equivalenteCom(pathname: string, search: string): string {
  const sinIdioma = pathname.replace(/^\/(es|en)(?=\/|$)/, "")
  return `https://botasleon.com/${idiomaEnLaCom()}${sinIdioma}${search}`
}

function idiomaEnLaCom(): "es" | "en" {
  try {
    const idiomas = navigator.languages || [navigator.language]
    return idiomas.some((l) => (l || "").toLowerCase().startsWith("es"))
      ? "es"
      : "en"
  } catch {
    return "en"
  }
}
