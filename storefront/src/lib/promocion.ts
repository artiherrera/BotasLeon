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

export type Restante = {
  dias: number
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
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

/** "2d 08:41:07" mientras quedan días; "08:41:07" el último día. */
export function formatoCuentaRegresiva(r: Restante): string {
  const dd = (n: number) => String(n).padStart(2, "0")
  const reloj = `${dd(r.horas)}:${dd(r.minutos)}:${dd(r.segundos)}`
  return r.dias > 0 ? `${r.dias}d ${reloj}` : reloj
}
