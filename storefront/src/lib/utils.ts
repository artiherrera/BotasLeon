/**
 * Formatear dinero según locale + currency code.
 * 'es-MX' para MXN (1,850.00), 'en-US' para USD (1,850.00).
 */
export function formatMoney(amount: string | number, currencyCode: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  const locale = currencyCode === "MXN" ? "es-MX" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
