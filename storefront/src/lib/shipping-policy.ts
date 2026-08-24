import { isMX } from "@/lib/market"

/**
 * Política de envío por mercado.
 *
 * México: gratis siempre, sin monto mínimo. Antes hubo un umbral de $3,999 y se
 * quitó — con la Roper a $3,899 quedaba cien pesos por debajo, así que el
 * modelo que se anunciaba en redes era justo el que no calificaba.
 *
 * Estados Unidos: NO hay envío gratis. El costo lo cotiza el checkout. Prometer
 * lo contrario fue exactamente el bug que hubo que barrer del sitio entero — el
 * envío a EE.UU. cuesta más de $100 USD y anunciarlo gratis era mentira.
 *
 * El umbral vive aquí y no en un componente porque la fuente de verdad real es
 * la tarifa configurada en Shopify: si allá cambia, este número tiene que
 * cambiar con él o el carrito promete algo que el checkout no cumple.
 */
/**
 * Umbral de envío gratis, cuando lo hay.
 *
 * HOY NO HAY: en México el envío es gratis SIN CONDICIÓN — así quedó
 * configurada la tarifa en Shopify (verificado: $2,599 a Oaxaca sale en $0.00).
 * Se conserva la maquinaria porque volver a poner un umbral es cambiar este
 * número, y mientras tanto la barra de avance no se pinta.
 */
export const FREE_SHIPPING_THRESHOLD: number | null = null

/**
 * Envío gratis incondicional. Es un argumento de venta y hay que decirlo, no
 * esconderlo: en la .com sigue siendo falso —el envío a EE.UU. pasa de $100— y
 * prometerlo ahí fue exactamente el bug que hubo que barrer del sitio entero.
 */
export const ENVIO_GRATIS_SIEMPRE = isMX

export type FreeShippingProgress = {
  /** false en mercados sin envío gratis: el componente no debe renderizar nada. */
  applies: boolean
  qualifies: boolean
  /** Cuánto falta para alcanzar el umbral. 0 si ya calificó. */
  remaining: number
  /** 0–1, para la barra de avance. */
  ratio: number
}

/**
 * @param amount Total DESPUÉS de descuentos, no el subtotal. Shopify evalúa sus
 * tarifas por precio sobre el monto ya descontado; usar el subtotal haría que el
 * carrito anunciara envío gratis y el checkout lo cobrara de todos modos.
 */
export function freeShippingProgress(amount: number): FreeShippingProgress {
  if (FREE_SHIPPING_THRESHOLD === null) {
    return { applies: false, qualifies: false, remaining: 0, ratio: 0 }
  }
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - amount)
  return {
    applies: true,
    qualifies: remaining === 0,
    remaining,
    ratio: Math.min(1, Math.max(0, amount / FREE_SHIPPING_THRESHOLD)),
  }
}
