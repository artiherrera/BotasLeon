/**
 * Promoción de tiempo limitado: 10% de descuento al registrarse.
 *
 * Va en la barra de avisos de los DOS mercados y los dos idiomas — el descuento
 * por registro no depende de la moneda ni del país, a diferencia del envío o de
 * los meses sin intereses.
 *
 * EL FIN ES UN INSTANTE ABSOLUTO, no "el 15 de septiembre" a secas. Un letrero
 * que dice "termina el 15" sin hora deja al cliente adivinando, y peor: si cada
 * mercado interpretara su propia medianoche, la promoción viviría dos horas más
 * en California que en León y habría quien pagara sin descuento creyendo que
 * llegaba a tiempo. Se fija el final del 15 de septiembre en la hora de México,
 * que es el reloj del negocio, y ese mismo instante se cuenta en todas partes.
 */
export const FIN_PROMOCION = "2026-09-15T23:59:59-06:00"

const FIN_MS = Date.parse(FIN_PROMOCION)

/**
 * Lo que falta, en HORAS TOTALES — sin días.
 *
 * `horas` acumula: a dos días y medio del cierre dice 60, no "2d 12h". Lo pidió
 * el dueño y para una promoción corta es la lectura más urgente: "50 horas" se
 * siente cerca y "2 días" se siente lejos, aunque sean lo mismo.
 */
export type Restante = {
  horas: number
  minutos: number
  segundos: number
}

/**
 * Lo que falta, o null si ya terminó.
 *
 * Recibe el "ahora" en vez de leer el reloj por su cuenta para que la barra
 * pueda calcularlo SOLO en el navegador. El sitio es estático: si esto se
 * evaluara al compilar, el contador se quedaría congelado en la hora del build
 * y seguiría anunciando la promoción después de vencida.
 */
export function restante(ahoraMs: number): Restante | null {
  const ms = FIN_MS - ahoraMs
  if (!Number.isFinite(ms) || ms <= 0) return null
  const s = Math.floor(ms / 1000)
  return {
    horas: Math.floor(s / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

/**
 * "50:35:07" — horas:minutos:segundos, sin días.
 *
 * Las horas llevan al menos dos cifras para que el ancho no salte de 9 a 10
 * caracteres a mitad de la cuenta; de las 99 horas no pasa, porque la
 * promoción dura menos que eso.
 */
export function formatoCuentaRegresiva(r: Restante): string {
  const dd = (n: number) => String(n).padStart(2, "0")
  return `${dd(r.horas)}:${dd(r.minutos)}:${dd(r.segundos)}`
}

/**
 * PROMOCIÓN DEL PAR: el segundo, a mitad de precio.
 *
 * El descuento vive en Shopify (automático, "Segundo par de El Elegante al
 * 50%") y se aplica solo en el carrito y el checkout. Comprobado contra la
 * Storefront API el 2026-09-24: funciona con dos botines cualesquiera de la
 * promoción —no tienen que ser el mismo modelo—, y también en el mercado en
 * dólares. Con tres piezas descuenta UNA, no dos.
 *
 * QUIÉN ENTRA LO DECIDE SHOPIFY, NO EL CÓDIGO: los productos con la etiqueta
 * `promo-2do-50` son los que enseñan la insignia en la tarjeta y la línea en
 * la ficha. Así el dueño la empieza y la termina desde el panel —etiquetar y
 * desetiquetar— sin esperar un despliegue. Ojo: la etiqueta solo ANUNCIA; el
 * descuento de verdad es el de Shopify. Si se quita uno y se deja el otro, el
 * sitio miente: hay que mover los dos juntos.
 *
 * EL AVISO DE LA BARRA sí es una constante: la barra se pinta en todas las
 * páginas, también en las que no cargan productos, así que no puede depender
 * de la etiqueta. Para apagarlo, `activa: false` (una línea y un despliegue).
 */
export const ETIQUETA_PROMO_PAR = "promo-2do-50"

/**
 * Los cintos que entran en "cinto a mitad llevando botas".
 *
 * El descuento vive en Shopify (automático, tipo "Compra X y obtén Y": una bota
 * de la colección Botas → un cinto de la colección Cinturones al 50%, máximo
 * uno por pedido). La etiqueta solo ANUNCIA, igual que la del par: si se quita
 * el descuento en Shopify hay que quitar la etiqueta, o el sitio miente.
 */
export const ETIQUETA_PROMO_CINTO = "promo-cinto"

/**
 * LA PROMOCIÓN DEL CINTO: "Tu cinto al 50% con tus botas". VIVA.
 *
 * El 2026-10-14 la di por muerta y la apagué. Me equivoqué: probé con El
 * Elegante, y con esa bota el descuento del cinto NUNCA aparece. El dueño lo
 * corrigió y al medirlo bien salió algo más importante que la promoción.
 *
 * SHOPIFY APLICA UN SOLO DESCUENTO AUTOMÁTICO POR PEDIDO, y se queda con el
 * que más vale. Medido con carritos reales el 2026-10-15:
 *
 *   La Estephania sola ............ −$80            (su "🔥 Hoy te ahorras")
 *   La Estephania + cinto ......... cinto −$499.50, y la bota PIERDE sus $80
 *   El Elegante + cinto ........... bota −$1,190,   y el cinto se queda en $999
 *
 * O sea: las dos promociones se pelean. Como 113 de las 118 botas llevan su
 * propio "🔥 Hoy te ahorras" y en la mayoría vale más de $499.50, el cinto a
 * mitad casi nunca llega a aplicarse aunque esté bien configurado.
 *
 * SE ARREGLA EN SHOPIFY, NO AQUÍ: cada descuento automático tiene su apartado
 * de "Combinaciones". Si los dos se marcan como combinables con descuentos de
 * producto, se suman y la promesa del sitio —cinto a mitad con cualquier
 * bota— se vuelve verdad siempre. Mientras esa casilla no esté marcada, el
 * sitio promete algo que el carrito solo cumple en las botas cuyo descuento
 * propio sea menor que medio cinto.
 */
export const PROMO_CINTO = { activa: true } as const

export const enPromoPar = (p: { tags?: string[] | null } | null | undefined): boolean =>
  (p?.tags ?? []).includes(ETIQUETA_PROMO_PAR)

export const PROMO_PAR = {
  /**
   * APAGADA el 2026-10-13: el dueño la dio por terminada.
   *
   * Lo que la apaga de verdad son DOS cosas, y las dos ya están: la etiqueta
   * `promo-2do-50` desapareció de los 118 productos (medido ese día contra la
   * Storefront API) y el descuento automático de Shopify se retiró. Esta
   * bandera es la tercera pata, la única que no depende del panel: la barra de
   * avisos se pinta en TODAS las páginas, también en las que no cargan
   * productos, así que no puede leer etiquetas. Mientras estuvo en `true` sin
   * respaldo, botasleon.com anunciaba "Second ankle boot, half price" en lo
   * alto de cada página de una promoción que ya no existía — con la pauta
   * corriendo.
   *
   * Para revivirla: `true` aquí, la etiqueta en los productos y el descuento
   * en Shopify. Las tres, o el sitio miente.
   */
  activa: false,
  /**
   * A dónde lleva el aviso. La marca El Malcreado son exactamente los tres
   * botines de la promoción, así que sirve de página de la promo sin inventar
   * una: quien llega por el negro ve ahí el café y el miel, que es lo que
   * hace falta para armar el par.
   *
   * NO es "combos": un combo es llevar cosas distintas juntas —bota y cinto—,
   * y esto es el segundo par del mismo tipo a mitad. Lo corrigió el dueño el
   * 2026-09-24, después de que yo lo hubiera bautizado mal.
   */
  href: "/marcas/el-malcreado",
} as const
