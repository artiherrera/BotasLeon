import {
  BLACK_FRIDAY_INICIO,
  BLACK_FRIDAY_FIN,
  eventoActual,
  type Evento,
} from "@/lib/ofertas/config"

/**
 * LA TEMPORADA VIVA — fechas, fase y cuenta regresiva.
 *
 * Sustituye a lib/buenfin.ts, que sabía de UNA campaña y se borró con ella.
 * Esto no sabe de ninguna: lee las fechas de lib/ofertas/config.ts, que es
 * donde ya viven, y sirve para la que toque. Cambiar de campaña es cambiar
 * dos fechas allá, no tocar esto.
 *
 * EN LOS DOS MERCADOS. El Buen Fin era de CONCANACO y la banca mexicana, así
 * que su módulo empezaba con `if (!isMX) return null`. Black Friday no: es
 * tan de allá como de aquí —más, de hecho—, y el dueño lo pidió para las dos
 * tiendas (2026-11-18). Por eso aquí no hay ninguna condición de mercado; la
 * decide la tabla TEMPORADAS de config.ts con su bandera `soloMx`, que es el
 * único sitio donde debe vivir esa regla.
 *
 * LAS HORAS SON LAS DE MÉXICO, no las del visitante. Un cronómetro que
 * terminara a la medianoche de cada quien dejaría la promoción viva dos horas
 * más en Tijuana que en León, y a alguien pagando sin descuento creyendo que
 * llegó. Se fija el instante en la hora del negocio (−06:00) y ese mismo
 * instante se cuenta en todas partes. Es la misma regla que FIN_PROMOCION en
 * lib/promocion.ts.
 *
 * Para la .com eso significa que el cierre cae a las 23:59 del Centro, o sea
 * la 1:59 de la madrugada en Nueva York. Es deliberado: un pedido es uno solo
 * y el descuento lo aplica Shopify con el reloj de la tienda, no con el del
 * comprador.
 */

/** La temporada que se está contando, y sus dos extremos. */
const VENTANAS: Partial<Record<Evento, { inicio: number; fin: number }>> = {
  blackfriday: {
    inicio: Date.parse(BLACK_FRIDAY_INICIO),
    fin: Date.parse(BLACK_FRIDAY_FIN),
  },
}

/**
 * Antes de que empiece se cuenta hacia el arranque; una vez dentro, hacia el
 * cierre. El cambio ocurre solo porque lo calcula el navegador.
 *
 * ⚠️ QUE ESTO CAMBIE SOLO NO SIGNIFICA QUE EL SITIO CAMBIE SOLO. El reloj vive
 * en el navegador y por eso no necesita despliegue; los PRECIOS, en cambio, se
 * hornean en el build y Amplify no los regenera (ver la nota larga en
 * lib/ofertas/config.ts). Al cerrar una campaña hay que desplegar, y el
 * cronómetro desapareciendo solo es justo lo que puede dar la falsa impresión
 * de que ya está todo apagado.
 */
export type FaseTemporada = "antes" | "durante"

export type CuentaTemporada = {
  evento: Evento
  fase: FaseTemporada
  dias: number
  horas: number
  minutos: number
  segundos: number
}

/**
 * Lo que falta para la temporada vigente o la que viene, o null si no hay
 * ninguna a la vista.
 *
 * Recibe el "ahora" en vez de leer el reloj por su cuenta: el sitio es
 * estático y se hornea en el build, así que si esto se evaluara al compilar el
 * cronómetro se quedaría congelado en la hora del build. Lo calcula el
 * navegador, a un tic por segundo.
 */
export function cuentaTemporada(ahoraMs: number): CuentaTemporada | null {
  if (!Number.isFinite(ahoraMs)) return null

  for (const [clave, v] of Object.entries(VENTANAS) as [
    Evento,
    { inicio: number; fin: number },
  ][]) {
    // Fuera del mercado donde la campaña aplica, eventoActual() nunca la
    // devuelve: ahí la cuenta no se pinta aunque las fechas estén puestas.
    const vigente = eventoActual(ahoraMs) === clave
    const porVenir = ahoraMs < v.inicio && eventoActual(v.inicio) === clave
    if (!vigente && !porVenir) continue

    const fase: FaseTemporada = ahoraMs < v.inicio ? "antes" : "durante"
    const ms = (fase === "antes" ? v.inicio : v.fin) - ahoraMs
    if (ms <= 0) continue

    const s = Math.floor(ms / 1000)
    return {
      evento: clave,
      fase,
      dias: Math.floor(s / 86400),
      horas: Math.floor((s % 86400) / 3600),
      minutos: Math.floor((s % 3600) / 60),
      segundos: s % 60,
    }
  }
  return null
}

/**
 * "02 : 14 : 22 : 10" lo arma el componente con casillas; aquí solo se
 * rellenan las cifras a dos dígitos para que el ancho no salte de 9 a 10
 * caracteres a mitad de la cuenta y la barra entera tiemble cada segundo.
 */
export function dosCifras(n: number): string {
  return String(n).padStart(2, "0")
}
