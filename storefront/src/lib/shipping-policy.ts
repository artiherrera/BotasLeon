import { isMX } from "@/lib/market"

/**
 * Política de envío por mercado.
 *
 * México: gratis a partir de $3,999 MXN. No es adorno — con las botas a $4,499
 * casi todo el catálogo califica solo, pero las de $2,599 no, así que el umbral
 * trabaja como palanca: al comprador le conviene subir de modelo o llevar un
 * segundo par antes que pagar el envío.
 *
 * Estados Unidos: NO hay envío gratis. El costo lo cotiza el checkout. Prometer
 * lo contrario fue exactamente el bug que hubo que barrer del sitio entero — el
 * envío a EE.UU. cuesta más de $100 USD y anunciarlo gratis era mentira.
 *
 * El umbral vive aquí y no en un componente porque la fuente de verdad real es
 * la tarifa configurada en Shopify: si allá cambia, este número tiene que
 * cambiar con él o el carrito promete algo que el checkout no cumple.
 */
export const FREE_SHIPPING_THRESHOLD: number | null = isMX ? 3999 : null

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
