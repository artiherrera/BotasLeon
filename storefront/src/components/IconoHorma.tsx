/**
 * La punta de la bota vista desde arriba, en un trazo — como los íconos de
 * horma de Tecovas, que el dueño pidió copiar.
 *
 * CINCO Y NO CUATRO. El dueño listó fina, semicuadrada, redonda y cuadrada;
 * el catálogo, medido, tiene cinco valores de shopify.toe-style: En punta
 * (34 botas), Dubai (32), Redondo (20), Cuadrado (18) y Semioval (4). "Fina" es
 * En punta y "semicuadrada" es la Dubai — que además es como la llaman los
 * clientes y como está escrita en las 32 fichas. Se dibuja la quinta, la
 * Semioval, porque un filtro con un valor sin ícono se ve roto.
 *
 * Cada dibujo es el contorno de la punta: los dos lados de la horma subiendo y
 * cómo se cierran arriba. Es lo ÚNICO que cambia entre los cinco; el resto
 * —el ancho, la costura del empeine, el círculo— es idéntico para que la vista
 * compare puntas y no dibujos.
 *
 * Trazo 1.5 a 28px —un poco más que los 20 del set— porque la diferencia
 * entre una punta y otra está en unos pocos píxeles de la parte de arriba y a
 * 20 no se distinguen. Las puntas ocupan 10 de los 24 de ancho del viewBox;
 * la primera versión ocupaba 6 y se veían como palitos. El
 * círculo lo pone el botón que lo envuelve, no el SVG, para poder ponerlo en
 * tinta cuando la horma está elegida.
 */
const TRAZOS: Record<string, string> = {
  // Se cierra en un vértice: la fina, la del vaquero de siempre.
  "en-punta": "M8 20 V11 L12 4 L16 11 V20",
  // Semicuadrada: cierra en un frente corto y plano, con las esquinas
  // matadas. La Dubai.
  dubai: "M7.5 20 V10 L9.5 5.5 H14.5 L16.5 10 V20",
  // Redonda: un arco.
  redondo: "M7.5 20 V10.5 A4.5 4.5 0 0 1 16.5 10.5 V20",
  // Cuadrada: frente plano y ancho, esquinas apenas suavizadas.
  cuadrado: "M7 20 V7 Q7 5.5 8.5 5.5 H15.5 Q17 5.5 17 7 V20",
  // Semioval: entre la redonda y la fina — un arco más alto y estrecho.
  semioval: "M8 20 V10 A4 5.5 0 0 1 16 10 V20",
}

/** La costura del empeine, igual en las cinco: dos líneas cortas. */
const EMPEINE = "M10 14.5 H14 M10 17 H14"

export function IconoHorma({
  handle,
  className = "",
}: {
  /** El handle del metaobjeto de Shopify: en-punta, dubai, redondo, cuadrado, semioval. */
  handle: string
  className?: string
}) {
  const d = TRAZOS[handle]
  if (!d) return null
  return (
    <svg
      width="28"
      height="28"
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
