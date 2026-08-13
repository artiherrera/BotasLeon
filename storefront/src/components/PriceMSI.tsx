"use client"

import { formatMoney, saleInfo } from "@/lib/utils"

/**
 * PriceMSI — precio del producto: total + tachado de oferta + badge de descuento.
 * (Antes mostraba la mensualidad MSI; retirado al pasar la tienda a venta en USD.)
 * size="card" (grids) | size="pdp" (más grande + badge de descuento).
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
  const sale = saleInfo(amount, compareAt)
  const isPdp = size === "pdp"

  return (
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
  )
}
