/**
 * Meses sin intereses para el DISPLAY de precio (mensualidad como gancho).
 *
 * Separado de MSIBreakdown (que usa 9 meses para mostrar "el más barato"); aquí
 * usamos 3 meses como número LÍDER en cards y PDP. Solo aplica en MXN — el MSI
 * es una promoción de bancos mexicanos, no tiene sentido en USD.
 */
export const MSI_DISPLAY_MONTHS = 3
export const MSI_MIN_AMOUNT = 999 // debajo de esto los bancos no dan MSI

/** Mensualidad a N MSI, o null si el monto/moneda no califica. */
export function msiMonthly(
  amount: string | number,
  currency: string,
  months = MSI_DISPLAY_MONTHS
): number | null {
  if (currency !== "MXN") return null
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  if (!Number.isFinite(n) || n < MSI_MIN_AMOUNT) return null
  return n / months
}
