import type { Product } from "@/lib/shopify/types"

/**
 * Lo que cada bota cuesta DE VERDAD, según el carrito de Shopify.
 *
 * El archivo lo escribe `scripts/generate-descuentos.mjs` en cada build (ver
 * ahí el porqué de preguntarle al carrito en vez de calcularlo). Aquí solo se
 * lee y se aplica.
 *
 * HOY SE USA EN UN SOLO SITIO: la tira "Sigue donde te quedaste". Lo decidió
 * el dueño: 113 de 118 botas tienen descuento, y poner "antes/ahora" en el
 * catálogo entero lo convertiría en una tienda de ofertas. En la tira, en
 * cambio, quien la ve ya estuvo mirando esas botas — enseñarle que la que se
 * quedó mirando cuesta $900 menos de lo que creía es la mejor razón para
 * volver.
 */

export type Descuento = {
  /** Precio de lista: el que enseña el catálogo. */
  lista: number
  /** Lo que cobra la caja por UNA, sola en el carrito. */
  paga: number
  moneda: string
}

export type MapaDescuentos = Record<string, Descuento>

type Archivo = { generado: string | null; mercado?: string; productos: MapaDescuentos }

let enVuelo: Promise<MapaDescuentos> | null = null

/**
 * Carga /descuentos.json una sola vez por pestaña. Si falla —archivo ausente,
 * red caída—, devuelve un mapa vacío y las botas salen a precio de lista, que
 * es exactamente como salían antes de todo esto.
 */
export function cargarDescuentos(): Promise<MapaDescuentos> {
  if (!enVuelo) {
    enVuelo = fetch("/descuentos.json")
      .then((r) => (r.ok ? (r.json() as Promise<Archivo>) : null))
      .then((j) => j?.productos ?? {})
      .catch(() => ({}))
  }
  return enVuelo
}

/**
 * Devuelve una copia del producto con el precio real y el de lista como
 * "precio de comparación", que es lo que ya sabe pintar la tarjeta: el precio
 * en cuero, el anterior tachado al lado y la insignia del porcentaje.
 *
 * No se toca el producto original: el mismo objeto se usa en otros sitios
 * donde el dueño NO quiere ver tachados.
 *
 * Si la bota ya trae su propio precio de comparación puesto en Shopify, ese
 * manda y aquí no se hace nada: lo que el dueño escribe a mano gana sobre lo
 * que deduce un script.
 */
export function conDescuento(producto: Product, d: Descuento | undefined): Product {
  if (!d || d.paga >= d.lista) return producto
  if (producto.compareAtPriceRange?.minVariantPrice?.amount) {
    const yaTiene = parseFloat(producto.compareAtPriceRange.minVariantPrice.amount)
    if (Number.isFinite(yaTiene) && yaTiene > 0) return producto
  }
  const moneda = producto.priceRange.minVariantPrice.currencyCode
  return {
    ...producto,
    priceRange: {
      ...producto.priceRange,
      minVariantPrice: { amount: String(d.paga), currencyCode: moneda },
    },
    compareAtPriceRange: {
      minVariantPrice: { amount: String(d.lista), currencyCode: moneda },
    },
  }
}
