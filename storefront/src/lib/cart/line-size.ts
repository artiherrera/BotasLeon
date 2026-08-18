/**
 * Talla de una línea del carrito.
 *
 * En este catálogo NINGÚN producto tiene la talla como variante: los 98 son de
 * variante única y la talla vive en el metacampo `shopify.shoe-size`. Por eso
 * la talla viaja como ATRIBUTO de la línea ("Talla"), que es lo que lee el
 * taller para surtir — y por eso se puede agregar al carrito sin elegir talla
 * y decidirla después, aquí mismo.
 *
 * Contrapartida asumida: un pedido sin talla es un pedido inservible, así que
 * `missingSizeLines` alimenta el candado del botón "Pagar" (mismo patrón que
 * useCustomsGate con el Tax ID de aduana).
 */

import type { Cart } from "@/lib/shopify/types"
import type { GenderHandle } from "@/lib/sizes"

/** Clave del atributo de línea. La escribe el PDP y ahora también el carrito. */
export const SIZE_ATTR = "Talla"

type CartLine = Cart["lines"][number]

/** Talla ya elegida en esta línea, o null si se agregó sin talla. */
export function lineSize(line: CartLine): string | null {
  const v = line.attributes?.find((a) => a.key === SIZE_ATTR)?.value
  return v && v.trim() ? v.trim() : null
}

/** Sexo del producto de la línea — decide la conversión MX→US (−19 / −17). */
export function lineGender(line: CartLine): GenderHandle {
  return (
    line.merchandise.product.targetGender?.references?.edges?.[0]?.node?.handle ??
    null
  )
}

/**
 * Tallas que ofrece el producto de la línea, en orden numérico (22, 22.5, 23…).
 * Usa el campo `label` del metaobjeto, igual que el PDP, para que el carrito y
 * la ficha muestren exactamente los mismos valores.
 */
export function lineSizes(line: CartLine): string[] {
  const refs = line.merchandise.product.shoeSizes?.references?.edges ?? []
  const labels = refs
    .map((e) => e.node.fields.find((f) => f.key === "label")?.value ?? null)
    .filter((v): v is string => !!v)
  return [...labels].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
}

/**
 * Líneas que aún no tienen talla y SÍ podrían tenerla (el producto ofrece
 * tallas). Un producto sin tallas —un cinturón, por ejemplo— no bloquea nada.
 */
export function missingSizeLines(cart: Cart | null): CartLine[] {
  if (!cart) return []
  return cart.lines.filter((l) => !lineSize(l) && lineSizes(l).length > 0)
}

/**
 * ¿Es la opción por defecto de un producto de variante única? Shopify la manda
 * como "Title"/"Default Title", pero en tiendas en español llega TRADUCIDA
 * ("Título: Título predeterminado"), y por eso se colaba en el carrito.
 */
export function isDefaultOption(name: string, value: string): boolean {
  const n = name.trim().toLowerCase()
  const v = value.trim().toLowerCase()
  return (
    n === "title" ||
    n === "título" ||
    n === "titulo" ||
    v === "default title" ||
    v === "título predeterminado" ||
    v === "titulo predeterminado"
  )
}
