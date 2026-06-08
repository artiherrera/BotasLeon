/**
 * Color Look-Up Table — mapa de nombres comunes de color a HEX.
 *
 * Usado por ColorSwatch para renderizar swatches visuales cuando el option
 * "Color" del producto no tiene metafield `shopify.color-pattern` con HEX
 * (caso común al subir productos rápido sin configurar metaobjects).
 *
 * Cubre la paleta común en botería mexicana de León (cuero/cognac/tabaco/etc).
 * Cuando se agrega un color nuevo en Shopify Admin, si NO está acá, el swatch
 * cae a neutral gris con el label visible. NO rompe nada.
 *
 * Normalización: lowercase + strip accents para que "Café" matchee "cafe".
 */

export type ColorEntry = {
  hex: string
  // Si true, agrega ring interno claro para que el swatch sea visible sobre fondo claro.
  isLight?: boolean
}

const COLOR_LUT: Record<string, ColorEntry> = {
  // Negros / oscuros
  negro: { hex: "#1a1a1a" },
  carbon: { hex: "#2a2a2a" },

  // Cafés / cuero
  cafe: { hex: "#6B4423" },
  "cafe oscuro": { hex: "#4A2C17" },
  "cafe claro": { hex: "#8B5A2B" },
  chocolate: { hex: "#5C2E08" },
  chedron: { hex: "#8B7355" },
  cognac: { hex: "#9F4F1F" },
  tabaco: { hex: "#8B4513" },
  whiskey: { hex: "#A0522D" },

  // Tonos cálidos
  miel: { hex: "#C19A6B" },
  natural: { hex: "#D4B896", isLight: true },
  hueso: { hex: "#E8DCC4", isLight: true },
  arena: { hex: "#C2B280", isLight: true },
  beige: { hex: "#D6BD8B", isLight: true },

  // Neutros claros
  blanco: { hex: "#F5F5F5", isLight: true },
  crema: { hex: "#EFE5D0", isLight: true },
  marfil: { hex: "#FFFFF0", isLight: true },

  // Grises
  gris: { hex: "#808080" },
  "gris claro": { hex: "#B0B0B0" },
  "gris oscuro": { hex: "#4A4A4A" },

  // Acentos
  rojo: { hex: "#8B0000" },
  vino: { hex: "#5B1A1A" },
  "rojo cereza": { hex: "#C41E3A" },
  azul: { hex: "#1F3F6F" },
  "azul marino": { hex: "#0F2A4F" },
  verde: { hex: "#2E4F3F" },
  "verde militar": { hex: "#4A5D23" },

  // Metálicos
  plata: { hex: "#C0C0C0", isLight: true },
  oro: { hex: "#D4AF37" },
  bronce: { hex: "#CD7F32" },
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
}

/**
 * Busca el HEX para un nombre de color. Devuelve null si no está mapeado —
 * el caller decide si fallback a swatch neutro o saltar el visual.
 *
 * Estrategia de match:
 *  1. Match exacto normalizado
 *  2. Match por substring: "tabaco oscuro" matchea "tabaco" como fallback
 *     (preserva swatch razonable cuando hay variantes del color base)
 */
export function lookupColor(name: string): ColorEntry | null {
  if (!name) return null
  const key = normalize(name)
  if (COLOR_LUT[key]) return COLOR_LUT[key]

  // Substring fallback — útil para combinaciones tipo "Tabaco y Natural"
  for (const [lutKey, entry] of Object.entries(COLOR_LUT)) {
    if (key.includes(lutKey) || lutKey.includes(key)) return entry
  }

  return null
}
