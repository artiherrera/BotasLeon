import localFont from "next/font/local"

/**
 * Fuentes curadas para el TÍTULO de una marca — el nombre grande en su página
 * /marcas/[handle] y el nombre en el chip del PDP. Cada marca elige una vía el
 * campo `title_font` del metaobjeto "brand" (valor = uno de los slugs de
 * abajo). Vacío o desconocido → cae a la fuente display del sitio (Bevan).
 *
 * Los archivos viven en src/fonts (subconjunto latino) y NO se bajan de Google
 * en el build. Antes sí: un deploy real falló porque fonts.gstatic.com devolvió
 * 404 en medio de la compilación y Turbopack no pudo resolver Josefin Sans.
 * Depender de una red ajena para poder publicar no vale la pena por una fuente
 * decorativa.
 */
const rye = localFont({
  src: "../fonts/rye.woff2",
  weight: "400",
  display: "swap",
})
const playfair = localFont({
  src: "../fonts/playfair-display.woff2",
  weight: "600 700",
  display: "swap",
})
const oswald = localFont({
  src: "../fonts/oswald.woff2",
  weight: "500 600",
  display: "swap",
})
const josefin = localFont({
  src: "../fonts/josefin-sans.woff2",
  weight: "400 600",
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
