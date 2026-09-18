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
 * EL TEXTO SALE DE LA DESCRIPCIÓN DEL PRODUCTO, no de un campo nuevo. El
 * informe pedía "una frase de venta de veinte palabras", pero escribirla
 * requiere 106 frases que solo puede escribir el dueño: inventarlas aquí sería
 * ponerle palabras a su producto.
 *
 * SE MUESTRA EL PRIMER PÁRRAFO ENTERO, por decisión del dueño (2026-09-17).
 * Antes era la primera oración topada en 22 palabras. Ahora el corte lo pone
 * él en Shopify con un Enter: todo lo que escriba en el primer párrafo sale
 * aquí, sin tope. Medido al cambiarlo: 102 de 110 descripciones son un solo
 * párrafo (mediana 34 palabras, máximo 87), así que en esas botas sale la
 * descripción completa hasta que se parta en párrafos.
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
  const frase = primerParrafo(traduccion?.descriptionHtml || product.descriptionHtml || product.description || "")

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
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * El primer párrafo de la descripción, como texto.
 *
 * Las 110 descripciones del catálogo vienen en <p> (medido): se toma el
 * primero que tenga texto. Si algún día llega una sin <p> —texto plano con
 * saltos de línea, o un solo bloque—, se corta en el primer salto de línea
 * doble, y si tampoco hay, va todo.
 */
function primerParrafo(html: string): string {
  const parrafos = [...(html || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => sinEtiquetas(m[1]))
    .filter(Boolean)
  if (parrafos.length > 0) return parrafos[0]
  const plano = sinEtiquetas((html || "").split(/\n\s*\n/)[0])
  return plano
}
