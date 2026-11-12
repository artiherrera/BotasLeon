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
 *   2. LA TIPOGRAFÍA DE DENTRO. La cifra manda y el "−" y el "%" la
 *      acompañan, pero ACOMPAÑAR NO ES DESAPARECER: a 0.63 del cuerpo de la
 *      cifra los signos se leían como una nota al pie y el dueño lo dijo —"se
 *      ven muy pequeños, no están acorde al número"—. Van a 0.79, que es
 *      donde un porcentaje se lee como una sola pieza sin que el número deje
 *      de mandar.
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

/**
 * Media altura de caja de la tipografía, en fracción del cuerpo. Es lo que hay
 * que bajar la línea base para que el número quede centrado. Se afina
 * midiendo el recuadro del texto contra el alto de la etiqueta.
 */
const MITAD_CAJA = 0.342

/**
 * Cuerpo del "−" y del "%" en fracción del cuerpo de la cifra. Manda la cifra,
 * pero los signos tienen que leerse con ella: por debajo de ~0.75 el
 * porcentaje se parte en dos y la etiqueta parece tener una errata.
 */
const RAZON_SIGNO = 0.79

/**
 * Anchos de letra, en fracción del cuerpo de CADA parte. Medidos en pantalla
 * con la tipografía del sitio, no estimados: con ellos el recuadro del texto
 * cae a menos de medio píxel del ancho que reserva la etiqueta.
 */
const ANCHO_MENOS = 0.58
const ANCHO_CIFRA = 0.58
const ANCHO_PORCIENTO = 0.83

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
  const CUERPO_SIGNO = CUERPO_CIFRA * RAZON_SIGNO
  const ALTO = alto

  const texto = String(pct)
  /**
   * Ancho del texto, en anchos de letra. Cada parte se estima SOBRE SU PROPIO
   * CUERPO —no sobre el de la etiqueta— porque los signos y la cifra no van al
   * mismo tamaño: con los anchos escritos a mano, subir el cuerpo de los
   * signos dejaba la cuenta corta y el texto se descentraba otra vez.
   */
  const anchoTexto =
    (ANCHO_MENOS + ANCHO_PORCIENTO) * CUERPO_SIGNO +
    texto.length * ANCHO_CIFRA * CUERPO_CIFRA

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
      {/* EL CENTRADO VERTICAL VA POR LÍNEA BASE, no con dominant-baseline.
          *
          * `dominant-baseline="central"` centra la CAJA DE LA LETRA —de la
          * altura del ascendente a la del descendente—, y las cifras no tienen
          * rasgo descendente: todo ese hueco de abajo se lo queda la caja y el
          * número sube. Se veía, y el dueño lo dijo con las palabras exactas:
          * "están muy arriba, y mucho aire abajo".
          *
          * Lo que hay que centrar es la ALTURA DE LA CIFRA. Como las mayúsculas
          * y los números van de la línea base hacia arriba una altura de caja
          * (≈0.71 del cuerpo en esta tipografía), su centro óptico está a media
          * altura de caja por encima de la línea base. Así que la línea base se
          * baja esa mitad desde el centro de la etiqueta y el número queda
          * centrado de verdad. Comprobado midiendo el recuadro del texto en
          * pantalla, no a ojo.
          *
          * Sin `dy` en los tspan: en SVG el dy de un tspan desplaza también a
          * todo lo que viene detrás, así que se iban sumando. El "−", la cifra
          * y el "%" comparten línea base, que es como se escribe un
          * porcentaje. */}
      <text
        x={centroTexto}
        y={mitad + MITAD_CAJA * CUERPO_CIFRA}
        textAnchor="middle"
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
