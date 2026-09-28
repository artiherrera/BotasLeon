import { SIZE_ATTR } from "@/lib/cart/line-size"
import type { Product } from "@/lib/shopify/types"

/**
 * Lo que hace falta para meter una pieza al carrito desde fuera de su ficha.
 *
 * Vive aquí, y no dentro de un componente, porque lo usan los dos sitios donde
 * se arma una oferta sin abrir el producto: las tiras de la ficha
 * (TiraAgregar) y el armador de la página de combos (ArmaCombo).
 *
 * EL CATÁLOGO TIENE LAS TALLAS DE DOS MANERAS y las dos hay que atenderlas:
 * las botas las llevan en el metacampo `shopify.shoe-size` (son de variante
 * única) y los cintos como VARIANTE, en pulgadas. La primera versión de esto
 * solo leía el metacampo, así que a un cinto no le pedía medida y le mandaba
 * al taller siempre la primera variante —la 30— comprara quien comprara.
 */

/** Nombres con los que Shopify puede llamar a la opción de talla. */
const OPCION_TALLA = ["talla", "talla del calzado", "size", "medida"]

/** La opción de VARIANTE que es la talla, si el producto la tiene así. */
export function opcionTalla(p: Product | null) {
  return (
    p?.options.find((o) => {
      const n = o.name.trim().toLowerCase()
      return OPCION_TALLA.includes(n) || n.includes("talla") || n.includes("medida")
    }) ?? null
  )
}

/** Tallas del producto, en orden numérico, vengan de la variante o del metacampo. */
export function tallasDe(p: Product | null): string[] {
  const opcion = opcionTalla(p)
  const valores = opcion
    ? opcion.values
    : (p?.shoeSizes?.references?.edges ?? [])
        .map((e) => e.node.fields.find((f) => f.key === "label")?.value ?? null)
        .filter((v): v is string => !!v)
  return [...valores].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
}

/**
 * Qué línea se manda al carrito para una talla dada.
 *
 * Con la talla como variante hay que encontrar ESA variante; con la talla en el
 * metacampo, el producto es de variante única y la talla viaja como atributo de
 * la línea. Devuelve null si la variante no existe o está agotada, para no
 * meter al carrito algo que el taller no puede surtir.
 */
export function lineaDe(
  p: Product,
  talla: string | null
): { merchandiseId: string; attributes?: Array<{ key: string; value: string }> } | null {
  const opcion = opcionTalla(p)
  if (opcion) {
    const v = p.variants.find((va) =>
      va.selectedOptions?.some((o) => o.name === opcion.name && o.value === talla)
    )
    if (!v || v.availableForSale === false) return null
    return { merchandiseId: v.id }
  }
  const v = p.variants[0]
  if (!v) return null
  return {
    merchandiseId: v.id,
    ...(talla ? { attributes: [{ key: SIZE_ATTR, value: talla }] } : {}),
  }
}

/**
 * "El Elegante en Venado Café" → "Venado Café".
 *
 * En una tarjeta de 108px el modelo se repite en todas y lo que distingue a
 * cada una es lo que va después del "en". Si el título no lo trae, se deja
 * entero.
 */
export function nombreCorto(titulo: string): string {
  const i = titulo.indexOf(" en ")
  return i > 0 ? titulo.slice(i + 4) : titulo
}
