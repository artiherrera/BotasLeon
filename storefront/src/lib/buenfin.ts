import { isMX } from "@/lib/market"

/**
 * EL BUEN FIN 2026 — las fechas, el estado y nada más.
 *
 * La edición 16 va del VIERNES 13 al MARTES 17 de noviembre de 2026: cinco
 * días, y este año de viernes a martes (los anteriores eran de jueves a lunes)
 * porque incluye el feriado del 20 de noviembre recorrido al lunes 16.
 * Confirmado el 2026-11-10 contra la prensa mexicana; la fuente de verdad es
 * elbuenfin.org y si allá cambian algo, aquí van las dos líneas que se tocan.
 *
 * SOLO EN MÉXICO. El Buen Fin es una campaña de CONCANACO con la banca
 * mexicana: en botasleon.com no significa nada y los meses sin intereses son
 * de la banca de aquí, así que el checkout en dólares no los ofrece (ver
 * lib/msi.ts). Para la .com lo que toca es Black Friday, que cae el 27 de
 * noviembre; el día que el dueño lo pida, esto se copia con otra fecha y otro
 * nombre.
 *
 * LAS HORAS SON LAS DE MÉXICO, no las del visitante. Un cronómetro que
 * terminara a la medianoche de cada quien dejaría la promoción viva dos horas
 * más en Tijuana que en León y a alguien pagando sin descuento creyendo que
 * llegó. Se fija el instante en la hora del negocio (−06:00) y ese mismo
 * instante se cuenta en todas partes. Es la misma regla que FIN_PROMOCION en
 * lib/promocion.ts.
 */
export const BUEN_FIN_INICIO = "2026-11-13T00:00:00-06:00"
export const BUEN_FIN_FIN = "2026-11-17T23:59:59-06:00"

const INICIO_MS = Date.parse(BUEN_FIN_INICIO)
const FIN_MS = Date.parse(BUEN_FIN_FIN)

/**
 * El descuento máximo que se anuncia. Es un NÚMERO QUE PROMETE: tiene que
 * existir en Shopify (descuento automático o precio de comparación) antes de
 * que arranque, o el cintillo miente y el carrito lo desmiente.
 */
export const DESCUENTO_MAXIMO = 30

/** La campaña es mexicana: en el despliegue en dólares no se pinta nunca. */
export const HAY_BUEN_FIN = isMX

/**
 * Antes de que empiece se cuenta hacia el arranque; una vez dentro, hacia el
 * cierre. El cambio ocurre solo, sin despliegue, y cuando termina esto
 * devuelve null y el cintillo rojo desaparece — que es la otra mitad del
 * trabajo de una promoción con fecha.
 */
export type FaseBuenFin = "antes" | "durante"

export type CuentaBuenFin = {
  fase: FaseBuenFin
  dias: number
  horas: number
  minutos: number
  segundos: number
}

/**
 * Lo que falta, o null si ya terminó (o si el despliegue no es el mexicano).
 *
 * Recibe el "ahora" en vez de leer el reloj por su cuenta: el sitio es
 * estático y se hornea en el build, así que si esto se evaluara al compilar el
 * cronómetro se quedaría congelado en la hora del build. Lo calcula el
 * navegador, a un tic por segundo.
 */
export function cuentaBuenFin(ahoraMs: number): CuentaBuenFin | null {
  if (!HAY_BUEN_FIN) return null
  if (!Number.isFinite(ahoraMs)) return null

  const fase: FaseBuenFin = ahoraMs < INICIO_MS ? "antes" : "durante"
  const objetivo = fase === "antes" ? INICIO_MS : FIN_MS
  const ms = objetivo - ahoraMs
  if (ms <= 0) return null

  const s = Math.floor(ms / 1000)
  return {
    fase,
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

/**
 * "02 : 14 : 22 : 10" lo arma el componente con casillas; aquí solo se
 * rellenan las cifras a dos dígitos para que el ancho no salte de 9 a 10
 * caracteres a mitad de la cuenta y la barra entera tiemble cada segundo.
 */
export function dosCifras(n: number): string {
  return String(n).padStart(2, "0")
}
