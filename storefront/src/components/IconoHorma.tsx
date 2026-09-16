/**
 * La punta de la bota vista desde arriba, en un trazo — como los íconos de
 * horma de Tecovas, que el dueño pidió copiar.
 *
 * LAS CLAVES SON LOS HANDLES DE SHOPIFY, y el dueño los cambió. Cuando se
 * dibujó esto, shopify.toe-style traía cinco valores heredados de la taxonomía
 * de Shopify (en-punta, dubai, redondo, cuadrado, semioval); al día siguiente
 * el catálogo, medido otra vez, tiene cuatro con los nombres que el dueño
 * había pedido desde el principio: fina (33 botas), semicuadrada (30), redonda
 * (24) y cuadrada (18). Con las claves viejas, ningún handle tenía dibujo y el
 * filtro enseñaba círculos con "Cu", "Re" — "quedó peor". Se guardan los
 * handles viejos como alias por si alguno vuelve a aparecer: un valor sin ícono
 * se ve roto, y cuesta nada.
 *
 * Cada dibujo es el contorno de la punta: los dos lados de la horma subiendo y
 * cómo se cierran arriba. Es lo ÚNICO que cambia entre ellos; el resto
 * —el ancho, la costura del empeine, el círculo— es idéntico para que la vista
 * compare puntas y no dibujos.
 *
 * Trazo 1.5 a 32px —más que los 20 del set— porque la diferencia entre una
 * punta y otra está en unos pocos píxeles de la parte de arriba y a 20 no se
 * distinguen. Las puntas ocupan 10 de los 24 de ancho del viewBox; la primera
 * versión ocupaba 6 y se veían como palitos. El círculo lo pone el botón que
 * lo envuelve, no el SVG, para poder ponerlo en tinta cuando la horma está
 * elegida.
 *
 * SILUETA DE BOTA, no rectángulo. La primera versión eran rectángulos con
 * distinta tapa y se veían como palitos. Una punta vista desde arriba se
 * ESTRECHA hacia adelante —arranca ancha en el empeine y se cierra en la
 * punta— y las costuras van curvas, siguiendo el volumen, no rectas.
 *
 * Todas comparten el cuerpo entero (los dos lados que se estrechan y la base
 * curva) y cambian SOLO el cierre entre (7.5,10) y (16.5,10):
 *   cuadrada       frente plano con las esquinas apenas matadas
 *   semicuadrada   trapecio: hombros en ángulo y un frente corto (la "Dubai")
 *   redonda        medio círculo
 *   fina           vértice (la "en punta")
 *   semioval       arco más alto que el redondo, entre éste y la punta
 */
const CUERPO_IZQ = "M6.5 21 L7.5 10"
const CUERPO_DER = "L17.5 21 Q12 22.6 6.5 21 Z"
const CIERRES: Record<string, string> = {
  cuadrada: "Q7.5 6.5 9 6.5 H15 Q16.5 6.5 16.5 10",
  semicuadrada: "L9 5.5 H15 L16.5 10",
  redonda: "A4.5 4.5 0 0 1 16.5 10",
  fina: "L12 3 L16.5 10",
  semioval: "A4.5 6.2 0 0 1 16.5 10",
}
/** Handles viejos de la taxonomía de Shopify → los de hoy. */
const ALIAS: Record<string, string> = {
  cuadrado: "cuadrada",
  dubai: "semicuadrada",
  redondo: "redonda",
  "en-punta": "fina",
}
const TRAZOS: Record<string, string> = Object.fromEntries([
  ...Object.entries(CIERRES).map(([k, c]) => [k, `${CUERPO_IZQ} ${c} ${CUERPO_DER}`]),
  ...Object.entries(ALIAS).map(([viejo, nuevo]) => [
    viejo,
    `${CUERPO_IZQ} ${CIERRES[nuevo]} ${CUERPO_DER}`,
  ]),
])

/** Dos costuras curvas, iguales en las cinco: siguen el volumen del empeine. */
const EMPEINE = "M9 15 Q12 14 15 15 M9 18 Q12 17 15 18"

export function IconoHorma({
  handle,
  className = "",
}: {
  /** El handle del metaobjeto de Shopify: fina, semicuadrada, redonda, cuadrada (o un alias viejo). */
  handle: string
  className?: string
}) {
  const d = TRAZOS[handle]
  if (!d) return null
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
      <path d={EMPEINE} />
    </svg>
  )
}

/** ¿Hay dibujo para esta horma? Para no pintar un círculo vacío. */
export const tieneIconoHorma = (handle: string) => handle in TRAZOS
