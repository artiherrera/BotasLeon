"use client"

import { formatMoney, saleInfo } from "@/lib/utils"
import { msiMonthly, MSI_DISPLAY_MONTHS } from "@/lib/msi"
import { useT } from "@/lib/i18n/context"

/**
 * PriceMSI — la mensualidad de MSI como PROTAGONISTA, en 2 líneas limpias:
 *
 *   Desde $1,063 al mes            ← héroe (grande)
 *   $3,190  $5,690 · 3 MSI         ← total (legible) + nota MSI, una sola línea
 *
 * El total SIEMPRE se muestra (requisito PROFECO) pero en segundo plano. Si el
 * monto no califica a MSI (< $999 o moneda ≠ MXN), cae al precio total normal.
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
  const t = useT()
  const monthly = msiMonthly(amount, currency)
  const sale = saleInfo(amount, compareAt)
  const isPdp = size === "pdp"

  // Total (con tachado si hay oferta) — reutilizado.
  const total = (
    <>
      <span className={sale.onSale ? "font-medium text-terracotta" : "text-text"}>
        {formatMoney(amount, currency)}
      </span>
      {sale.onSale && compareAt && (
        <span className="ml-1.5 text-text-subtle line-through">
          {formatMoney(compareAt, currency)}
        </span>
      )}
    </>
  )

  // Sin MSI (monto bajo el umbral o moneda ≠ MXN, ej. USD): solo el total, pero
  // con el MISMO peso visual que la mensualidad en MXN (que si no, en inglés el
  // precio se veía diminuto).
  if (!monthly) {
    return (
      <div
        className={
          isPdp
            ? "font-display text-3xl text-text leading-none"
            : "text-xl font-bold text-text"
        }
      >
        {total}
        {isPdp && sale.onSale && (
          <span className="ml-2 inline-block rounded-sm bg-terracotta px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-bg">
            -{sale.discountPct}%
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="leading-snug">
      {/* Mensualidad — protagonista */}
      <p className={isPdp ? "font-display text-3xl text-text leading-none" : "leading-none"}>
        <span className={isPdp ? "" : "text-lg font-semibold text-text"}>
          {t("price.from")} {formatMoney(monthly, currency)}
        </span>
        <span className={`font-normal text-text-muted ${isPdp ? "text-base" : "text-xs"}`}>
          {" "}
          {t("price.perMonth")}
        </span>
      </p>

      {/* Total + nota MSI en UNA sola línea, en segundo plano. */}
      <p className="mt-1 text-sm">
        {total}
        <span className="text-text-subtle">
          {" · "}
          {(isPdp ? t("price.msiPdp") : t("price.msiShort")).replace(
            "{n}",
            String(MSI_DISPLAY_MONTHS)
          )}
        </span>
        {isPdp && sale.onSale && (
          <span className="ml-2 inline-block rounded-sm bg-terracotta px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-bg">
            -{sale.discountPct}%
          </span>
        )}
      </p>
    </div>
  )
}
