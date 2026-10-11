"use client"

import { useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"
import { formatMoney } from "@/lib/utils"
import type { Cart } from "@/lib/shopify/types"

/**
 * LO QUE SE MIRA JUSTO ANTES DE PAGAR: cuánto te ahorras y cuánto pagas.
 *
 * El carrito decía las dos cosas en letra de nota al pie. El número que el
 * cliente paga salía a 16px —el mismo tamaño que el texto corriente, más
 * pequeño que el nombre del producto— bajo la palabra "Subtotal", y el ahorro
 * a 14px dentro de una caja de línea punteada que se lee como letra chica. El
 * dueño lo dijo mirando su propio carrito: "el precio total y el descuento
 * deberían verse mucho más grande".
 *
 * Aquí el ahorro va en su propia banda, en el acento de la casa, y el total es
 * el número más grande del cajón (30px). En ese orden: primero lo que te
 * llevas de regalo, después lo que pagas. Al lado del total va el precio de
 * lista tachado, que es lo que vuelve creíble el ahorro.
 *
 * EL AHORRO NO SE PUEDE CALCULAR RESTANDO SUBTOTAL − TOTAL. Con un descuento
 * automático, Shopify entrega el subtotal YA rebajado; esa resta da cero. El
 * ahorro de producto solo está en los `discountAllocations` de cada línea. La
 * resta sí sirve para el descuento de ORDEN (un código), que Shopify aplica
 * después del subtotal. Son dos cosas distintas y se suman una sola vez:
 *
 *     lista = total + ahorro de línea + descuento de código
 *
 * NO SE DICE DOS VECES. Antes la banda llevaba el título del descuento de
 * Shopify —que en esta tienda se llama literalmente "🔥 Hoy te ahorras
 * $1,190"— junto al monto, así que la cifra salía repetida. Peor: con varias
 * botas se pintaba el título de UNA línea al lado de la suma de TODAS, que es
 * una cifra que no corresponde a ese nombre (comprobado contra la Storefront
 * API: tres botas devuelven tres títulos distintos, $170, $190 y $210).
 *
 * MÉXICO DICE "TOTAL"; ESTADOS UNIDOS, "SUBTOTAL". En la .mx el precio lleva
 * IVA y el envío es gratis sin condición, así que ese número es exactamente lo
 * que se cobra. En la .com el envío pasa de $100 USD y lo cotiza el checkout:
 * llamarle "total" sería prometer un precio que no es.
 */

/** Ahorro de producto: lo que Shopify descontó LÍNEA por línea. */
function ahorroDeLineas(cart: Cart | null): number {
  if (!cart) return 0
  return cart.lines.reduce(
    (a, l) =>
      a +
      (l.discountAllocations ?? []).reduce(
        (b, d) => b + parseFloat(d.discountedAmount.amount || "0"),
        0
      ),
    0
  )
}

export function ResumenPago({
  cart,
  conNota = true,
  className = "",
}: {
  cart: Cart | null
  /** El resumen de /cart ya tiene sus renglones de envío y entrega. */
  conNota?: boolean
  className?: string
}) {
  const t = useT()
  if (!cart) return null

  const moneda = cart.cost.subtotalAmount.currencyCode
  const subtotal = parseFloat(cart.cost.subtotalAmount.amount)
  const total = parseFloat(cart.cost.totalAmount.amount)
  // Descuento de orden (código): Shopify lo aplica DESPUÉS del subtotal.
  const porCodigo = Math.max(0, subtotal - total)
  const ahorro = ahorroDeLineas(cart) + porCodigo
  const lista = total + ahorro

  return (
    <div className={className}>
      {ahorro > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 border border-leather/40 bg-bg px-3 py-2.5">
          <span className="cuerpo font-medium text-text">{t("cart.ahorroHoy")}</span>
          <span className="precio whitespace-nowrap text-[1.0625rem] text-leather">
            −{formatMoney(String(ahorro), moneda)}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <span className="nav-label text-text-muted">
          {isMX ? t("cart.total") : t("cart.subtotal")}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          {ahorro > 0 && (
            <span className="precio text-sm font-normal text-text-muted line-through">
              {formatMoney(String(lista), moneda)}
            </span>
          )}
          <span className="precio precio-total text-text">
            {formatMoney(String(total), moneda)}
          </span>
        </span>
      </div>

      {conNota && (
        <p className="nota mt-1.5 text-right">
          {t(isMX ? "cart.incluye" : "cart.envioAlPagar")}
        </p>
      )}
    </div>
  )
}
