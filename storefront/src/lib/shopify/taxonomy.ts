/**
 * Taxonomía interna del catálogo — qué cuenta como bota y qué como accesorio.
 *
 * Discriminador: Shopify `productType` (campo "Tipo" en la UI admin). Es la
 * fuente de verdad porque ya lo usamos en las sub-rutas /hombre/vaqueras etc.
 * y viene en el PRODUCT_CARD_FRAGMENT sin queries extras.
 *
 * Reglas:
 *  - Una bota DEBE tener productType ∈ BOOT_PRODUCT_TYPES para aparecer en
 *    "Lo más nuevo", /hombre, /mujer, /nino.
 *  - Un accesorio DEBE tener productType ∈ ACCESSORY_PRODUCT_TYPES para
 *    aparecer en /accesorios y sus sub-rutas.
 *  - Un producto con productType vacío o desconocido NO aparece en ninguna
 *    sección de catálogo (sí en /products y búsqueda) — fail-safe.
 *
 * Cuando se agregue una nueva categoría (ej. "Bolsas"), basta con sumarla
 * acá y el nav + sub-rutas la reconocen. /accesorios usa la lista completa.
 */

export const BOOT_PRODUCT_TYPES = [
  "Vaqueras",
  "Clásicas",
  "Rancho",
  "Largas",
  "Exóticas",
  "Botines",
] as const

export type BootProductType = (typeof BOOT_PRODUCT_TYPES)[number]

export const ACCESSORY_PRODUCT_TYPES = [
  "Cinturones",
  "Sombreros",
  "Carteras",
  "Cuidado del cuero",
] as const

export type AccessoryProductType = (typeof ACCESSORY_PRODUCT_TYPES)[number]

// Slug ↔ productType mapping para sub-rutas /accesorios/[categoria].
// Slugs SIN acentos para URLs limpias e indexables.
export const ACCESSORY_SLUG_TO_TYPE: Record<string, AccessoryProductType> = {
  cinturones: "Cinturones",
  sombreros: "Sombreros",
  carteras: "Carteras",
  "cuidado-del-cuero": "Cuidado del cuero",
}

export const ACCESSORY_TYPE_TO_SLUG: Record<AccessoryProductType, string> = {
  Cinturones: "cinturones",
  Sombreros: "sombreros",
  Carteras: "carteras",
  "Cuidado del cuero": "cuidado-del-cuero",
}

export const ACCESSORY_SLUGS = Object.keys(ACCESSORY_SLUG_TO_TYPE)

// === Estilo de bota (metacampo MULTI-VALOR shopify.boot-style) ===
//
// A diferencia de productType (un solo valor), una bota puede tener varios
// estilos: un botín puede ser también exótico. Mapeamos el handle del
// metaobjeto a la etiqueta canónica del filtro. `vaquera` y `vaquero` se
// unifican a "Vaqueras" (son el mismo estilo escrito distinto en el catálogo).
export const BOOT_STYLE_LABELS: Record<string, string> = {
  vaquera: "Vaqueras",
  vaquero: "Vaqueras",
  vaqueras: "Vaqueras",
  botines: "Botines",
  botin: "Botines",
  "botín": "Botines",
  exoticas: "Exóticas",
  exotica: "Exóticas",
  clasico: "Clásicas",
  clasica: "Clásicas",
  clasicas: "Clásicas",
  largas: "Largas",
  rancho: "Rancho",
}

// Valores basura de "Estilo de bota" que NO deben salir como filtro. No se
// pueden borrar desde el admin de Shopify, así que los omitimos en código.
export const BOOT_STYLE_IGNORE = new Set(["bota"])

/**
 * Etiqueta canónica para un handle de boot-style, o `null` si es un valor
 * ignorado (basura) que no debe aparecer como filtro. Los conocidos se unifican
 * (ver BOOT_STYLE_LABELS); los desconocidos NO ignorados se capitalizan (no
 * ocultamos estilos nuevos que el admin cargue en Shopify).
 */
export function bootStyleLabel(slug: string): string | null {
  if (BOOT_STYLE_IGNORE.has(slug)) return null
  return BOOT_STYLE_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

export function isBoot(product: { productType?: string | null }): boolean {
  return BOOT_PRODUCT_TYPES.includes(
    (product.productType ?? "") as BootProductType
  )
}

export function isAccessory(product: { productType?: string | null }): boolean {
  return ACCESSORY_PRODUCT_TYPES.includes(
    (product.productType ?? "") as AccessoryProductType
  )
}

// Etiqueta categoría (para mostrar en UI) — slug url → label legible.
export function accessorySlugToLabel(slug: string): string | null {
  const t = ACCESSORY_SLUG_TO_TYPE[slug]
  return t ?? null
}
