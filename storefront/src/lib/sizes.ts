/**
 * Conversión de talla mexicana (cm) → US para botas.
 *
 * Tablas industria estándar. La conversión varía por género porque
 * el sistema US tiene escalas separadas para hombre vs mujer (diferente
 * punto de referencia).
 *
 * Para niños no incluimos conversión porque el sistema US infantil
 * tiene 3 sub-escalas (toddler, little kids, big kids) y la conversión
 * exacta depende de la marca. Mejor mostrar solo MX para niños.
 *
 * Match contra handle de metaobject Sexo objetivo (shopify.target-gender):
 *   "masculino" → tabla hombre
 *   "femenino"  → tabla mujer
 *   otros / null → no convertir (mostrar solo MX)
 */

const MEN_MX_TO_US: Record<string, string> = {
  "22": "4",
  "22.5": "4.5",
  "23": "5",
  "23.5": "5.5",
  "24": "6",
  "24.5": "6.5",
  "25": "7",
  "25.5": "7.5",
  "26": "8",
  "26.5": "8.5",
  "27": "9",
  "27.5": "9.5",
  "28": "10",
  "28.5": "10.5",
  "29": "11",
  "29.5": "11.5",
  "30": "12",
  "30.5": "12.5",
  "31": "13",
}

const WOMEN_MX_TO_US: Record<string, string> = {
  "21": "4",
  "21.5": "4.5",
  "22": "5",
  "22.5": "5.5",
  "23": "6",
  "23.5": "6.5",
  "24": "7",
  "24.5": "7.5",
  "25": "8",
  "25.5": "8.5",
  "26": "9",
  "26.5": "9.5",
  "27": "10",
}

export type GenderHandle = "masculino" | "femenino" | "unisex" | string | null | undefined

export function mxToUs(mxSize: string, gender: GenderHandle): string | null {
  const normalized = mxSize.trim()
  if (gender === "masculino") return MEN_MX_TO_US[normalized] ?? null
  if (gender === "femenino") return WOMEN_MX_TO_US[normalized] ?? null
  return null
}

/**
 * Formato corto para mostrar en buttons de talla:
 *   "24 · US 7"  (si tenemos conversión)
 *   "24"          (si no — niños o género desconocido)
 */
export function formatSizeWithUs(mxSize: string, gender: GenderHandle): string {
  const us = mxToUs(mxSize, gender)
  return us ? `${mxSize} · US ${us}` : mxSize
}
