import type { Product, ProductVariant } from "@/lib/shopify/types"

/**
 * LOS COLORES DE UNA BOTA, listos para la tarjeta.
 *
 * Desde que los colores se juntaron en una sola ficha (2026-10-21) hay botas
 * de hasta cuatro colores. La tarjeta enseñaba uno y callaba los demás: quien
 * ojeaba el catálogo no se enteraba de que esa bota existía en negro, y la
 * única forma de verlo era abrir la ficha.
 *
 * De cada color hace falta saber tres cosas: cómo se llama, qué tono tiene y
 * qué foto le corresponde. Las tres salen de Shopify:
 *
 *  - el NOMBRE, de la opción "Color" de la variante;
 *  - el TONO, del metacampo custom.colores de la ficha —{"Coñac": "#994A23"}—
 *    y, si falta, de la tabla de nombres (lib/pdp/colorLut);
 *  - la FOTO, de la imagen de esa variante. Medido el 2026-10-21: los 16
 *    productos de varios colores tienen foto en TODAS sus variantes.
 *
 * El enlace lleva `?variant=`, que es lo que la ficha ya sabe leer para abrir
 * con ese color elegido: el mismo camino que usan las redirecciones de las
 * fichas viejas de un solo color.
 */

export type ColorDeTarjeta = {
  nombre: string
  hex: string | null
  foto: string | null
  disponible: boolean
  variantId: string
}

const ES_COLOR = (nombre: string) => {
  const n = nombre.trim().toLowerCase()
  return n === "color" || n === "colores" || n === "colour"
}

/** El tono por ficha (custom.colores), si está capturado y es legible. */
function tonosDeLaFicha(product: Product): Record<string, string> {
  const crudo = product.colores?.value
  if (!crudo) return {}
  try {
    const obj = JSON.parse(crudo) as Record<string, string>
    return obj && typeof obj === "object" ? obj : {}
  } catch {
    // Un metacampo mal escrito no debe tumbar una tarjeta: se cae al colorLut.
    return {}
  }
}

/**
 * Los colores de esta bota, en el orden de la opción de Shopify. Devuelve
 * lista vacía cuando no hay más de uno: una bota de un solo color no necesita
 * cuadritos, y pintarlos sería un control que no decide nada.
 */
export function coloresDeTarjeta(product: Product): ColorDeTarjeta[] {
  const opcion = product.options?.find((o) => ES_COLOR(o.name))
  if (!opcion || opcion.values.length < 2) return []

  const tonos = tonosDeLaFicha(product)
  const variantes = product.variants ?? []

  const deColor = (valor: string): ProductVariant | undefined =>
    variantes.find((v) =>
      v.selectedOptions?.some((o) => ES_COLOR(o.name) && o.value === valor)
    )

  const lista: Array<ColorDeTarjeta | null> = opcion.values.map((valor) => {
    const v = deColor(valor)
    if (!v) return null
    return {
      nombre: valor,
      hex: tonos[valor] ?? null,
      foto: v.image?.url ?? null,
      disponible: v.availableForSale !== false,
      variantId: v.id,
    }
  })
  return lista.filter((c): c is ColorDeTarjeta => !!c)
}

/** El id numérico de la variante, que es lo que espera la ficha en ?variant=. */
export function paramVariante(variantId: string): string {
  return variantId.split("/").pop() ?? variantId
}
