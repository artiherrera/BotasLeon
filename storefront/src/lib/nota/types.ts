/**
 * Nota de venta comercial / factura comercial de exportación.
 *
 * Reutiliza QuoteItem y QuoteLine del cotizador a propósito: los productos, las
 * tallas y los precios son EXACTAMENTE la misma estructura, y duplicarla haría
 * que una cotización aceptada no se pudiera convertir en nota sin remapear a
 * mano. Lo que la nota agrega es el envoltorio: partes con domicilio, régimen
 * aduanal y datos de certificación.
 */

import type {
  Idioma,
  Moneda,
  QuoteItem,
  QuoteLine,
} from "@/lib/cotizacion/types"
import { fmtMoney } from "@/lib/cotizacion/types"

export type { Idioma, Moneda, QuoteLine }
export { fmtMoney }

export type TipoNota = "nacional" | "exportacion"
export type Incoterm = "DDP" | "DAP" | "EXW"
export type EstadoNota =
  | "borrador"
  | "emitida"
  | "pagada"
  | "entregada"
  | "cancelada"

/**
 * Datos aduanales de una partida. Solo se imprimen cuando la nota es de
 * exportación; en una venta nacional sobran y ensucian el documento.
 */
export type Aduana = {
  /**
   * Fracción arancelaria HTSUS. CBP exige DIEZ dígitos desde que terminó la
   * exención de minimis — ocho ya no basta. Ver FRACCIONES en ./config.
   */
  fraccion: string
  /** Código ISO del país de origen. Para estas botas, siempre "MX". */
  paisOrigen: string
  /**
   * Descripción en inglés para la aduana. Tiene que ser CONCRETA
   * ("men's leather cowboy boots"): las descripciones vagas como "footwear",
   * "sample" o "gift" son causa principal de retención en CBP.
   */
  descripcionEn: string
}

export type NotaItem = QuoteItem & { aduana?: Aduana }

export type Nota = {
  folio: string
  /** Texto legible, ej. "21 de agosto de 2026". */
  fecha: string
  tipo: TipoNota
  incoterm: Incoterm

  vendedorNombre: string
  vendedorDomicilio: string

  cliente: string
  compradorDomicilio: string
  contacto: string

  /** Ship-to, cuando difiere del domicilio del comprador. */
  entrega: string
  /** ISO corto (YYYY-MM-DD) para poder ordenar y filtrar sin parsear texto. */
  entregaEstimada: string

  atiende: string
  moneda: Moneda
  idioma: Idioma

  /** Quién firma la declaración de origen. Va con nombre Y cargo. */
  certificaNombre: string
  certificaCargo: string

  /** Condiciones al pie, una por línea. */
  notas: string
  items: NotaItem[]
}

export type FormaPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "deposito"
  | "otro"

export type Pago = {
  id: string
  monto: number
  forma: FormaPago
  referencia: string
  pagadoEn: string
}

// ── Cálculos ────────────────────────────────────────────────────────────────
// Se recalculan siempre desde las líneas en vez de guardar un total editable:
// un importe que alguien puede teclear acaba discrepando de la suma de sus
// partidas, y en un documento que va a aduana eso es una discrepancia declarada.

export function importeLinea(l: QuoteLine): number {
  return (l.cantidad || 0) * (l.precioUnitario || 0)
}

export function importeItem(it: NotaItem): number {
  return it.lines.reduce((s, l) => s + importeLinea(l), 0)
}

export function importeTotal(items: NotaItem[]): number {
  return items.reduce((s, it) => s + importeItem(it), 0)
}

export function totalPares(items: NotaItem[]): number {
  return items.reduce(
    (s, it) => s + it.lines.reduce((n, l) => n + (l.cantidad || 0), 0),
    0
  )
}

export function totalPagado(pagos: Pago[]): number {
  return pagos.reduce((s, p) => s + (p.monto || 0), 0)
}

export function saldo(items: NotaItem[], pagos: Pago[]): number {
  return importeTotal(items) - totalPagado(pagos)
}

/** Una nota emitida ya no se edita: se cancela y se emite otra. */
export function esEditable(estado: EstadoNota): boolean {
  return estado === "borrador"
}
