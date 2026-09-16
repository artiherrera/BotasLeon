/**
 * La punta de la bota vista desde arriba, en un trazo — como los íconos de
 * horma de Tecovas, que el dueño pidió copiar.
 *
 * TERCERA VERSIÓN, calcada de la referencia y no interpretada. Las dos
 * anteriores cerraban la figura por abajo con una base curva y llevaban las
 * costuras curvas: parecían dedales, no hormas ("están horribles", dijo el
 * dueño). Medido sobre la captura de Tecovas, lo que hace que se lean como
 * una punta es justo lo contrario:
 *   · ABIERTA POR ABAJO: los dos lados suben desde el empeine y solo se
 *     tocan arriba, en la punta. Sin base no hay "objeto"; hay una punta.
 *   · Los lados casi rectos, apenas más abiertos abajo (el empeine es más
 *     ancho que la punta).
 *   · DOS COSTURAS RECTAS y cortas cerca de la base —la del bies de la
 *     puntera— iguales en todas.
 *   · La figura ocupa ~40% del ancho del círculo y ~50% del alto; a 28% se
 *     veían como miniaturas.
 *
 * Lo único que cambia entre hormas es cómo se cierra la punta:
 *   cuadrada       lados casi verticales, frente plano ancho con esquinas
 *                  redondeadas
 *   semicuadrada   trapecio: lados en ángulo y un frente corto (la "Cutter"
 *                  de Tecovas; aquí la llaman Dubai)
 *   redonda        bala: lados rectos y medio círculo arriba
 *   fina           vértice con un corte mínimo (la "Snip")
 *   semioval       arco alto, entre la redonda y la fina
 *
 * LAS CLAVES SON LOS HANDLES DE SHOPIFY, y el dueño los cambió una vez
 * (en-punta/dubai/redondo/cuadrado → fina/semicuadrada/redonda/cuadrada);
 * con las claves viejas ningún handle tenía dibujo y el filtro enseñaba
 * círculos con "Cu", "Re". Los viejos quedan como alias por si alguno vuelve.
 *
 * Trazo 1.15 a 32px: fino, como el de la referencia. El círculo lo pone el
 * botón que lo envuelve, no el SVG, para poder ponerlo en tinta cuando la
 * horma está elegida.
 */
const CONTORNOS: Record<string, string> = {
  cuadrada:
    "M5.5 21 C5.7 15.5 6 9.5 6.3 6.2 Q6.4 4.6 8 4.6 H16 Q17.6 4.6 17.7 6.2 C18 9.5 18.3 15.5 18.5 21",
  semicuadrada: "M5.5 21 C5.9 15 6.8 9.5 9 4.6 H15 C17.2 9.5 18.1 15 18.5 21",
  redonda:
    "M5.5 21 C5.7 15.5 6 11.5 6.3 9.6 A5.7 5.7 0 0 1 17.7 9.6 C18 11.5 18.3 15.5 18.5 21",
  fina: "M5.5 21 C5.9 15 6.8 8.5 11.2 3.8 H12.8 C17.2 8.5 18.1 15 18.5 21",
  semioval: "M5.5 21 C5.5 13 7.4 5.6 12 3.8 C16.6 5.6 18.5 13 18.5 21",
}
/** Handles viejos de la taxonomía de Shopify → los de hoy. */
const ALIAS: Record<string, string> = {
  cuadrado: "cuadrada",
  dubai: "semicuadrada",
  redondo: "redonda",
  "en-punta": "fina",
}
const TRAZOS: Record<string, string> = {
  ...CONTORNOS,
  ...Object.fromEntries(Object.entries(ALIAS).map(([viejo, nuevo]) => [viejo, CONTORNOS[nuevo]])),
}

/** Las dos costuras de la puntera, rectas e iguales en todas. */
const COSTURA = "M8.6 17.2 H15.4 M8.6 19.1 H15.4"

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
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
      <path d={COSTURA} />
    </svg>
  )
}

/** ¿Hay dibujo para esta horma? Para no pintar un círculo vacío. */
export const tieneIconoHorma = (handle: string) => handle in TRAZOS
