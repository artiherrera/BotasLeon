import { ROJO_OFERTA } from "@/lib/ofertas/config"

/**
 * La marca de descuento: una ETIQUETA, no un cuadrado.
 *
 * El dueño mandó rehacerla (2026-11-10): "un cuadrado rojo es muy, muy
 * aburrido". Tenía razón — un rectángulo con un número es la etiqueta que trae
 * de fábrica cualquier tienda en línea, y esta tienda vende botas hechas a
 * mano en León.
 *
 * ES LA ETIQUETA QUE CUELGA DE LA BOTA. La forma no es un adorno: es el objeto
 * que de verdad lleva el precio en una zapatería, con su punta y su ojal para
 * el hilo. Un comprador la reconoce antes de leer el número.
 *
 * DOS COSAS QUE LA SACAN DE LO GENÉRICO, y ninguna rompe el sistema visual del
 * sitio (que es plano: ni degradados ni sombras, aquí tampoco):
 *
 *   1. LA SILUETA. Un pentágono con la punta hacia la foto, no un rectángulo.
 *      Se dibuja en SVG y no con clip-path porque el OJAL tiene que ser un
 *      agujero DE VERDAD —se ve la foto a través— y eso solo se consigue con
 *      fill-rule="evenodd": con CSS habría que taparlo con un círculo de color
 *      fijo, y sobre una foto cualquiera eso se nota.
 *
 *   2. LA TIPOGRAFÍA DE DENTRO. El número grande y el "−" y el "%" chicos. En
 *      el cuadrado todo iba al mismo tamaño y el ojo no tenía dónde posarse;
 *      aquí la cifra manda y los signos la acompañan.
 *
 * SE ESTIRA CON EL NÚMERO. "−5%" y "−30%" no miden lo mismo, así que el ancho
 * del SVG se calcula con el largo del texto en vez de fijarse: con un viewBox
 * fijo y preserveAspectRatio, la punta se deformaría en los números largos.
 *
 * Blanco sobre este rojo da 5.89:1, holgado para la AA.
 */

/** Alto de la etiqueta en px. El resto de medidas salen de este. */
const ALTO = 34
/** Lo que mide la punta. */
const PUNTA = 11
/** Centro y radio del ojal. */
const OJAL_X = 11
const OJAL_R = 3.2

export function InsigniaDescuento({ pct }: { pct: number }) {
  const texto = String(pct)
  // Ancho medido a ojo de letra: el número a 19px en negrita ocupa ~11.5px por
  // cifra, más el "−" y el "%" chicos, más el aire del ojal y de la punta.
  const ancho = Math.round(OJAL_X + 10 + texto.length * 11.5 + 13 + PUNTA)
  const mitad = ALTO / 2

  // Pentágono con la punta a la derecha + el ojal como segundo contorno. Con
  // fill-rule evenodd, el segundo contorno agujerea el primero.
  const contorno = `M0 0 H${ancho - PUNTA} L${ancho} ${mitad} L${ancho - PUNTA} ${ALTO} H0 Z`
  const ojal = `M${OJAL_X - OJAL_R} ${mitad} a${OJAL_R} ${OJAL_R} 0 1 0 ${OJAL_R * 2} 0 a${OJAL_R} ${OJAL_R} 0 1 0 ${-OJAL_R * 2} 0 Z`

  return (
    <svg
      width={ancho}
      height={ALTO}
      viewBox={`0 0 ${ancho} ${ALTO}`}
      role="img"
      aria-label={`${pct}% de descuento`}
      className="block shrink-0"
    >
      <path d={`${contorno} ${ojal}`} fill={ROJO_OFERTA} fillRule="evenodd" />
      <text
        x={OJAL_X + 9}
        y={mitad}
        dominantBaseline="central"
        fill="#FFFFFF"
        fontFamily="var(--font-body), system-ui, sans-serif"
      >
        <tspan fontSize="12" fontWeight="600" dy="-0.5">
          −
        </tspan>
        <tspan fontSize="19" fontWeight="700" style={{ fontVariantNumeric: "tabular-nums" }}>
          {texto}
        </tspan>
        <tspan fontSize="12" fontWeight="600" dy="-0.5">
          %
        </tspan>
      </text>
    </svg>
  )
}
