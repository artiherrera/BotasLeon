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
 * EL TEXTO VA CENTRADO ENTRE EL OJAL Y LA PUNTA, que es el hueco que de
 * verdad le queda —no la etiqueta entera—. El dueño lo cazó dos veces, y la
 * segunda tenía razón otra vez: no bastaba con anclar el texto por el medio,
 * porque el ancho se fijaba aparte y dejaba más aire de un lado que del otro.
 * Ahora el aire se declara UNA vez y se usa a los dos lados, y el ancho de la
 * etiqueta sale de ahí.
 *
 * Blanco sobre este rojo da 5.89:1, holgado para la AA.
 */

/**
 * Alto de referencia. TODO lo demás se calcula a partir del alto que reciba la
 * etiqueta, así que subirlo la escala entera sin deformar nada.
 */
const ALTO_BASE = 34

export function InsigniaDescuento({
  pct,
  color = ROJO_OFERTA,
  alto = ALTO_BASE,
}: {
  pct: number
  /**
   * El rojo de la temporada por defecto. Josepha le pasa SU rosa: esa landing
   * existe para no parecerse al resto del sitio y meterle el rojo de la
   * campaña sería justo lo que no debe pasar.
   */
  color?: string
  /**
   * Alto en px. En la tarjeta del catálogo manda el tamaño de la tarjeta; en
   * Josepha, que es una página de franjas a pantalla completa con el precio a
   * 32px o más, una etiqueta de 34px se vería de juguete — y además sobre el
   * rosa de esa página NADA puede bajar de 20px en negrita (blanco sobre
   * #E72B5E da 4.28:1, que solo cumple como texto grande), así que allá se
   * escala hasta que también los signos lo cumplan.
   */
  alto?: number
}) {
  const k = alto / ALTO_BASE
  const PUNTA = 11 * k
  const OJAL_X = 11 * k
  const OJAL_R = 3.2 * k
  const CUERPO_CIFRA = 19 * k
  const CUERPO_SIGNO = 12 * k
  const ALTO = alto

  const texto = String(pct)
  // Ancho del texto a ojo de letra: el "−" chico, cada cifra en negrita, y el
  // "%" chico. Medido en pantalla: para "30" sale 38.8 contra los 39 que
  // estima esta cuenta, así que afina de sobra.
  const anchoTexto = (7 + texto.length * 11 + 10) * k

  /**
   * EL AIRE A LOS DOS LADOS DEL TEXTO, IGUAL, y de ahí sale el ancho.
   *
   * La primera versión hacía lo contrario —fijaba el ancho con una suma de
   * constantes y luego colocaba el texto dentro—, y eso dejaba 4.8px entre el
   * ojal y la cifra contra 7 entre la cifra y la punta: medido en pantalla,
   * 7px de diferencia. Se veía descentrado porque lo estaba.
   *
   * Ahora el hueco del texto se define por sus dos bordes —el canto derecho
   * del ojal y el arranque de la punta— con el mismo aire en los dos, y el
   * ancho de la etiqueta es la consecuencia. Así queda centrado por
   * construcción, no por una cuenta que haya que acertar.
   */
  const AIRE = 6 * k
  const INICIO_TEXTO = OJAL_X + OJAL_R + AIRE
  const ancho = Math.round(INICIO_TEXTO + anchoTexto + AIRE + PUNTA)
  const mitad = ALTO / 2
  const centroTexto = INICIO_TEXTO + anchoTexto / 2

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
      <path d={`${contorno} ${ojal}`} fill={color} fillRule="evenodd" />
      {/* El tamaño del <text> es el de la CIFRA, no el del "%": con
          dominant-baseline central, el centrado vertical se calcula con las
          métricas de la fuente al tamaño del elemento, y lo que tiene que
          quedar a media altura es el número, que es lo que se lee.

          Sin `dy` en los tspan: en SVG el dy de un tspan desplaza también a
          todo lo que viene detrás, así que los dos medios píxeles de la
          versión anterior se sumaban y subían el "%" un píxel entero. El "−",
          la cifra y el "%" comparten línea base, que es como se escribe un
          porcentaje. */}
      <text
        x={centroTexto}
        y={mitad}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={CUERPO_CIFRA}
        fontFamily="var(--font-body), system-ui, sans-serif"
      >
        <tspan fontSize={CUERPO_SIGNO} fontWeight="600">
          −
        </tspan>
        <tspan fontWeight="700" style={{ fontVariantNumeric: "tabular-nums" }}>
          {texto}
        </tspan>
        <tspan fontSize={CUERPO_SIGNO} fontWeight="600">
          %
        </tspan>
      </text>
    </svg>
  )
}
