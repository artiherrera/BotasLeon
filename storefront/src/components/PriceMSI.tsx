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
        className={
          isPdp
            ? "font-display text-3xl text-text leading-none"
            : "text-xl font-bold text-text"
        }
      >
        <span className={sale.onSale ? "font-medium text-terracotta" : "text-text"}>
          {formatMoney(amount, currency)}
        </span>
        {sale.onSale && compareAt && (
          <span className="ml-1.5 text-text-subtle line-through">
            {formatMoney(compareAt, currency)}
          </span>
        )}
        {isPdp && sale.onSale && (
          <span className="ml-2 inline-block bg-terracotta px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-bg">
            -{sale.discountPct}%
          </span>
        )}
      </div>
      {porMes !== null && (
        <p
          className={
            isPdp
              ? "mt-2 text-sm font-normal leading-snug text-text-muted"
              : "mt-1 text-xs font-normal leading-snug text-text-muted"
          }
        >
          {MESES_MSI} {t("msi.of")} {formatMoney(porMes, currency, 2)}
        </p>
      )}
    </div>
  )
}
