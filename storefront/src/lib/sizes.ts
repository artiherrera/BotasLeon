/**
 * Conversión de talla mexicana (cm) → US para botas.
 *
 * La conversión varía por SEXO porque el sistema US tiene escalas separadas
 * para hombre y mujer. En BOTAS VAQUERAS mexicanas (NO la genérica de tenis,
 * que sería −18), confirmado con los fabricantes de BotasLeón:
 *
 *   Hombre: US = MX − 19   (p.ej. MX 28 = US 9, MX 29 = US 10)
 *   Mujer:  US = MX − 17   (p.ej. MX 24 = US 7, MX 26 = US 9)
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

import { isMX } from "@/lib/market"
import { BOOT_PRODUCT_TYPES } from "@/lib/shopify/taxonomy"

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
 * Talla como se muestra al comprador, según el mercado del despliegue.
 *
 *   botasleon.mx   "24 · US 7"   las dos escalas: el comprador mexicano piensa
 *                                en la suya y la US le sirve de referencia.
 *   botasleon.com  "US 7"        solo la americana. Enseñarle un 24 a alguien
 *                                en Texas no le dice nada y siembra la duda de
 *                                si el número que va a recibir es ese.
 *
 * Se conserva el prefijo "US" en vez de dejar el número pelón porque estas son
 * botas importadas y el comprador de calzado importado desconfía de las tallas:
 * decirle explícitamente que el 7 es su 7 es justo lo que quiere leer.
 *
 * Sin conversión (niños o sexo desconocido) se cae a la talla MX en los dos
 * sitios — es preferible a dejar el botón en blanco.
 */
/**
 * ¿Este producto usa escala de CALZADO?
 *
 * Solo el calzado se mide en la escala mexicana que se convierte restando 19 o
 * 17. Un cinturón se vende en PULGADAS —en los dos mercados— y pasarlo por esa
 * resta daba disparates: un 34 de hombre salía como "US 15", y en el sitio de
 * Estados Unidos, donde solo se muestra la escala americana, el comprador vería
 * ese "US 15" a secas, sin nada que le permitiera notar el error.
 *
 * Se exige que el tipo esté en la lista de calzado en vez de excluir accesorios
 * uno por uno: un tipo nuevo que nadie contempló no se convierte, que es el lado
 * seguro del error.
 */
export function usaEscalaDeCalzado(productType?: string | null): boolean {
  return (BOOT_PRODUCT_TYPES as readonly string[]).includes(productType ?? "")
}

export function formatSizeWithUs(
  mxSize: string,
  gender: GenderHandle,
  productType?: string | null
): string {
  if (!usaEscalaDeCalzado(productType)) return mxSize
  const us = mxToUs(mxSize, gender)
  if (!us) return mxSize
  return isMX ? `${mxSize} · US ${us}` : `US ${us}`
}

/**
 * Talla como se etiqueta en el FILTRO del listado.
 *
 * No es lo mismo que `formatSizeWithUs`: ahí caben las dos escalas ("26 · US 7")
 * porque es una sola talla en la ficha; aquí son quince casillas en una barra
 * angosta y hay que elegir una. En México se compra por la mexicana, así que va
 * la mexicana; en el sitio en dólares va la US, o el filtro diría "22, 23, 24"
 * mientras la ficha del mismo par dice "US 6" — y quien filtra por su talla se
 * llevaría a casa una bota tres números más chica.
 */
export function etiquetaTallaFiltro(
  mxSize: string,
  gender: GenderHandle,
  productType?: string | null
): string {
  if (isMX) return mxSize
  if (!usaEscalaDeCalzado(productType)) return mxSize
  const us = mxToUs(mxSize, gender)
  return us ? `US ${us}` : mxSize
}
