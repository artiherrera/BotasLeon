"use client"

import NextLink from "next/link"
import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { useLocale } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/config"

/**
 * Enlace interno consciente del idioma. Antepone el prefijo /es o /en (según el
 * idioma actual) a las rutas internas, para que la navegación se quede dentro
 * del mismo idioma. Deja intactos: externos, anclas (#), mailto/tel, rutas ya
 * prefijadas y assets estáticos de /public (catálogo, imágenes, sitemap, etc.).
 *
 * Uso: `import { LocalizedLink as Link } from "@/components/LocalizedLink"` — así
 * el resto del JSX (`<Link href="/mujer">`) no cambia.
 */
const STATIC = /^\/(_next|api|catalogo|robots|sitemap|favicon)|\.(png|jpe?g|webp|svg|gif|ico|pdf|html|xml|txt|json|css|js|mp4|webm)(\?|#|$)/i

export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href // externos, #ancla, mailto:, tel:, relativos
  if (/^\/(es|en)(\/|$)/.test(href)) return href // ya viene con prefijo
  if (STATIC.test(href)) return href // asset estático servido desde /public
  return href === "/" ? `/${locale}` : `/${locale}${href}`
}

type Props = ComponentPropsWithoutRef<typeof NextLink>

export const LocalizedLink = forwardRef<HTMLAnchorElement, Props>(
  function LocalizedLink({ href, ...rest }, ref) {
    const { locale } = useLocale()
    const finalHref = typeof href === "string" ? localizeHref(href, locale) : href
    return <NextLink ref={ref} href={finalHref} {...rest} />
  }
)
