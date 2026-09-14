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
 * LA PROPORCIÓN ES EL DETECTOR, y no es una corazonada: se muestrearon 28 fotos
 * cuadradas repartidas por todo el catálogo y las 28 tienen fondo claro de
 * estudio. Cero excepciones. Cuadrada = estudio; vertical = ambiente.
 *
 * Si algún día se sube una foto de ambiente YA CUADRADA, esta regla la tratará
 * como de estudio y se verá oscura sobre el plato. La señal buena de verdad
 * sería un metacampo en Shopify que dijera de qué tipo es cada foto.
 */
export function esFotoDeAmbiente(
  im: { width?: number | null; height?: number | null } | null | undefined
): boolean {
  if (!im?.width || !im?.height) return false
  return Math.abs(im.width / im.height - 1) > 0.01
}
