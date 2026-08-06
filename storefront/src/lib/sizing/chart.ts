/**
 * Tabla y conversiones de talla de BotasLeón — SIN dependencias externas.
 *
 * Anclada en dos fuentes:
 *  1. Datos de fábrica (verificados con el fabricante): MX = US + 19 (hombre),
 *     MX = US + 17 (mujer). Ver también src/lib/sizes.ts.
 *  2. Relación talla↔largo de pie (estándar 10 mm por talla, calibrado contra
 *     charts reales): hombre US = cm − 18 ; mujer US = cm − 17.
 *
 * De ahí salen fórmulas exactas:
 *   Hombre:  US = cm − 18 · MX = cm + 1   (MX 29 ↔ 28 cm ↔ US 10)
 *   Mujer:   US = cm − 17 · MX = cm       (MX 26 ↔ 26 cm ↔ US 9)
 */

export type Gender = "men" | "women"

/** Corrimiento MX = US + offset (fábrica). */
const OFFSET: Record<Gender, number> = { men: 19, women: 17 }
/** Largo de pie (cm) = US + this. */
const CM_FROM_US: Record<Gender, number> = { men: 18, women: 17 }

/** Rango de tallas US disponibles por género (para acotar/avisar). */
const US_RANGE: Record<Gender, { min: number; max: number }> = {
  men: { min: 5, max: 13 },
  women: { min: 4, max: 11 },
}

/** EU aproximado por US (calibrado con datos reales; secundario). */
const EU_BY_US: Record<Gender, Record<number, number>> = {
  men: { 5: 37.5, 6: 39, 7: 40, 8: 41.5, 9: 43, 10: 44, 11: 45, 12: 46, 13: 47 },
  women: { 4: 35, 5: 36, 6: 37, 7: 38, 8: 39, 9: 40, 10: 41.5, 11: 43 },
}

export type SizeScale = "US" | "MX" | "EU" | "CM"

export type SizeResult = {
  gender: Gender
  us: number
  mx: number
  cm: number // largo de pie estimado (cm)
  eu: number | null
  /** El pie cae claramente entre dos tallas → conviene la mayor. */
  between: boolean
  /** Fuera del rango disponible. */
  outOfRange: "small" | "large" | null
}

const round05 = (n: number) => Math.round(n * 2) / 2

export function genderFromHandle(handle?: string | null): Gender | null {
  if (handle === "masculino") return "men"
  if (handle === "femenino") return "women"
  return null
}

/** US → EU (aprox., por tabla). */
function euFromUs(us: number, g: Gender): number | null {
  const table = EU_BY_US[g]
  if (table[us] != null) return table[us]
  const lo = Math.floor(us)
  const hi = Math.ceil(us)
  if (table[lo] != null && table[hi] != null) return round05((table[lo] + table[hi]) / 2)
  return null
}

/** Construye el resultado a partir de una talla US (posiblemente fraccionaria). */
function fromUs(usRaw: number, g: Gender, cmExact?: number): SizeResult {
  const range = US_RANGE[g]
  const outOfRange = usRaw < range.min ? "small" : usRaw > range.max ? "large" : null
  const us = Math.min(range.max, Math.max(range.min, round05(usRaw)))
  const mx = us + OFFSET[g]
  const cm = cmExact != null ? cmExact : us + CM_FROM_US[g]
  // "Entre tallas" si la talla cruda queda a ~0.25–0.5 de la redondeada.
  const between = Math.abs(usRaw - us) >= 0.25
  return { gender: g, us, mx, cm: Math.round(cm * 10) / 10, eu: euFromUs(us, g), between, outOfRange }
}

/** Largo de pie (cm) → talla. */
export function sizeFromCm(cm: number, g: Gender): SizeResult | null {
  if (!Number.isFinite(cm) || cm <= 0) return null
  const us = cm - CM_FROM_US[g]
  return fromUs(us, g, cm)
}

/** Talla conocida (en alguna escala) → talla BotasLeón. */
export function sizeFromScale(value: number, scale: SizeScale, g: Gender): SizeResult | null {
  if (!Number.isFinite(value) || value <= 0) return null
  if (scale === "CM") return sizeFromCm(value, g)
  if (scale === "US") return fromUs(value, g)
  if (scale === "MX") return fromUs(value - OFFSET[g], g)
  if (scale === "EU") {
    // Invierte EU_BY_US al US más cercano.
    const table = EU_BY_US[g]
    let bestUs: number | null = null
    let bestDiff = Infinity
    for (const [usStr, eu] of Object.entries(table)) {
      const d = Math.abs(eu - value)
      if (d < bestDiff) { bestDiff = d; bestUs = Number(usStr) }
    }
    return bestUs != null ? fromUs(bestUs, g) : null
  }
  return null
}

/** Ancho ISO de una tarjeta bancaria / credencial (ID-1): 85.60 mm. */
export const CARD_LONG_MM = 85.6

/** Filas para mostrar una mini-tabla (US · MX · cm) del género. */
export function sizeRows(g: Gender): Array<{ us: number; mx: number; cm: number; eu: number | null }> {
  const { min, max } = US_RANGE[g]
  const rows = []
  for (let us = min; us <= max; us++) {
    rows.push({ us, mx: us + OFFSET[g], cm: us + CM_FROM_US[g], eu: euFromUs(us, g) })
  }
  return rows
}
