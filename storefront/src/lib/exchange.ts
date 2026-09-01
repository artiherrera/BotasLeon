/**
 * Cambio de talla en modelos seleccionados.
 *
 * La regla: en MÉXICO, los modelos marcados admiten cambio por otra talla del
 * mismo modelo sin costo — BotasLeón cubre los dos envíos, el de regreso y el
 * de la talla nueva. En Estados Unidos NO aplica y el pedido sigue siendo
 * venta final: cruzaría la aduana dos veces y el comprador ya pagó aranceles
 * a la entrada.
 *
 * Se decide por MERCADO, nunca por idioma. botasleon.com también se lee en
 * español —la diáspora— y ahí el pedido es estadounidense: anunciarle un
 * cambio gratis por leer en español sería prometer algo que no se cumple.
 *
 * El marcado vive en Shopify como ETIQUETA de producto, no en el código, para
 * poder prenderlo y apagarlo modelo por modelo desde el admin sin desplegar.
 */
import { isMX } from "@/lib/market"

/**
 * Etiqueta que hay que escribir en Shopify → Productos → (producto) →
 * Etiquetas. Se compara en minúsculas y sin espacios alrededor, así que
 * "Cambio-de-talla" también sirve.
 */
export const ETIQUETA_CAMBIO_TALLA = "cambio-de-talla"

/** Días naturales, contados desde la entrega, para pedir el cambio. */
export const DIAS_CAMBIO_TALLA = 7

/** ¿Este despliegue ofrece cambio de talla? Decide qué política se publica. */
export const HAY_CAMBIO_DE_TALLA = isMX

/** ¿Este producto en concreto admite cambio de talla gratis? */
export function admiteCambioDeTalla(tags?: readonly string[] | null): boolean {
  if (!HAY_CAMBIO_DE_TALLA) return false
  return (tags ?? []).some(
    (t) => (t || "").trim().toLowerCase() === ETIQUETA_CAMBIO_TALLA
  )
}
