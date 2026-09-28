/**
 * Formatear dinero según locale + currency code.
 * 'es-MX' para MXN (1,850.00), 'en-US' para USD (1,850.00).
 */
/**
 * Dinero, con decimales SOLO cuando los hay.
 *
 * Todo el catálogo tiene precios redondos —$3,699, $999— y escribirlos con
 * ",00" los ensucia, así que por omisión no llevan decimales. Pero en cuanto
 * aparece una mitad, redondear MIENTE: la mitad de $999 es $499.50, y el sitio
 * la enseñaba como $500 (lo cazó el dueño el 2026-09-28). Lo mismo pasaba en el
 * carrito con el segundo par: Shopify descuenta $1,849.50 y la línea decía
 * $1,850, que además no cuadraba con lo que luego cobra el checkout.
 *
 * Así que el número decide: entero → sin decimales; con centavos → dos. Quien
 * necesite forzarlo (los meses sin intereses, por ejemplo) sigue pudiendo pasar
 * `fractionDigits`.
 */
export function formatMoney(
  amount: string | number,
  currencyCode: string,
  fractionDigits?: number
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  const locale = currencyCode === "MXN" ? "es-MX" : "en-US"
  // Se redondea a centavos antes de preguntar si es entero, para que la basura
  // de coma flotante (0.1 + 0.2) no meta decimales donde no los hay.
  const enCentavos = Math.round((Number.isFinite(num) ? num : 0) * 100) / 100
  const digits = fractionDigits ?? (Number.isInteger(enCentavos) ? 0 : 2)
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
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
