import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
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
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (hasLocale) return NextResponse.next()

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
