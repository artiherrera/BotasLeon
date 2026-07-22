/** Modelo de datos de una cotización de mayoreo generada en el sitio. */

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
  items: QuoteItem[]
}

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
