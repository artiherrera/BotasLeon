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
 * Ventana opcional del interruptor. Con las dos en null, manda solo el
 * booleano de arriba. Con fechas, el descuento se ve únicamente dentro del
 * rango y el sitio vuelve solo a precio de lista al terminar — sin despliegue.
 *
 * En hora de México, como el resto del sitio: una promoción que terminara a la
 * medianoche de cada quien seguiría viva dos horas más en Tijuana que en León.
 */
export const INICIO_DESCUENTO: string | null = null
export const FIN_DESCUENTO: string | null = null

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
  return `ofertas.nombre.${evento}`
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
