"use client"

import { formatMoney, saleInfo } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"
import { MESES_MSI, mensualidadMsi } from "@/lib/msi"

/**
 * PriceMSI — precio del producto: total + tachado de oferta + badge de
 * descuento + mensualidad a meses sin intereses.
 *
 * La mensualidad se había retirado al pasar la tienda a dólares y vuelve con
 * el mercado mexicano, pero solo ahí: la decide `lib/msi.ts` por MERCADO, no
 * por idioma. size="card" (grids) | size="pdp" (más grande + badge).
 */
export function PriceMSI({
  amount,
  currency,
  compareAt,
  size = "card",
}: {
  amount: string
  currency: string
  compareAt?: string | null
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
          <span className="eyebrow ml-2 inline-block bg-leather px-2 py-0.5 align-middle text-bg">
            -{sale.discountPct}%
          </span>
        )}
      </div>
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
