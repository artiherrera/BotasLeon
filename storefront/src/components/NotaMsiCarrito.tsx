"use client"

import { useT } from "@/lib/i18n/context"
import { mensualidadMsi, MESES_MSI } from "@/lib/msi"
import { formatMoney } from "@/lib/utils"

/**
 * Los meses sin intereses, en el último sitio que controlamos: el carrito.
 *
 * El dueño los quería DENTRO del checkout, antes del formulario de tarjeta.
 * Ahí no llegamos: ese checkout lo sirve Shopify en su propio dominio y en un
 * plan que no es Plus solo se le puede meter contenido con una extensión de
 * aplicación. Esto es el paso inmediatamente anterior, y es donde el cliente
 * decide si sigue o se arrepiente.
 *
 * El hueco era real: los meses se anunciaban en la ficha y en Josepha, y en el
 * carrito no se decía nada. Quien elegía la bota por los meses llegaba a pagar
 * sin verlos confirmados en ninguna parte.
 *
 * "CON TARJETAS PARTICIPANTES" no es letra chica de relleno: los MSI los pone
 * el banco emisor, no la tienda, y no todas las tarjetas entran. Prometerlo sin
 * esa condición es prometer algo que no depende de nosotros.
 *
 * Se decide por MERCADO y por MONEDA, nunca por idioma: botasleon.com también
 * se lee en español y ahí se cobra en dólares, donde esto no existe.
 * mensualidadMsi devuelve null en ese caso y el componente no pinta nada.
 */
export function NotaMsiCarrito({
  total,
  moneda,
}: {
  /** Total del carrito YA con descuentos, que es sobre lo que difiere el banco. */
  total: string | number
  moneda: string
}) {
  const t = useT()
  const porMes = mensualidadMsi(total, moneda)
  if (porMes === null) return null

  return (
    <p className="nota mt-3 text-center text-text-muted">
      {MESES_MSI} {t("msi.of")} {formatMoney(porMes, moneda, 2)}{" "}
      {t("msi.participantes")}
    </p>
  )
}
