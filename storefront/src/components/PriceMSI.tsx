"use client"

import { formatMoney, saleInfo } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"
import { MESES_MSI, mensualidadMsi } from "@/lib/msi"
import { ROJO_OFERTA } from "@/lib/ofertas/config"

/**
 * PriceMSI — precio del producto: total + tachado de oferta + badge de
 * descuento + cuánto se ahorra + mensualidad a meses sin intereses.
 *
 * La mensualidad se había retirado al pasar la tienda a dólares y vuelve con
 * el mercado mexicano, pero solo ahí: la decide `lib/msi.ts` por MERCADO, no
 * por idioma. size="card" (grids) | size="pdp" (más grande + badge).
 *
 * EL ORDEN IMPORTA, y es el que pidió el dueño: el número GRANDE es lo que se
 * paga, el de lista va tachado al lado y debajo va el ahorro en dinero. Un
 * porcentaje es una operación mental; "ahorras $1,589.70" no.
 *
 * LA MENSUALIDAD SE CALCULA SOBRE LO QUE SE PAGA, no sobre el precio de lista
 * —`amount` ya viene con el descuento aplicado desde quien llama—. Si se
 * calculara sobre la lista, el sitio pediría al cliente más al mes de lo que
 * el checkout le va a cobrar.
 */
export function PriceMSI({
  amount,
  currency,
  compareAt,
  ahorro,
  size = "card",
}: {
  amount: string
  currency: string
  compareAt?: string | null
  /** Cuánto se ahorra, en dinero. Sin esto no se pinta el renglón. */
  ahorro?: number | null
  size?: "card" | "pdp"
}) {
  const t = useT()
  const sale = saleInfo(amount, compareAt)
  const isPdp = size === "pdp"
  const porMes = mensualidadMsi(amount, currency)

  return (
    <div className={isPdp ? "leading-none" : ""}>
      <div
        // .precio = Instrument Sans 600 con tabular-nums; .precio-ficha lo
        // sube a 24px. La serif está prohibida en precios, y sin tabular-nums
        // una columna de precios queda dentada: el "1" mide menos que el "8".
        className={isPdp ? "precio precio-ficha text-text" : "precio text-text"}
      >
        <span className={sale.onSale ? "text-leather" : "text-text"}>
          {formatMoney(amount, currency)}
        </span>
        {sale.onSale && compareAt && (
          <span className="ml-1.5 text-text-subtle line-through">
            {formatMoney(compareAt, currency)}
          </span>
        )}
        {isPdp && sale.onSale && (
          <span
            className="eyebrow ml-2 inline-block px-2 py-0.5 align-middle text-bg"
            style={{ backgroundColor: ROJO_OFERTA }}
          >
            −{sale.discountPct}%
          </span>
        )}
      </div>
      {/* CUÁNTO TE AHORRAS, en dinero. En la ficha lleva además el porcentaje
          entre paréntesis; en la tarjeta no, porque ahí el porcentaje ya está
          en la insignia de la foto y repetirlo a dos centímetros es ruido. */}
      {sale.onSale && ahorro != null && ahorro > 0 && (
        <p className={isPdp ? "nota mt-2 font-medium" : "nota mt-1 font-medium"}>
          {t("oferta.ahorras")} {formatMoney(ahorro, currency)}
          {isPdp ? ` (${sale.discountPct}%)` : ""}
        </p>
      )}
      {porMes !== null && (
        <p
          className={isPdp ? "nota mt-2" : "nota mt-1"}
        >
          {MESES_MSI} {t("msi.of")} {formatMoney(porMes, currency, 2)}
        </p>
      )}
    </div>
  )
}
