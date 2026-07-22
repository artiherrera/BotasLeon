import { formatMoney, saleInfo } from "@/lib/utils"
import { msiMonthly, MSI_DISPLAY_MONTHS } from "@/lib/msi"

/**
 * PriceMSI — precio con la mensualidad de MSI como gancho líder:
 *
 *   Desde $833 al mes
 *   a 3 meses sin intereses          (chico)
 *   $2,499                            (precio total)
 *
 * El total SIEMPRE se muestra (requisito PROFECO). Si el monto no califica a MSI
 * (< $999 o moneda ≠ MXN), cae al precio total de siempre. Sirve en cards
 * (size="card") y en el PDP (size="pdp", más grande + badge de descuento).
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
  const monthly = msiMonthly(amount, currency)
  const sale = saleInfo(amount, compareAt)
  const isPdp = size === "pdp"

  // Bloque del total (con tachado + badge de descuento si aplica).
  const total = (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={sale.onSale ? "font-medium text-terracotta" : "text-text-muted"}>
        {formatMoney(amount, currency)}
      </span>
      {sale.onSale && compareAt && (
        <span className="text-text-subtle line-through">
          {formatMoney(compareAt, currency)}
        </span>
      )}
      {isPdp && sale.onSale && (
        <span className="rounded-sm bg-terracotta px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-bg">
          -{sale.discountPct}%
        </span>
      )}
    </span>
  )

  // Sin MSI: solo el total (comportamiento de siempre).
  if (!monthly) {
    return (
      <div className={isPdp ? "font-display text-2xl text-text" : "text-sm"}>
        {total}
      </div>
    )
  }

  return (
    <div className="leading-tight">
      <p className={isPdp ? "font-display text-3xl text-text leading-none" : "font-medium text-base text-text leading-none"}>
        Desde {formatMoney(monthly, currency)}
        <span className={`font-normal text-text-muted ${isPdp ? "text-base" : "text-xs"}`}>
          {" "}al mes
        </span>
      </p>
      <p className={`mt-1 text-text-muted ${isPdp ? "text-sm" : "text-[11px]"}`}>
        a {MSI_DISPLAY_MONTHS} meses sin intereses
        {isPdp && " · con bancos participantes"}
      </p>
      <div className={`mt-1.5 ${isPdp ? "text-base" : "text-sm"}`}>{total}</div>
    </div>
  )
}
