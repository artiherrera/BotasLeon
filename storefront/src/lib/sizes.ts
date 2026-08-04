/**
 * Conversión de talla mexicana (cm) → US para botas.
 *
 * La conversión varía por SEXO porque el sistema US tiene escalas separadas
 * para hombre y mujer (distinto punto de referencia). Según los fabricantes
 * de BotasLeón:
 *
 *   Hombre: US = MX − 19   (p.ej. MX 29 = US 10)
 *   Mujer:  US = MX − 17   (p.ej. MX 23 = US 6)
 *
 * Es un corrimiento parejo, así que cubre medias tallas (25.5 → US 6.5, etc.)
 * sin necesidad de tabla. Para niños NO convertimos: el sistema US infantil
 * tiene 3 sub-escalas (toddler/little/big) y depende de la marca — mostramos
 * solo MX.
 *
 * Match contra el handle del metaobject Sexo objetivo (shopify.target-gender):
 *   "masculino" → hombre · "femenino" → mujer · otros/null → solo MX.
 */

export type GenderHandle =
  | "masculino"
  | "femenino"
  | "unisex"
  | string
  | null
  | undefined

/** Corrimiento MX→US por sexo, o null si no aplica (niños/unisex/desconocido). */
export function usOffset(gender: GenderHandle): number | null {
  if (gender === "masculino") return 19
  if (gender === "femenino") return 17
  return null
}

/** Talla US para una talla MX y un sexo, o null si no hay conversión válida. */
export function mxToUs(mxSize: string | number, gender: GenderHandle): string | null {
  const offset = usOffset(gender)
  if (offset == null) return null
  const mx = parseFloat(String(mxSize).replace(",", "."))
  if (!Number.isFinite(mx)) return null
  const us = mx - offset
  if (us < 1) return null // talla US inexistente (MX demasiado chica para el sexo)
  return Number.isInteger(us) ? String(us) : us.toFixed(1)
}

/**
 * Formato corto para los botones de talla:
 *   "24 · US 7"  (con conversión)
 *   "24"          (sin conversión — niños o sexo desconocido)
 */
export function formatSizeWithUs(mxSize: string, gender: GenderHandle): string {
  const us = mxToUs(mxSize, gender)
  return us ? `${mxSize} · US ${us}` : mxSize
}
