import { Rye, Playfair_Display, Oswald, Josefin_Sans } from "next/font/google"

/**
 * Fuentes curadas para el TÍTULO de una marca — el nombre grande en su página
 * /marcas/[handle] y el nombre en el chip del PDP. Cada marca elige una vía el
 * campo `title_font` del metaobjeto "brand" (valor = uno de los slugs de
 * abajo). Vacío o desconocido → cae a la fuente display del sitio (Bevan).
 *
 * Se llaman a nivel de módulo (requisito de next/font) y self-hosted en build,
 * así que no hay request externo en runtime (CSP-safe). Solo entran al bundle
 * de las rutas que importan este archivo (marca + producto), no al home.
 */
const rye = Rye({ weight: "400", subsets: ["latin"], display: "swap" })
const playfair = Playfair_Display({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
})
const oswald = Oswald({
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
})
const josefin = Josefin_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
})

const FONT_CLASS: Record<string, string> = {
  rye: rye.className,
  playfair: playfair.className,
  oswald: oswald.className,
  josefin: josefin.className,
}

/**
 * Opciones curadas — documenta los valores válidos del campo `title_font`.
 * El slug es lo que el admin escribe en Shopify; el label es solo referencia.
 */
export const BRAND_TITLE_FONTS = [
  { slug: "rye", label: "Rye — western / vaquero" },
  { slug: "playfair", label: "Playfair Display — elegante / fashion" },
  { slug: "oswald", label: "Oswald — condensada / moderna" },
  { slug: "josefin", label: "Josefin Sans — geométrica fina / femenina" },
] as const

/**
 * className de la fuente para un slug de marca. "" si no hay valor o el slug no
 * existe (el consumidor usa entonces la display del sitio, ej. `font-display`).
 */
export function brandTitleFontClass(slug?: string | null): string {
  if (!slug) return ""
  return FONT_CLASS[slug.trim().toLowerCase()] ?? ""
}
