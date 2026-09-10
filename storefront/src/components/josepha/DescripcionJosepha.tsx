"use client"

import { useProductTranslation } from "@/components/LocalizedProductContent"

/**
 * La descripción del botín, en la voz de esta página.
 *
 * NO se pinta el descriptionHtml de Shopify tal cual, y no es por gusto: ese
 * HTML viene con clases pegadas del sitio viejo —`text-sm`, `text-black/50`,
 * `font-inter` y hasta una `font-claude-response-body`— que aquí devolverían
 * la letra chica y la tipografía equivocada, que es justo lo que el dueño pidió
 * arreglar. Se toma el texto PLANO y lo compone la página.
 *
 * En inglés usa la traducción de Shopify (Translate & Adapt) por el mismo hook
 * que la ficha; como esa traducción llega en HTML, se le quitan las etiquetas.
 * Si no hay traducción, se queda el español: es preferible a una ficha muda.
 */
export function DescripcionJosepha({
  handle,
  textoPlano,
  color,
  tam,
  alineacion,
}: {
  handle: string
  /** product.description — el texto sin etiquetas que ya trae la consulta. */
  textoPlano: string
  color: string
  tam: string
  alineacion: "izquierda" | "derecha"
}) {
  const traduccion = useProductTranslation(handle)
  const enIngles = traduccion?.descriptionHtml
    ? sinEtiquetas(traduccion.descriptionHtml)
    : ""
  const texto = recortar(enIngles || textoPlano)
  if (!texto) return null

  return (
    <p
      className={`mt-7 leading-[1.6] ${
        alineacion === "izquierda" ? "md:mr-6" : "md:ml-6"
      }`}
      style={{ color, fontSize: tam }}
    >
      {texto}
    </p>
  )
}

/** Quita etiquetas y normaliza los espacios de un fragmento de HTML. */
function sinEtiquetas(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Deja la descripción en un párrafo.
 *
 * Las tres de Josepha miden 159, 186 y 965 caracteres: pintadas enteras, una
 * sería tres veces más alta que las otras y el ritmo de la página se rompe. Se
 * corta en el último punto antes del tope, nunca a media palabra, y el texto
 * completo sigue estando en la ficha.
 */
function recortar(texto: string, tope = 240): string {
  const limpio = (texto || "").replace(/\s+/g, " ").trim()
  if (limpio.length <= tope) return limpio
  const cortado = limpio.slice(0, tope)
  const punto = cortado.lastIndexOf(". ")
  if (punto > tope * 0.5) return cortado.slice(0, punto + 1)
  const espacio = cortado.lastIndexOf(" ")
  return cortado.slice(0, espacio > 0 ? espacio : tope).trimEnd() + "…"
}
