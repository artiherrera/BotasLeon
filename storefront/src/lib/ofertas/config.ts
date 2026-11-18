import { isMX } from "@/lib/market"

/**
 * LAS OFERTAS, VISIBLES DESDE EL PRIMER VISTAZO — el interruptor y las fechas.
 *
 * Los descuentos de esta tienda son DESCUENTOS AUTOMÁTICOS de Shopify, y la
 * Storefront API no los expone en el producto: solo aparecen cuando algo ya
 * está dentro de un carrito. Sin esto, el sitio enseñaría $5,299, el cliente
 * decidiría si le alcanza, y el precio de verdad —$3,709.30— no aparecería
 * hasta el carrito. Después de haber decidido.
 *
 * Lo que NO cambia: el precio lo sigue diciendo Shopify. Aquí no se calcula
 * ningún descuento a mano (ver lib/ofertas/datos.ts y el script que lo
 * alimenta). Lo único que cambia es DÓNDE se enseña lo que Shopify ya cobra.
 *
 * ESTE MÓDULO YA NO SABE NADA DEL BUEN FIN. La campaña de noviembre de 2026 se
 * desmontó el día 18, y con ella lib/buenfin.ts, el cintillo rojo y la página
 * con ese nombre. Lo que queda es el motor, que es genérico y sirve para la
 * siguiente temporada sin tocar más que las fechas.
 */

/**
 * EL INTERRUPTOR MAESTRO. En false el sitio enseña precio de lista en tarjeta
 * y ficha, y el descuento solo asoma en el carrito. No hay que tocar ni una
 * línea más para apagarlo todo.
 *
 * ENCENDIDO para Black Friday (2026-11-18), con la ventana puesta del 27 al
 * 30: hasta el 27 no se pinta un solo tachado, porque `descuentoVisible()`
 * exige las TRES condiciones —interruptor, ventana y build—. Encenderlo con
 * nueve días de antelación es a propósito: así el workflow horario entra en
 * su ventana la víspera y dispara el build que hace falta, en vez de depender
 * de que alguien se acuerde de desplegar el viernes a medianoche.
 */
export const MOSTRAR_DESCUENTO_EN_SITIO = true

/**
 * EL ROJO DE LA OFERTA. Lo usan la insignia de cada tarjeta y la pestaña de
 * temporada del menú. Dos constantes con el mismo color se separan en cuanto
 * alguien retoca una.
 *
 * No sale del sistema visual del sitio —que es crema y tinta— porque no es del
 * sitio: es de la temporada. Con texto blanco encima da 5.89:1, holgado para
 * la AA.
 */
export const ROJO_OFERTA = "#C8102E"

/**
 * Black Friday 2026: del viernes 27 al lunes 30 de noviembre.
 *
 * Van AQUÍ ARRIBA, antes que la ventana, porque la ventana las usa: un `const`
 * no existe antes de su propia línea y declararlas después revienta en
 * arranque con un ReferenceError, no en compilación.
 */
export const BLACK_FRIDAY_INICIO = "2026-11-27T00:00:00-06:00"
export const BLACK_FRIDAY_FIN = "2026-11-30T23:59:59-06:00"

/**
 * LA VENTANA DE FECHAS.
 *
 * NO ES UNA GARANTÍA AUTOMÁTICA, Y AQUÍ SE DIJO QUE LO ERA. La versión
 * anterior de este comentario afirmaba que la ventana era "instantánea" y que
 * al minuto de cerrar una campaña el catálogo volvía a precio de lista "sin
 * compilar nada y sin que nadie tenga que acordarse". Es FALSO en este
 * despliegue:
 *
 *   Amplify NO regenera las páginas entre despliegues aunque declaren
 *   `export const revalidate = 60`. Está medido en producción y ya estaba
 *   escrito en el repo (ver BotasExoticas.tsx) ANTES de que esto se
 *   escribiera; no se cotejó.
 *
 * Lo que costó: el Buen Fin cerró el 17 de noviembre a las 23:59:59 y el
 * último build se hizo a las 19:29 de ese mismo día. Durante las 19 horas
 * siguientes botasleon.mx siguió enseñando 15 tachados y 15 "Ahorras" de
 * descuentos que Shopify ya tenía apagados. El sitio anunció precios que la
 * caja no cobraba, que era la única cosa que el dueño puso como condición de
 * que no pasara.
 *
 * LA REGLA QUE SÍ VALE: cerrar una campaña EXIGE UN DESPLIEGUE. Las fechas
 * sirven para que el build salga correcto, no para apagar nada por su cuenta.
 * Lo único que se apaga solo es lo que mira el reloj EN EL NAVEGADOR (los
 * cronómetros), porque ahí no hay nada horneado.
 *
 * Ambas en null mientras no haya campaña: manda el interruptor de arriba.
 * Cuando se pongan, en hora de México como el resto del sitio: una promoción
 * que terminara a la medianoche de cada quien seguiría viva dos horas más en
 * Tijuana que en León.
 */
export const INICIO_DESCUENTO: string | null = BLACK_FRIDAY_INICIO
export const FIN_DESCUENTO: string | null = BLACK_FRIDAY_FIN

/**
 * EL PORCENTAJE QUE SE ANUNCIA ANTES DE QUE EMPIECE una campaña, escrito a
 * mano.
 *
 * Antes de que arranquen los descuentos en Shopify no hay nada que simular y
 * el "hasta X%" no puede salir de los datos: sale de aquí. Es una PROMESA, y
 * el único número del sitio que no está respaldado por lo que la caja cobra
 * —en cuanto arranca la campaña manda otra vez la simulación y este número
 * deja de usarse—.
 *
 * Solo se usa en antesala, así que hoy no se pinta en ninguna parte.
 */
export const DESCUENTO_ANUNCIADO = 30

const INICIO_MS = INICIO_DESCUENTO ? Date.parse(INICIO_DESCUENTO) : null
const FIN_MS = FIN_DESCUENTO ? Date.parse(FIN_DESCUENTO) : null

/**
 * Los días del mes que anuncia la antesala ("del 13 al 17 de noviembre").
 *
 * Salen de la VENTANA configurada arriba, no de una campaña concreta: antes
 * los traía lib/buenfin.ts y eso ataba el motor a una campaña que ya pasó.
 *
 * Se leen de la cadena ISO y no con `new Date()` a propósito: construir una
 * fecha y pedirle el día la pasa por la zona horaria del visitante, y en
 * Madrid el 13 a las 00:00 de México ya es día 14. El mes va en el
 * diccionario.
 *
 * Sin ventana puesta valen 0 y no se pintan: `enAntesala()` ya devuelve false.
 */
const diaDe = (iso: string | null): number => (iso ? Number(iso.slice(8, 10)) : 0)
export const DIA_INICIO = diaDe(INICIO_DESCUENTO)
export const DIA_FIN = diaDe(FIN_DESCUENTO)

/**
 * ¿Se enseñan hoy los descuentos en el sitio?
 *
 * Recibe el "ahora" en vez de leer el reloj: el sitio es estático y se hornea
 * en el build. Sin fechas configuradas no depende de la hora y da igual lo que
 * se le pase.
 */
export function descuentoVisible(ahoraMs: number = Date.now()): boolean {
  if (!MOSTRAR_DESCUENTO_EN_SITIO) return false
  if (INICIO_MS !== null && ahoraMs < INICIO_MS) return false
  if (FIN_MS !== null && ahoraMs > FIN_MS) return false
  return true
}

/* ── Cómo se llama la temporada ────────────────────────────────────────────
 *
 * El mismo descuento se anuncia con nombre distinto según el día. Fuera de una
 * temporada con nombre, "ofertas" —que es la palabra honesta: el descuento
 * sigue ahí, lo que se acabó es el nombre de la campaña.
 *
 * EL BUEN FIN SE FUE DE AQUÍ. Era mexicano (una campaña de CONCANACO con la
 * banca de aquí) y por eso llevaba `soloMx`. Esa bandera se queda en la tabla
 * porque la siguiente campaña mexicana la volverá a necesitar.
 */
export type Evento = "blackfriday" | "ofertas"

const TEMPORADAS: { clave: Evento; inicio: number; fin: number; soloMx: boolean }[] = [
  {
    clave: "blackfriday",
    inicio: Date.parse(BLACK_FRIDAY_INICIO),
    fin: Date.parse(BLACK_FRIDAY_FIN),
    soloMx: false,
  },
]

/**
 * Cómo se llama hoy la temporada.
 *
 * OJO: esto solo decide el NOMBRE. Que las fechas de Black Friday estén aquí
 * no enciende nada —eso lo hace MOSTRAR_DESCUENTO_EN_SITIO— ni se encenderá
 * solo el día 27: hace falta desplegar.
 */
export function eventoActual(ahoraMs: number = Date.now()): Evento {
  for (const t of TEMPORADAS) {
    if (t.soloMx && !isMX) continue
    if (ahoraMs >= t.inicio && ahoraMs <= t.fin) return t.clave
  }
  return "ofertas"
}

/**
 * La llave del diccionario con el nombre de la temporada: "Black Friday" u
 * "Ofertas".
 */
export function llaveNombreEvento(evento: Evento): string {
  return `oferta.nombre.${evento}`
}

/**
 * ¿Tiene sentido la pestaña de temporada en el menú?
 *
 * Se decide con el número que el prebuild deja escrito y no con una condición
 * por mercado: el día que Shopify tenga descuentos para Estados Unidos —en
 * Black Friday, por ejemplo— la pestaña aparece sola allá también, sin tocar
 * nada. Con el interruptor apagado devuelve false siempre, que es lo que hoy
 * mantiene la pestaña fuera del menú.
 */
export function hayVitrina(maximoReal: number, ahoraMs: number = Date.now()): boolean {
  if (enAntesala(ahoraMs)) return true
  return descuentoVisible(ahoraMs) && maximoReal > 0
}

export function llaveVitrina(ahoraMs: number = Date.now()): string {
  if (enAntesala(ahoraMs)) return llaveNombreEvento(eventoAnunciado())
  return llaveNombreEvento(eventoActual(ahoraMs))
}

/**
 * EL EVENTO QUE ANUNCIA LA ANTESALA: el que empieza cuando abre la ventana.
 *
 * Sin esto, durante la antesala el sitio decía "Pronto en Botas León" y la
 * pestaña del menú decía "Ofertas", porque `eventoActual()` mira HOY y hoy
 * todavía no es Black Friday. Anunciar una campaña sin decir cuál es
 * desperdiciar el único nombre que el cliente ya reconoce.
 */
export function eventoAnunciado(): Evento {
  return INICIO_MS === null ? "ofertas" : eventoActual(INICIO_MS)
}

/**
 * LA RUTA DE LA PÁGINA NO CAMBIA CON LA TEMPORADA, aunque el título sí.
 *
 * Se llamó /buen-fin durante la campaña, por encargo del dueño. Al desmontarla
 * (2026-11-18) pasó a /ofertas, que es el nombre que no caduca: una dirección
 * con nombre de campaña envejece mal y deja enlaces muertos en cada anuncio y
 * cada correo que ya salió. Los enlaces viejos a /buen-fin siguen funcionando
 * con una redirección permanente (ver next.config.ts).
 */
export const RUTA_OFERTAS = "/ofertas"

/**
 * LA ANTESALA: la campaña está anunciada pero todavía no empieza.
 *
 * Antes de que arranquen los descuentos no hay nada que simular, así que el
 * sitio no puede enseñar tachados — pero sí puede decir lo que viene: en
 * antesala la portada anuncia DESCUENTO_ANUNCIADO y /ofertas enseña el aviso
 * con el botón de WhatsApp en vez de una rejilla vacía.
 *
 * Ya no depende de la fecha del Buen Fin sino de INICIO_DESCUENTO, que es lo
 * genérico: sin fecha de inicio configurada no hay campaña anunciada y no hay
 * antesala.
 *
 * EN LOS DOS MERCADOS desde el 2026-11-18. Llevaba un `if (!isMX) return
 * false` de cuando la campaña era el Buen Fin, que es de CONCANACO y la banca
 * mexicana. Black Friday es de los dos lados y el dueño lo pidió para las dos
 * tiendas. Qué campaña aplica en qué mercado lo decide la bandera `soloMx` de
 * TEMPORADAS, que es el único sitio donde debe vivir esa regla.
 */
export function enAntesala(ahoraMs: number = Date.now()): boolean {
  // SI YA HAY DESCUENTOS A LA VISTA, NO HAY ANTESALA QUE ANUNCIAR. Anunciar
  // "hasta un 30%" como promesa futura mientras las tarjetas ya enseñan el 30%
  // tachado sería contarle al cliente dos historias distintas en la misma
  // pantalla. La antesala es para cuando NO hay nada que enseñar.
  if (descuentoVisible(ahoraMs)) return false
  if (INICIO_MS === null) return false
  return ahoraMs < INICIO_MS
}

/**
 * Cuándo termina la temporada vigente, en ISO. Es lo que el JSON-LD publica
 * como `priceValidUntil`: decirle a Google hasta cuándo vale el precio que
 * está viendo, que es justo lo que evita que marque discrepancia cuando el
 * precio vuelva a subir.
 *
 * Fuera de campaña devuelve null y el dato no se publica: un precio de lista
 * no caduca.
 */
export function finDeTemporada(ahoraMs: number = Date.now()): string | null {
  for (const t of TEMPORADAS) {
    if (t.soloMx && !isMX) continue
    if (ahoraMs >= t.inicio && ahoraMs <= t.fin) {
      return new Date(t.fin).toISOString().slice(0, 10)
    }
  }
  // Sin temporada con nombre, manda la ventana del interruptor, si la hay.
  return FIN_MS !== null ? new Date(FIN_MS).toISOString().slice(0, 10) : null
}
