import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { LOCALES, DEFAULT_LOCALE, STORAGE_KEY } from "@/lib/i18n/config"

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
  const cookie = req.cookies.get(STORAGE_KEY)?.value
  if (cookie === "es" || cookie === "en") return cookie
  const accept = (req.headers.get("accept-language") || "").toLowerCase()
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2)
    if (code === "en") return "en"
    if (code === "es") return "es"
  }
  return DEFAULT_LOCALE
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (hasLocale) return NextResponse.next()

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
