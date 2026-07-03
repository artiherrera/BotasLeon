/**
 * Formatear dinero según locale + currency code.
 * 'es-MX' para MXN (1,850.00), 'en-US' para USD (1,850.00).
 */
export function formatMoney(
  amount: string | number,
  currencyCode: string,
  fractionDigits = 0
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  const locale = currencyCode === "MXN" ? "es-MX" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num)
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Info de oferta a partir del precio + precio de comparación (compare-at) de
 * Shopify. `onSale` solo es true si el compare-at es mayor que el precio.
 */
export function saleInfo(
  priceAmount: string,
  compareAtAmount?: string | null
): { onSale: boolean; discountPct: number } {
  const price = parseFloat(priceAmount)
  const compare = compareAtAmount ? parseFloat(compareAtAmount) : 0
  if (!Number.isFinite(price) || !Number.isFinite(compare) || compare <= price) {
    return { onSale: false, discountPct: 0 }
  }
  return {
    onSale: true,
    discountPct: Math.round(((compare - price) / compare) * 100),
  }
}
