/** Modelo de datos de una cotización de mayoreo generada en el sitio. */

import { mxToUs } from "@/lib/sizes"

export type Moneda = "MXN" | "USD"
export type Idioma = "es" | "en"

export type QuoteLine = {
  id: string
  talla: string // "26", "26½", "23"
  cantidad: number
  precioUnitario: number
}

export type QuoteItem = {
  id: string
  productHandle: string
  title: string // editable
  descripcion: string // editable (piel, horma, suela…)
  sexo: string // "Hombre" | "Mujer" | "Unisex" | ""
  imageUrl: string | null
  lines: QuoteLine[]
}

export type Quote = {
  folio: string
  fecha: string // texto legible, ej. "22 de julio de 2026"
  vigencia: string
  cliente: string
  atiende: string
  contacto: string
  moneda: Moneda // MXN o USD — elegible por cotización
  idioma: Idioma // es o en — idioma del PDF
  notas: string // condiciones editables (una por línea) que salen al pie del PDF
  items: QuoteItem[]
}

/** Formatea un importe en la moneda de la cotización. */
export function fmtMoney(n: number, moneda: Moneda): string {
  return new Intl.NumberFormat(moneda === "USD" ? "en-US" : "es-MX", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
}

/** Sexo (etiqueta del cotizador) → talla US, o null si no aplica. */
export function usFromSexo(talla: string, sexo: string): string | null {
  const gender =
    sexo === "Hombre" ? "masculino" : sexo === "Mujer" ? "femenino" : null
  return mxToUs(talla, gender)
}

/** Talla mostrando SIEMPRE ambas escalas: "26 · US 9" (o solo MX si no hay US). */
export function bothSizes(talla: string, sexo: string): string {
  const t = (talla || "").trim()
  if (!t) return ""
  const us = usFromSexo(t, sexo)
  return us ? `${t} · US ${us}` : t
}

/** Notas/condiciones por defecto (editables). Por idioma; sin moneda fija (la
 * moneda ya sale en el TOTAL). */
export const DEFAULT_NOTAS_ES = [
  "Cotización sujeta a disponibilidad de inventario y tallas.",
  "Los precios no incluyen gastos de envío. Tiempos de entrega a confirmar según volumen.",
  "Los impuestos, aranceles y gastos de importación que se generen en aduana corren por cuenta del cliente.",
].join("\n")
export const DEFAULT_NOTAS_EN = [
  "Quote subject to inventory and size availability.",
  "Prices do not include shipping. Delivery times to be confirmed based on volume.",
  "Any import duties, tariffs and customs charges are the sole responsibility of the client.",
].join("\n")
export const defaultNotas = (idioma: Idioma): string =>
  idioma === "en" ? DEFAULT_NOTAS_EN : DEFAULT_NOTAS_ES
/** Compat: default en español. */
export const DEFAULT_NOTAS = DEFAULT_NOTAS_ES

/** Total de pares (suma de cantidades). */
export function totalPares(items: QuoteItem[]): number {
  return items.reduce(
    (acc, it) => acc + it.lines.reduce((a, l) => a + (l.cantidad || 0), 0),
    0
  )
}

/** Importe total en MXN (suma de cantidad × precio unitario). */
export function importeTotal(items: QuoteItem[]): number {
  return items.reduce(
    (acc, it) =>
      acc + it.lines.reduce((a, l) => a + (l.cantidad || 0) * (l.precioUnitario || 0), 0),
    0
  )
}
