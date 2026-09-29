/**
 * Qué clase de foto de producto es cada una.
 *
 * El catálogo tiene DOS clases, y hay que tratarlas distinto o una de las dos
 * se ve mal. Medido sobre las 427 fotos de los 106 productos:
 *
 *   417 de ESTUDIO  → cuadradas (1254×1254 casi todas) y con el fondo de
 *                     estudio en rgb(250,246,240). Van con `contain` y
 *                     `mix-blend-mode: multiply`: el fondo se funde con el
 *                     plato y la bota parece flotar sobre la página.
 *
 *    10 de AMBIENTE → verticales (1086×1448, 1122×1402…) y con fondo oscuro y
 *                     de color: suelo, tapete, pantalón. Una de ellas tiene la
 *                     esquina en rgb(20,93,127), que es azul.
 *
 * Con el trato de estudio, las de ambiente salían como un rectángulo oscuro
 * flotando dentro del cuadro claro, con dos franjas de crema a los lados. El
 * dueño lo describió como "un feo canva de fondo". Llenando el cuadro no queda
 * ni un milímetro de franja, y la bota se ve más grande.
 *
 * EL CATÁLOGO CAMBIÓ DE PROPORCIÓN (2026-09-28) y esta regla se quedó al revés
 * de la realidad. Hoy, de 481 fotos, 468 son 4:5 —la proporción EXACTA del
 * plato—, 5 siguen cuadradas y 8 tienen otra medida. Con el detector viejo
 * ("no cuadrada = ambiente") el catálogo ENTERO caía del lado que se llena a
 * sangre con un 4% de zoom, así que a todas las botas les recortaba un 2% por
 * lado: "ahora se ven horribles, todas cortadas", y con razón.
 *
 * Ahora el detector compara contra el PLATO, no contra el cuadrado: una foto
 * que ya viene en 4:5 cabe entera y no hay nada que recortar ni que fundir.
 * Las cuadradas que quedan conservan el trato de estudio (contain + multiply,
 * que funde las franjas de crema), y solo las 8 raras se llenan a sangre.
 *
 * La señal buena de verdad seguiría siendo un metacampo en Shopify diciendo de
 * qué tipo es cada foto; mientras no exista, la proporción es lo que hay.
 */
/** La proporción del plato: 4:5, la misma en tarjetas, galería y carrito. */
export const PROPORCION_PLATO = 4 / 5

/** ¿La foto viene EXACTAMENTE en la proporción del plato? */
export function llenaElPlato(
  im: { width?: number | null; height?: number | null } | null | undefined
): boolean {
  if (!im?.width || !im?.height) return false
  return Math.abs(im.width / im.height - PROPORCION_PLATO) <= 0.015
}

/** ¿Es cuadrada? (las que quedan del catálogo viejo) */
function esCuadrada(
  im: { width?: number | null; height?: number | null } | null | undefined
): boolean {
  if (!im?.width || !im?.height) return false
  return Math.abs(im.width / im.height - 1) <= 0.01
}

/**
 * De ambiente = ni cuadrada ni 4:5. Hoy son 8 fotos de 481.
 *
 * Esas sí se llenan a sangre: con `contain` dejarían franjas de plato a los
 * lados, que es el "feo canva de fondo" del que venimos.
 */
export function esFotoDeAmbiente(
  im: { width?: number | null; height?: number | null } | null | undefined
): boolean {
  if (!im?.width || !im?.height) return false
  return !esCuadrada(im) && !llenaElPlato(im)
}

/**
 * Las clases del plato para esta foto. UN solo sitio decide, y de aquí beben
 * la tarjeta, la galería y las miniaturas.
 *
 *   4:5      → "plato-exacta": entera, sin recorte y sin zoom.
 *   cuadrada → "" (trato de estudio: contain + multiply, franjas fundidas).
 *   otra     → "plato-foto": a sangre.
 */
export function clasePlato(
  im: { width?: number | null; height?: number | null } | null | undefined
): string {
  if (llenaElPlato(im)) return "plato-exacta"
  if (esFotoDeAmbiente(im)) return "plato-foto"
  return ""
}
