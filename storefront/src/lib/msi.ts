/**
 * Meses sin intereses (MSI).
 *
 * Solo México. Los MSI son un instrumento de la banca mexicana y el checkout
 * en dólares no los ofrece, así que se decide por MERCADO y nunca por idioma:
 * botasleon.com también se lee en español —la diáspora— y ahí se cobra en USD.
 *
 * OJO, ESTO NO ACTIVA NADA: el plazo de aquí solo se ANUNCIA. Quien de verdad
 * ofrece los meses es Shopify Payments en el checkout. Si allá cambia el plazo
 * —o se apaga— hay que cambiarlo aquí también, o el sitio queda prometiendo
 * algo que el cobro no cumple.
 */
import { isMX } from "@/lib/market"

/** Plazo activo en Shopify Payments. Hoy: 3 meses y nada más. */
export const MESES_MSI = 3

/** Monto mínimo de compra. 0 = aplica a todo el catálogo, cinturones incluidos. */
export const MINIMO_MSI = 0

/** ¿Este despliegue anuncia meses sin intereses? */
export const HAY_MSI = isMX

/**
 * Mensualidad de un importe, o null si aquí no aplica.
 *
 * El filtro por moneda es cinturón y tirantes: aunque el mercado mande, un
 * precio en dólares nunca debe salir con mensualidad en pesos.
 */
export function mensualidadMsi(
  amount: string | number,
  currency: string
): number | null {
  if (!HAY_MSI || currency !== "MXN") return null
  const total = typeof amount === "string" ? parseFloat(amount) : amount
  if (!Number.isFinite(total) || total <= 0 || total < MINIMO_MSI) return null
  return total / MESES_MSI
}
