/**
 * Mercado del despliegue.
 *
 * Un solo código, dos sitios:
 *   botasleon.com → MARKET=US · precios en USD · inglés por defecto
 *   botasleon.mx  → MARKET=MX · precios en MXN · español por defecto
 *
 * Es UNA SOLA tienda de Shopify con dos mercados configurados (MX→MXN,
 * US→USD): el catálogo, el inventario y los pedidos son compartidos, y lo
 * único que cambia entre despliegues es el país que va en `@inContext`, que
 * es lo que hace a Shopify devolver pesos o dólares. Cada build fija el suyo
 * con NEXT_PUBLIC_MARKET.
 *
 * No se detecta el dominio en vivo a propósito: el sitio es estático y los
 * precios se hornean en el build, así que un mismo build no puede servir dos
 * monedas. Dos despliegues del mismo commit, sí.
 */

export type Market = "US" | "MX"

export const MARKET: Market =
  process.env.NEXT_PUBLIC_MARKET === "MX" ? "MX" : "US"

export const isMX = MARKET === "MX"

/**
 * País para `@inContext` y para el buyerIdentity del carrito. Es lo que decide
 * la MONEDA que devuelve Shopify y en la que cobra el checkout.
 */
export const COUNTRY: Market = MARKET

/** Directiva `@inContext` ya armada, con idioma opcional de Translate & Adapt. */
export function inContext(language?: "ES" | "EN"): string {
  return `@inContext(country: ${COUNTRY}${language ? `, language: ${language}` : ""})`
}

/**
 * Aduana y Tax ID solo aplican cuando el paquete cruza a Estados Unidos. La .mx
 * vende dentro de México: ahí no hay importación que declarar ni pago que
 * bloquear.
 */
export const requiresUsCustoms = MARKET === "US"
