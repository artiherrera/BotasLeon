import { readFileSync } from "node:fs"
import { join } from "node:path"
import { descuentoVisible } from "./config"

/**
 * LA ÚNICA FUENTE DE PRECIOS CON DESCUENTO DEL SITIO.
 *
 * Lee /public/descuentos.json, que escribe `scripts/generate-descuentos.mjs`
 * en el prebuild metiendo cada bota a un carrito de Shopify y anotando lo que
 * la caja dice que cuesta. Aquí NO se calcula ningún descuento: si no está en
 * ese archivo, la bota sale a precio de lista.
 *
 * SOLO SERVIDOR. Usa `fs`, así que no puede importarse desde un componente de
 * cliente. No hace falta: la oferta viaja pegada al producto, y la tarjeta y
 * la ficha la reciben ya resuelta en sus props. Así el HTML sale del horno con
 * el precio bueno y el cliente nunca ve el precio de lista parpadear y
 * corregirse.
 *
 * SE LEE UNA VEZ POR PROCESO. El archivo se escribe antes de compilar y no
 * cambia mientras el sitio está en pie; releerlo en cada página sería un
 * acceso a disco por tarjeta.
 *
 * LÍMITE CONOCIDO, HEREDADO DEL SCRIPT: la foto se toma al compilar. Un
 * descuento nuevo en Shopify no se ve hasta el siguiente despliegue, y los
 * despliegues los disparan los cambios de PRODUCTO, no los de descuento. Si
 * cambias una promoción y quieres que se note hoy, hay que redesplegar.
 */

export type Oferta = {
  /** Precio de lista: el que enseñaba el sitio antes de todo esto. */
  lista: number
  /** Lo que cobra la caja por una, sola en el carrito. */
  paga: number
  /** Lo que se ahorra, en dinero. Es el número que el cliente entiende. */
  ahorro: number
  /** El porcentaje ya redondeado, para la insignia. */
  pct: number
  moneda: string
}

type Registro = {
  lista: number
  paga: number
  moneda: string
  pct?: number
  precios?: { lista: number; paga: number }[]
}

type Archivo = {
  generado: string | null
  mercado?: string
  productos: Record<string, Registro>
}

function leer(): Archivo {
  try {
    const ruta = join(process.cwd(), "public", "descuentos.json")
    return JSON.parse(readFileSync(ruta, "utf8")) as Archivo
  } catch {
    // Sin archivo —primer arranque en local, o un prebuild que falló— el sitio
    // entero sale a precio de lista. Es exactamente como estaba antes.
    return { generado: null, productos: {} }
  }
}

const ARCHIVO: Archivo = leer()

/** Cuándo se tomó la foto de precios, para poder decirlo en la página. */
export const GENERADO: string | null = ARCHIVO.generado

function aOferta(r: Registro | undefined): Oferta | null {
  if (!r) return null
  const ahorro = r.lista - r.paga
  // Cinturón y tirantes: el script ya descarta lo imposible, pero este archivo
  // es un dato de entrada y un precio en cero no puede llegar nunca a la vista.
  if (!(r.paga > 0) || !(ahorro > 0.5)) return null
  return {
    lista: r.lista,
    paga: r.paga,
    ahorro: Number(ahorro.toFixed(2)),
    pct: r.pct ?? Math.round((ahorro / r.lista) * 100),
    moneda: r.moneda,
  }
}

/**
 * La oferta de una bota, o null si no tiene —o si el interruptor está
 * apagado, que es lo mismo para todo lo que haya río abajo.
 */
export function ofertaDe(handle: string, ahoraMs: number = Date.now()): Oferta | null {
  if (!descuentoVisible(ahoraMs)) return null
  return aOferta(ARCHIVO.productos[handle])
}

/**
 * El mayor descuento vivo, para el "hasta X%" del cintillo y de la portada.
 *
 * SALE DE LOS MISMOS DATOS QUE LOS PRECIOS, y por eso no puede mentir: si el
 * 30% desaparece de Shopify, este número baja solo en el siguiente despliegue.
 * Un número escrito a mano en el cintillo es una promesa que el catálogo
 * tarde o temprano deja de cumplir.
 */
export function descuentoMaximo(ahoraMs: number = Date.now()): number {
  if (!descuentoVisible(ahoraMs)) return 0
  let max = 0
  for (const handle of Object.keys(ARCHIVO.productos)) {
    const o = aOferta(ARCHIVO.productos[handle])
    if (o && o.pct > max) max = o.pct
  }
  return max
}

/** Cuántas botas traen oferta hoy. Para la página de temporada. */
export function cuantasConOferta(ahoraMs: number = Date.now()): number {
  if (!descuentoVisible(ahoraMs)) return 0
  return Object.keys(ARCHIVO.productos).filter((h) => aOferta(ARCHIVO.productos[h])).length
}
