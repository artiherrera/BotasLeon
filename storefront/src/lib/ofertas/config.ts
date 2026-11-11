import { isMX } from "@/lib/market"
import { BUEN_FIN_INICIO, BUEN_FIN_FIN } from "@/lib/buenfin"

/**
 * LAS OFERTAS, VISIBLES DESDE EL PRIMER VISTAZO — el interruptor y las fechas.
 *
 * El encargo del dueño (2026-11-10): "si hay ofertas, están en Shopify, pero
 * se aplican cuando están en el carrito. Ahora las quiero visibles".
 *
 * El diagnóstico es exacto. Los descuentos de esta tienda son DESCUENTOS
 * AUTOMÁTICOS de Shopify, y la Storefront API no los expone en el producto:
 * solo aparecen cuando algo ya está dentro de un carrito. Por eso el sitio
 * enseñaba $5,299, el cliente decidía si le alcanzaba, y el precio de verdad
 * —$3,709.30— no aparecía hasta el carrito. Después de haber decidido.
 *
 * Lo que NO cambia: el precio lo sigue diciendo Shopify. Aquí no se calcula
 * ningún descuento a mano (ver lib/ofertas/datos.ts y el script que lo
 * alimenta). Lo único que cambia es DÓNDE se enseña lo que Shopify ya cobra.
 */

/**
 * EL INTERRUPTOR. En false, el sitio vuelve exactamente a como estaba: precio
 * de lista en tarjeta y ficha, el descuento asomando solo en el carrito. No
 * hay que tocar ni una línea más.
 *
 * Existe porque el dueño ya tomó la decisión contraria una vez: cuando se
 * generó el mapa de precios reales (2026-10-28) decidió no sacarlo al catálogo
 * entero —"113 de 118 botas tienen descuento, y poner antes/ahora en el
 * catálogo entero lo convertiría en una tienda de ofertas"—. El Buen Fin es
 * justo la temporada en la que esa objeción deja de aplicar. Cuando pase,
 * puede volver con este booleano.
 */
export const MOSTRAR_DESCUENTO_EN_SITIO = true

/**
 * EL ROJO DE LA OFERTA. El mismo del cintillo del Buen Fin, y vive aquí
 * porque ahora lo usan los dos: la barra de arriba y la insignia de cada
 * tarjeta. Dos constantes con el mismo color se separan en cuanto alguien
 * retoca una.
 *
 * No sale del sistema visual del sitio —que es crema y tinta— porque no es del
 * sitio: es de la temporada. Con texto blanco encima da 5.89:1, holgado para
 * la AA. El Pantone oficial del Buen Fin (#ED1C24) se queda en 4.38:1 y no
 * pasa, por eso este va un punto más hondo.
 */
export const ROJO_OFERTA = "#C8102E"

/**
 * LA VENTANA DURA. Es la garantía de que el sitio nunca enseña un precio
 * rebajado que el carrito ya no cobra, y no depende de ningún despliegue.
 *
 * El dueño lo puso como condición (2026-11-10): los descuentos de Shopify
 * estarán APAGADOS hasta el 13 de noviembre a las 00:00 y se apagan solos al
 * terminar el evento; el sitio tiene que seguir esos cambios por su cuenta.
 *
 * Hay dos mecanismos y hacen falta los dos:
 *
 *   1. ESTA VENTANA, que es instantánea. Todas las páginas con precio
 *      revalidan cada 60 segundos (`export const revalidate = 60`), así que a
 *      los sesenta segundos del minuto de cierre `descuentoVisible` devuelve
 *      false, `ofertaDe` devuelve null y el catálogo entero vuelve a precio de
 *      lista. Sin compilar nada y sin que nadie tenga que acordarse.
 *
 *   2. EL REGENERADO PERIÓDICO (ver .github/workflows/), que refresca CUÁNTO
 *      descuenta cada bota. Eso sí necesita un build, y por eso corre cada
 *      hora mientras dura la campaña: si el dueño profundiza un descuento a
 *      media campaña, el sitio lo recoge en menos de una hora.
 *
 * El mecanismo 1 tapa el agujero del 2: aunque el archivo de precios se quede
 * viejo, fuera de la ventana no se enseña ni un tachado.
 *
 * PARA BLACK FRIDAY: se cambian estas dos fechas por las de BLACK_FRIDAY_*.
 * Son las únicas dos líneas que hay que tocar.
 *
 * En hora de México, como el resto del sitio: una promoción que terminara a la
 * medianoche de cada quien seguiría viva dos horas más en Tijuana que en León.
 */
/**
 * SIN FECHA DE INICIO: los descuentos se ven DESDE YA.
 *
 * Lo pidió el dueño el 2026-11-10 —"quiero que los descuentos sean visibles
 * ya"— tres días antes de que arranque el Buen Fin. Y es defendible: los
 * descuentos ya están puestos en Shopify y la caja ya los cobra, así que
 * esconderlos hasta el viernes era esconder un precio que ya es verdad.
 *
 * LA FECHA DE FIN SÍ SE QUEDA, que es la que importa: es la que garantiza que
 * el sitio deje de enseñar tachados en cuanto cierre la campaña, aunque nadie
 * despliegue nada.
 */
export const INICIO_DESCUENTO: string | null = null
export const FIN_DESCUENTO: string | null = BUEN_FIN_FIN

/**
 * EL PORCENTAJE QUE SE ANUNCIA ANTES DE QUE EMPIECE, escrito a mano.
 *
 * Antes del 13 no hay descuentos en Shopify, así que no hay nada que simular y
 * el "hasta X%" no puede salir de los datos: sale de aquí. Es una PROMESA, y
 * el único número del sitio que no está respaldado por lo que la caja cobra
 * —en cuanto arranca la campaña manda otra vez la simulación
 * (DESCUENTO_MAXIMO_REAL) y este número deja de usarse—.
 *
 * Si el dueño cambia lo que va a ofrecer, este es el número que hay que mover.
 */
export const DESCUENTO_ANUNCIADO = 30

/**
 * Los días del Buen Fin, sacados de las fechas de lib/buenfin.ts en vez de
 * volver a escribirlos. Se leen de la cadena ISO y no con `new Date()` a
 * propósito: construir una fecha y pedirle el día la pasa por la zona horaria
 * del visitante, y en Madrid el 13 a las 00:00 de México ya es día 14.
 *
 * El mes va escrito en el diccionario ("de noviembre"): el Buen Fin es de
 * noviembre por definición.
 */
export const DIA_INICIO = Number(BUEN_FIN_INICIO.slice(8, 10))
export const DIA_FIN = Number(BUEN_FIN_FIN.slice(8, 10))

const INICIO_MS = INICIO_DESCUENTO ? Date.parse(INICIO_DESCUENTO) : null
const FIN_MS = FIN_DESCUENTO ? Date.parse(FIN_DESCUENTO) : null

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
 * El mismo descuento se anuncia con nombre distinto según el día. Las fechas
 * del Buen Fin NO se copian aquí: salen de lib/buenfin.ts, que es donde ya
 * viven y de donde las lee el cintillo. Dos listas con las mismas fechas se
 * separan en cuanto alguien corrige una sola.
 *
 * EL BUEN FIN ES MEXICANO. Es una campaña de CONCANACO con la banca de aquí:
 * en botasleon.com no significa nada, así que allá esos mismos días se llaman
 * "Ofertas" hasta que llegue el Black Friday, que sí es de allá.
 */
export type Evento = "buenfin" | "blackfriday" | "ofertas"

/** Black Friday 2026: del viernes 27 al lunes 30 de noviembre. */
export const BLACK_FRIDAY_INICIO = "2026-11-27T00:00:00-06:00"
export const BLACK_FRIDAY_FIN = "2026-11-30T23:59:59-06:00"

const TEMPORADAS: { clave: Evento; inicio: number; fin: number; soloMx: boolean }[] = [
  {
    clave: "buenfin",
    inicio: Date.parse(BUEN_FIN_INICIO),
    fin: Date.parse(BUEN_FIN_FIN),
    soloMx: true,
  },
  {
    clave: "blackfriday",
    inicio: Date.parse(BLACK_FRIDAY_INICIO),
    fin: Date.parse(BLACK_FRIDAY_FIN),
    soloMx: false,
  },
]

/**
 * Cómo se llama hoy la temporada. Fuera de las fechas marcadas, "ofertas" —que
 * es la palabra honesta: el descuento sigue ahí, lo que se acabó es el nombre
 * de la campaña.
 */
export function eventoActual(ahoraMs: number = Date.now()): Evento {
  for (const t of TEMPORADAS) {
    if (t.soloMx && !isMX) continue
    if (ahoraMs >= t.inicio && ahoraMs <= t.fin) return t.clave
  }
  return "ofertas"
}

/**
 * La llave del diccionario con el nombre de la temporada: "El Buen Fin",
 * "Black Friday" u "Ofertas".
 */
export function llaveNombreEvento(evento: Evento): string {
  return `oferta.nombre.${evento}`
}

/**
 * LA RUTA DE LA PÁGINA NO CAMBIA CON LA TEMPORADA, aunque el título sí.
 *
 * Se llama /buen-fin porque así la nombró el dueño ("la página de ofertas se
 * llama buen fin"). Una dirección que cambiara de nombre en diciembre rompería
 * cada enlace compartido, cada anuncio y cada correo que ya salió; el título
 * de la página, en cambio, sí sigue a la fecha.
 */
export const RUTA_OFERTAS = "/buen-fin"

/**
 * LA ANTESALA: la campaña está anunciada pero todavía no empieza.
 *
 * Entre hoy y el 13 de noviembre no hay un solo descuento que simular, así que
 * el sitio no puede enseñar tachados — pero sí puede decir lo que viene. En
 * antesala el cintillo y la portada anuncian fechas y el porcentaje de
 * DESCUENTO_ANUNCIADO, y /buen-fin enseña el aviso con el botón de WhatsApp en
 * vez de una rejilla vacía.
 *
 * Solo en México: donde no hay Buen Fin no hay antesala que anunciar.
 */
export function enAntesala(ahoraMs: number = Date.now()): boolean {
  if (!isMX) return false
  // SI YA HAY DESCUENTOS A LA VISTA, NO HAY ANTESALA QUE ANUNCIAR. Anunciar
  // "hasta un 30%" como promesa futura mientras las tarjetas ya enseñan el
  // 30% tachado sería contarle al cliente dos historias distintas en la misma
  // pantalla. La antesala es para cuando NO hay nada que enseñar.
  if (descuentoVisible(ahoraMs)) return false
  return ahoraMs < Date.parse(BUEN_FIN_INICIO)
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
