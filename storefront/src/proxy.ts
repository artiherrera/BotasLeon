import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { MARKET } from "@/lib/market"
import {
  COOKIE_MERCADO,
  equivalenteMx,
  esRastreador,
  paisDesdeCabeceras,
} from "@/lib/geo"
import {
  ALL_LOCALES,
  LOCALES,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  isPublishedLocale,
} from "@/lib/i18n/config"

/**
 * Proxy (antes "middleware" en Next < 16). i18n por URL:
 *
 *  - Rutas SIN prefijo de idioma (/, /mujer, /products/x, y URLs viejas) →
 *    redirige a /{idioma}{ruta} según: 1) la cookie de preferencia (la pone el
 *    toggle), 2) el idioma del navegador (Accept-Language), 3) español.
 *  - Rutas ya prefijadas (/es/…, /en/…) → pasan tal cual.
 *  - Assets estáticos de /public (con punto: .webp .png .html .pdf .xml .txt …),
 *    /_next y /api quedan EXCLUIDOS por el matcher — el proxy ni corre.
 *
 * Guarda el idioma elegido en cookie para que los pocos enlaces internos sin
 * prefijo (prosa de páginas legales) se queden en el mismo idioma.
 */
function pickLocale(req: NextRequest): string {
  // Todo lo que se elija tiene que estar PUBLICADO en este despliegue: en la
  // .mx (solo español) una cookie vieja con "en" mandaría a una ruta muerta.
  const cookie = req.cookies.get(STORAGE_KEY)?.value
  if (isPublishedLocale(cookie)) return cookie
  const accept = (req.headers.get("accept-language") || "").toLowerCase()
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2)
    if (code === "en" && isPublishedLocale("en")) return "en"
    if (code === "es" && isPublishedLocale("es")) return "es"
  }
  return DEFAULT_LOCALE
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Mercado: un visitante de México en la .com va a la .mx ────────────────
  // La moneda se hornea en el build (ver lib/market.ts), así que no se puede
  // cambiar el precio en sitio: hay que mandarlo al despliegue que le toca. Y
  // no es solo el precio — el carrito lleva el país del build, así que aquí
  // pagaría en dólares y con envío internacional en vez del envío gratis desde
  // $3,999 que le corresponde.
  //
  // Tres frenos, en este orden:
  //   · Rastreadores NUNCA. Googlebot rastrea desde EE.UU.; mandarlo a la .mx
  //     haría que dejara de indexar la .com.
  //   · Si ya eligió quedarse (cookie), se respeta.
  //   · Solo si el CDN de verdad manda el país. Si no llega, no se adivina
  //     aquí: lo resuelve el navegador por zona horaria (ver
  //     components/RedireccionMercado.tsx), que además acierta más con un
  //     mexicano de viaje.
  // Salida explícita. Las cookies son por dominio, así que una puesta en la .mx
  // no sirve aquí: el enlace de vuelta trae ?mercado=us y ES ese parámetro el
  // que fija la preferencia del lado de la .com. Sin esto, quien quisiera ver
  // dólares rebotaría a pesos en cada visita.
  if (MARKET === "US" && req.nextUrl.searchParams.get("mercado") === "us") {
    const limpia = req.nextUrl.clone()
    limpia.searchParams.delete("mercado")
    const res = NextResponse.redirect(limpia, 307)
    res.cookies.set(COOKIE_MERCADO, "us", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return res
  }

  //
  // ⚠️ APAGADO. Se activó y redirigió a la .mx una petición que NO venía de
  // México (comprobado desde fuera del país, y sin caché de por medio:
  // x-cache decía Miss). Mandar visitantes de Estados Unidos al sitio en pesos
  // rompe el mercado principal, así que la vía del servidor queda fuera hasta
  // saber QUÉ país está leyendo de verdad — para eso se emite abajo la cabecera
  // de diagnóstico x-pais-detectado.
  //
  // Mientras tanto redirige solo el navegador por zona horaria
  // (components/RedireccionMercado.tsx), que no puede equivocarse en esta
  // dirección: la zona horaria de un visitante estadounidense nunca es mexicana.
  const paisDetectado = paisDesdeCabeceras(req.headers)
  const REDIRECCION_SERVIDOR_ACTIVA = false

  if (
    REDIRECCION_SERVIDOR_ACTIVA &&
    MARKET === "US" &&
    !req.cookies.get(COOKIE_MERCADO) &&
    paisDetectado === "MX" &&
    !esRastreador(req.headers.get("user-agent"))
  ) {
    return NextResponse.redirect(equivalenteMx(pathname, req.nextUrl.search), 307)
  }
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (hasLocale) {
    const res = NextResponse.next()
    // Diagnóstico temporal: qué país (si alguno) llega desde el CDN.
    res.headers.set("x-pais-detectado", paisDetectado ?? "ninguno")
    return res
  }

  // Prefijo de un idioma que este sitio NO publica (/en en la .mx). Hay que
  // REEMPLAZAR el prefijo, no anteponerle otro, o saldría /es/en/products/x.
  // 308 y no 307: para Google esto es una consolidación permanente hacia el
  // español, no una alternativa disponible.
  const noPublicado = ALL_LOCALES.find(
    (l) =>
      !(LOCALES as readonly string[]).includes(l) &&
      (pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  )
  if (noPublicado) {
    const url = req.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname.slice(noPublicado.length + 1)}`
    return NextResponse.redirect(url, 308)
  }

  const locale = pickLocale(req)
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`
  const res = NextResponse.redirect(url)
  res.cookies.set(STORAGE_KEY, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return res
}

export const config = {
  // Corre en todo MENOS: /_next, /api y cualquier ruta con punto (assets de /public).
  matcher: ["/((?!api|_next|.*\\.).*)"],
}
