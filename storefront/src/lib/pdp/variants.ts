import type { Product, Image as ShopifyImage } from "@/lib/shopify/types"

/**
 * Helpers para coordinar Color/Variant/Imágenes en la PDP.
 *
 * Shopify Storefront API tiene una limitación: cada variant tiene UNA
 * imagen "featured" (variant.image), pero el admin puede subir N imágenes
 * por color en la sección Multimedia y "Asignar a variantes". Esas
 * imágenes adicionales aparecen en product.images SIN un link directo
 * back al variant.
 *
 * Por eso usamos un algoritmo de 2 signals para clasificar cada imagen:
 *  1. URL match — si product.images[i].url == algún variant.image.url,
 *     pertenece a los colores de esas variantes.
 *  2. AltText match — si product.images[i].altText (normalizado) contiene
 *     el nombre del color, pertenece a ese color. Útil cuando el admin
 *     sube fotos con nombres tipo "raphaela-negro-frente.jpg" (Shopify
 *     usa el filename como altText por default).
 *
 * Imágenes que no matchean ningún color (suela, detalles genéricos) =
 * "neutrales" → se muestran para TODOS los colores.
 *
 * Si el producto NO tiene opción Color, filterImagesByColor regresa
 * todas las imágenes sin cambios — pass-through transparente.
 */

const COLOR_OPTION_NAMES = ["color", "colour", "color del producto"]

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

/**
 * Devuelve la opción Color del producto, o null si no tiene.
 */
export function getColorOption(product: Product): { name: string; values: string[] } | null {
  const opt = product.options?.find((o) =>
    COLOR_OPTION_NAMES.includes(normalize(o.name))
  )
  if (!opt) return null
  return { name: opt.name, values: opt.values }
}

/**
 * Mapea cada URL de variant.image al color de su variante.
 * Una URL puede asociarse a varios colores si dos variantes con colores
 * distintos comparten la misma imagen (raro pero posible).
 */
function buildVariantImageToColorsMap(
  product: Product,
  colorOptionName: string
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const v of product.variants) {
    const colorOpt = v.selectedOptions.find((o) => o.name === colorOptionName)
    if (!colorOpt) continue
    const imgUrl = v.image?.url
    if (!imgUrl) continue
    const colors = map.get(imgUrl) ?? new Set<string>()
    colors.add(colorOpt.value)
    map.set(imgUrl, colors)
  }
  return map
}

/**
 * Filtra product.images mostrando solo las que corresponden al color
 * activo. Reglas:
 *   - Si la URL aparece en variants del color activo → INCLUIR
 *   - Si la URL aparece SOLO en variants de OTROS colores → EXCLUIR
 *   - Si la URL no aparece en ningún variant (imagen "neutral") → INCLUIR
 *   - Como signal extra: si altText contiene el nombre del color activo,
 *     forzar INCLUIR. Si contiene nombre de OTRO color, forzar EXCLUIR.
 *
 * Fallbacks:
 *   - Sin opción Color → regresa todas las imágenes
 *   - Sin activeColor seleccionado → regresa todas
 *   - Si después del filtro queda 0 imágenes → regresa todas (no dejar
 *     galería vacía; mejor mostrar de más que mostrar vacío).
 */
export function filterImagesByColor(
  product: Product,
  activeColor: string | null
): ShopifyImage[] {
  const allImages = product.images ?? []
  if (allImages.length === 0) return []

  const colorOpt = getColorOption(product)
  if (!colorOpt || !activeColor) return allImages

  const variantImageToColors = buildVariantImageToColorsMap(product, colorOpt.name)
  const activeColorNorm = normalize(activeColor)
  const otherColors = colorOpt.values
    .filter((v) => normalize(v) !== activeColorNorm)
    .map(normalize)

  const filtered = allImages.filter((img) => {
    const colorsForThisUrl = variantImageToColors.get(img.url)
    const altNorm = normalize(img.altText ?? "")

    // Signal 2 (alt text) — más fuerte que signal 1 cuando hay match explícito
    if (altNorm.includes(activeColorNorm)) return true
    if (otherColors.some((c) => altNorm.includes(c))) return false

    // Signal 1 (variant.image URL)
    if (colorsForThisUrl) {
      // Pertenece a este color
      if ([...colorsForThisUrl].some((c) => normalize(c) === activeColorNorm)) return true
      // Pertenece SOLO a otros colores → excluir
      return false
    }

    // Imagen "neutral" — sin link a ningún variant. Mostrar siempre.
    return true
  })

  return filtered.length > 0 ? filtered : allImages
}

/**
 * Para una selección de opciones, encuentra el variant exacto o null.
 */
export function findVariantBySelection(
  product: Product,
  selection: Record<string, string>
): Product["variants"][number] | null {
  return (
    product.variants.find((v) =>
      v.selectedOptions.every((o) => selection[o.name] === o.value)
    ) ?? null
  )
}

/**
 * Encuentra la primera variant disponible (o cualquiera si ninguna lo está)
 * que matchee con un color específico. Útil cuando user clickea swatch y
 * queremos quedar parados en una talla razonable.
 */
export function findFirstVariantForColor(
  product: Product,
  colorOptionName: string,
  colorValue: string
): Product["variants"][number] | null {
  const matching = product.variants.filter((v) =>
    v.selectedOptions.some((o) => o.name === colorOptionName && o.value === colorValue)
  )
  if (matching.length === 0) return null
  return matching.find((v) => v.availableForSale) ?? matching[0]
}

export { COLOR_OPTION_NAMES }
