/**
 * Helpers para descuentos pendientes en localStorage.
 *
 * Flow:
 *  1. Cliente llega a /discount/CODE desde un link de email/anuncio
 *  2. /discount/[code] guarda el code aquí en localStorage
 *  3. Cliente sigue navegando, agrega productos al carrito
 *  4. En el cart drawer/page, el "Pagar" agrega ?discount=CODE
 *     al checkoutUrl de Shopify
 *  5. Shopify aplica el descuento en el checkout y lo limpiamos
 */

const STORAGE_KEY = "botasleon:discountCode"

export function getPendingDiscount(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setPendingDiscount(code: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {}
}

export function clearPendingDiscount(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

/**
 * Agrega ?discount=CODE al checkoutUrl de Shopify.
 * Shopify auto-aplica el descuento al cargar el checkout.
 */
export function withDiscount(checkoutUrl: string, code?: string | null): string {
  const c = code ?? getPendingDiscount()
  if (!c) return checkoutUrl
  try {
    const url = new URL(checkoutUrl)
    url.searchParams.set("discount", c)
    return url.toString()
  } catch {
    return checkoutUrl
  }
}
