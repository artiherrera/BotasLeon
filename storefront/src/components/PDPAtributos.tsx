"use client"

import { useProductTranslation } from "@/components/LocalizedProductContent"
import { useLocale } from "@/lib/i18n/context"
import { facetLabel } from "@/lib/facets-i18n"
import { atributosDeFicha } from "@/lib/shopify/facets"
import type { Product } from "@/lib/shopify/types"

/**
 * Bajo el nombre: qué bota es, en una línea y una frase.
 *
 * Antes la ficha pasaba del nombre al precio sin decir nada. Quien llega desde
 * un anuncio ve "La Estribo en Roper Chocolate · $3,499" y no sabe si es de
 * punta cuadrada, si es de res o de avestruz, ni si la caña es alta.
 *
 * LA FRASE SALE DE LA DESCRIPCIÓN DEL PRODUCTO, no de un campo nuevo. El
 * informe pedía "una frase de venta de veinte palabras", pero escribirla
 * requiere 106 frases que solo puede escribir el dueño: inventarlas aquí sería
 * ponerle palabras a su producto. La primera oración de la descripción ya está
 * escrita por él, es distinta en cada bota y dice justo eso — "Chocolate
 * bruñido de arriba abajo, caña alta y horma roper". Se corta en la primera
 * oración completa y se topa en 22 palabras para que no empuje el precio.
 *
 * El día que se quiera una frase propia, distinta de la descripción, lo que
 * hace falta es un metacampo en Shopify; el hueco ya está aquí.
 */
export function PDPAtributos({ product }: { product: Product }) {
  const traduccion = useProductTranslation(product.handle)
  const { locale } = useLocale()
  // Las etiquetas llegan en español (son metaobjetos de Shopify); en el sitio
  // en inglés se traducen aquí, como en la tarjeta y en los detalles. Sin esto
  // la ficha en inglés decía "Fina · Pitón · Vaqueras" —medido el 2026-09-16.
  const atributos = atributosDeFicha(product).map((v) => facetLabel(v, locale))
  const frase = primeraOracion(
    traduccion?.descriptionHtml
      ? sinEtiquetas(traduccion.descriptionHtml)
      : product.description || ""
  )

  if (atributos.length === 0 && !frase) return null

  return (
    <div className="mb-5">
      {atributos.length > 0 && (
        <p className="eyebrow text-xs text-text-muted">
          {atributos.join(" · ")}
        </p>
      )}
      {frase && (
        <p className="cuerpo mt-2 max-w-[46ch] text-text-muted">{frase}</p>
      )}
    </div>
  )
}

/** Quita etiquetas y normaliza espacios de un fragmento de HTML. */
function sinEtiquetas(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6])>/gi, ". ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * La primera oración, topada en 22 palabras.
 *
 * Las descripciones del catálogo abren con la frase que describe la bota y
 * siguen con materiales y cuidados; con la primera basta. Si esa primera
 * oración es larguísima se corta en la palabra 22 y se cierra con puntos
 * suspensivos, nunca a media palabra.
 */
function primeraOracion(texto: string, tope = 22): string {
  const limpio = (texto || "").replace(/\s+/g, " ").trim()
  if (!limpio) return ""
  const corte = limpio.search(/\.\s|\.$/)
  const oracion = corte > 0 ? limpio.slice(0, corte + 1) : limpio
  const palabras = oracion.split(" ")
  if (palabras.length <= tope) return oracion
  return palabras.slice(0, tope).join(" ").replace(/[,;:]$/, "") + "…"
}
