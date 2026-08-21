/**
 * Checkout en el dominio de la marca.
 *
 * Shopify devuelve el `checkoutUrl` del carrito SIEMPRE en el host myshopify
 * —es por diseño en tiendas headless, no un error de configuración: el dominio
 * principal de la tienda no lo cambia—. Y eso saca al comprador de botasleon.com
 * justo en el paso de pagar, que es donde peor cae la desconfianza.
 *
 * La solución es reescribir el host. Verificado: la misma ruta servida desde el
 * dominio propio devuelve el checkout íntegro y se queda ahí.
 *
 * El dominio va por variable de entorno porque cada despliegue tiene el suyo
 * (botasleon.com y, cuando exista, botasleon.mx). Sin variable no se toca nada.
 */

const CHECKOUT_DOMAIN = process.env.NEXT_PUBLIC_CHECKOUT_DOMAIN

export function checkoutHref(url: string): string {
  if (!CHECKOUT_DOMAIN || !url) return url
  try {
    const u = new URL(url)
    u.host = CHECKOUT_DOMAIN
    return u.toString()
  } catch {
    // URL inesperada: mejor mandar al comprador al checkout original que
    // dejarlo sin botón.
    return url
  }
}
