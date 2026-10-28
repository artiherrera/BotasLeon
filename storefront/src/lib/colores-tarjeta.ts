import type { Image, Product, ProductVariant } from "@/lib/shopify/types"

/**
 * LOS COLORES DE UNA BOTA, listos para la tarjeta.
 *
 * Desde que los colores se juntaron en una sola ficha (2026-10-21) hay botas
 * de hasta cuatro colores. La tarjeta enseñaba uno y callaba los demás: quien
 * ojeaba el catálogo no se enteraba de que esa bota existía en negro, y la
 * única forma de verlo era abrir la ficha.
 *
 * De cada color hace falta saber tres cosas: cómo se llama, qué tono tiene y
 * qué foto le corresponde. Las tres salen de Shopify:
 *
 *  - el NOMBRE, de la opción "Color" de la variante;
 *  - el TONO, del metacampo custom.colores de la ficha —{"Coñac": "#994A23"}—
 *    y, si falta, de la tabla de nombres (lib/pdp/colorLut);
 *  - la FOTO, de la imagen de esa variante. Medido el 2026-10-21: los 16
 *    productos de varios colores tienen foto en TODAS sus variantes.
 *
 * El enlace lleva `?variant=`, que es lo que la ficha ya sabe leer para abrir
 * con ese color elegido: el mismo camino que usan las redirecciones de las
 * fichas viejas de un solo color.
 */

export type ColorDeTarjeta = {
  nombre: string
  hex: string | null
  foto: string | null
  disponible: boolean
  variantId: string
}

const ES_COLOR = (nombre: string) => {
  const n = nombre.trim().toLowerCase()
  return n === "color" || n === "colores" || n === "colour"
}

/** El tono por ficha (custom.colores), si está capturado y es legible. */
function tonosDeLaFicha(product: Product): Record<string, string> {
  const crudo = product.colores?.value
  if (!crudo) return {}
  try {
    const obj = JSON.parse(crudo) as Record<string, string>
    return obj && typeof obj === "object" ? obj : {}
  } catch {
    // Un metacampo mal escrito no debe tumbar una tarjeta: se cae al colorLut.
    return {}
  }
}

/**
 * Los colores de esta bota, en el orden de la opción de Shopify. Devuelve
 * lista vacía cuando no hay más de uno: una bota de un solo color no necesita
 * cuadritos, y pintarlos sería un control que no decide nada.
 */
export function coloresDeTarjeta(product: Product): ColorDeTarjeta[] {
  const opcion = product.options?.find((o) => ES_COLOR(o.name))
  if (!opcion || opcion.values.length < 2) return []

  const tonos = tonosDeLaFicha(product)
  const variantes = product.variants ?? []

  const deColor = (valor: string): ProductVariant | undefined =>
    variantes.find((v) =>
      v.selectedOptions?.some((o) => ES_COLOR(o.name) && o.value === valor)
    )

  const lista: Array<ColorDeTarjeta | null> = opcion.values.map((valor) => {
    const v = deColor(valor)
    if (!v) return null
    return {
      nombre: valor,
      hex: tonos[valor] ?? null,
      foto: v.image?.url ?? null,
      disponible: v.availableForSale !== false,
      variantId: v.id,
    }
  })
  return lista.filter((c): c is ColorDeTarjeta => !!c)
}

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()

/**
 * LAS FOTOS DE UN COLOR.
 *
 * Shopify no agrupa las imágenes por variante —solo deja colgar UNA de cada
 * una—, pero en esta tienda el texto alternativo de cada foto termina con el
 * nombre del color: "El Meridiano en Piel de Avestruz Coñac". Medido el
 * 2026-10-22 en las fichas de varios colores: las ocho del coñac y las cuatro
 * del miel, todas etiquetadas.
 *
 * Se compara por el FINAL y no por "contiene", porque "Miel" está dentro de
 * "Miel Difuminado" y con `includes` las fotos del difuminado se colarían
 * entre las del miel.
 *
 * Si una ficha no trae esa etiqueta, devuelve vacío y la tarjeta se queda con
 * su galería de siempre: nunca peor que antes.
 */
export function fotosDeColor<T extends { url: string; altText?: string | null }>(
  imagenes: readonly T[],
  nombreColor: string
): T[] {
  const color = sinAcentos(nombreColor)
  if (!color) return []
  return imagenes.filter((im) => sinAcentos(im.altText ?? "").endsWith(color))
}

/**
 * LAS FOTOS DEL COLOR ELEGIDO, CON REPUESTO.
 *
 * Lo primero que se intenta es el texto alternativo (fotosDeColor): es lo que
 * devuelve el carrusel entero de ese color y por eso sigue mandando.
 *
 * Pero el nombre de la opción y el del texto alternativo los escribe una
 * persona y no siempre coinciden. Medido el 2026-10-28 en las 15 botas de
 * varios colores: a CUATRO les falla algún color. En La Liberty y La Armonía
 * la opción dice "Habano" y las fotos dicen "Tabaco"; El Elegante en negro y
 * El Pasajero en miel no tienen ninguna foto etiquetada con ese color. En esos
 * casos la tarjeta se quedaba con su galería de siempre y el clic en el
 * cuadrito NO cambiaba la imagen —el cuadrito se marcaba, el enlace cambiaba,
 * la foto no—, que es lo que el dueño reportó como "las tarjetas no funcionan".
 *
 * EL REPUESTO es la foto que Shopify cuelga de la variante. Existe en las
 * cuatro y es distinta en cada color (comprobado el mismo día), así que con
 * ella el cambio de color SIEMPRE se ve. Y si esa foto está en la galería, se
 * aprovecha su etiqueta para recuperar a sus hermanas: así el carrusel sigue
 * siendo carrusel en vez de quedarse en una sola foto.
 *
 * Devuelve null cuando no hay color que atender; entonces la tarjeta usa su
 * galería normal, igual que antes.
 */
export function fotosDelColor(
  imagenes: readonly Image[],
  color: ColorDeTarjeta | null
): Image[] | null {
  if (!color) return null

  const porNombre = fotosDeColor(imagenes, color.nombre)
  if (porNombre.length > 0) return porNombre

  if (!color.foto) return null

  // La foto de la variante puede no estar en la galería: la tarjeta pide solo
  // las primeras doce imágenes y una bota de cuatro colores las pasa. En ese
  // caso se usa suelta, que es peor que un carrusel pero mucho mejor que no
  // cambiar nada.
  const suya = imagenes.find((im) => im.url === color.foto)
  if (!suya) {
    return [{ url: color.foto, altText: color.nombre, width: null, height: null }]
  }

  const alt = (suya.altText ?? "").trim()
  if (!alt) return [suya]
  const hermanas = imagenes.filter((im) => (im.altText ?? "").trim() === alt)
  return hermanas.length > 0 ? hermanas : [suya]
}

/** El id numérico de la variante, que es lo que espera la ficha en ?variant=. */
export function paramVariante(variantId: string): string {
  return variantId.split("/").pop() ?? variantId
}
