/**
 * Talleres cuyo logo NO viene sobre fondo claro.
 *
 * El tratamiento de la franja de la portada —escala de grises y multiply sobre
 * la crema— solo funciona si el logo trae fondo blanco o transparencia: el
 * multiply deja pasar el blanco y solo pinta la marca. Con un logo de fondo
 * negro o de color, el multiply pinta el rectángulo entero y la fila queda
 * como una hilera de cuadros oscuros en medio de una página clara.
 *
 * Medí los catorce logos del metaobjeto `brand` con sharp (luminancia media de
 * las cuatro esquinas): ocho vienen sobre blanco o con alfa y seis no —
 *   El Chavalo Boots  fondo 0,0,0        (negro)
 *   DALEO             fondo 1,1,1        (negro)
 *   Jr Robert Western fondo 30,19,10     (café muy oscuro)
 *   Nokota Horse      fondo 194,31,48    (rojo)
 *   Cabrera Boots     fondo 135,70,27    (café)
 *   Josepha           fondo 225,196,198  (rosa)
 * A esos seis se les invierte antes de pasarlos a gris: la marca clara sobre
 * fondo oscuro se vuelve marca oscura sobre fondo claro, y a partir de ahí el
 * multiply hace lo mismo que con los demás.
 *
 * ARREGLO DE VERDAD: que el dueño resuba esos seis con fondo blanco o
 * transparente desde el admin de Shopify; entonces se pueden quitar de aquí.
 * Para volver a medir tras subir logos nuevos: scripts/mide-logos.mjs.
 */
const FONDO_OSCURO = new Set([
  "el-chavalo-boots",
  "daleo",
  "jr-robert-western",
  "nokota-horse",
  "cabrera-boots",
  "josepha",
])

export function logoNecesitaInvertirse(handle: string): boolean {
  return FONDO_OSCURO.has((handle || "").trim().toLowerCase())
}
