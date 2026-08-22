/**
 * Persistencia de notas de venta contra PostgREST.
 *
 * Todo pasa por `restAutenticado` (lib/supabase/session.ts): las tablas tienen
 * RLS `to authenticated`, así que sin sesión real no se lee ni se escribe nada.
 */

import { restAutenticado, rpc, supabaseEnabled } from "@/lib/supabase/session"
import type { EstadoNota, FormaPago, Nota, Pago } from "./types"
import { importeTotal, totalPares } from "./types"

export { supabaseEnabled as notasEnabled }

export type NotaGuardada = {
  id: string
  folio: string
  estado: EstadoNota
  tipo: string
  incoterm: string
  cliente: string
  atiende: string
  moneda: string
  total: number
  pares: number
  entrega_estimada: string | null
  emitida_en: string | null
  data: Nota
  created_at: string
  updated_at: string
}

/**
 * Columnas de resumen + el documento completo en `data`.
 *
 * `total` y `pares` se derivan de las líneas, nunca se teclean: un total
 * editable acaba discrepando de la suma de sus partidas, y en un documento que
 * va a aduana esa discrepancia es un problema declarado.
 *
 * `folio` NO se manda: lo genera la base con next_folio_serie('NV'). Dos
 * vendedores capturando el mismo día se pisarían el consecutivo.
 */
function filaDe(nota: Nota) {
  return {
    tipo: nota.tipo,
    incoterm: nota.incoterm,
    cliente: nota.cliente,
    comprador_domicilio: nota.compradorDomicilio,
    contacto: nota.contacto,
    vendedor_nombre: nota.vendedorNombre,
    vendedor_domicilio: nota.vendedorDomicilio,
    entrega: nota.entrega,
    entrega_estimada: nota.entregaEstimada || null,
    atiende: nota.atiende,
    moneda: nota.moneda,
    idioma: nota.idioma,
    certifica_nombre: nota.certificaNombre,
    certifica_cargo: nota.certificaCargo,
    total: importeTotal(nota.items),
    pares: totalPares(nota.items),
    data: nota,
  }
}

export async function listNotas(): Promise<NotaGuardada[]> {
  const res = await restAutenticado(
    "sales_notes?select=*&order=updated_at.desc&limit=300"
  )
  return res.json()
}

export async function insertNota(nota: Nota): Promise<NotaGuardada> {
  const res = await restAutenticado("sales_notes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(filaDe(nota)),
  })
  const [row] = await res.json()
  return row
}

/**
 * Solo tiene efecto en borrador: un trigger de la base rechaza cambiar importes
 * o contenido de una nota ya emitida. Se deja que el error suba tal cual para
 * que la UI muestre el motivo real en vez de fallar en silencio.
 */
export async function updateNota(id: string, nota: Nota): Promise<NotaGuardada> {
  const res = await restAutenticado(`sales_notes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(filaDe(nota)),
  })
  const [row] = await res.json()
  return row
}

/** Congela la nota y devuelve su folio. A partir de aquí ya no se edita. */
export async function emitirNota(id: string): Promise<string> {
  return rpc<string>("emitir_nota", { p_id: id })
}

/**
 * Cancelar en vez de borrar: una nota emitida es el registro de que se cobró
 * dinero, y un hueco en el consecutivo no hay cómo explicarlo después.
 */
export async function cancelarNota(id: string, motivo: string): Promise<void> {
  await restAutenticado(`sales_notes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ estado: "cancelada", motivo_cancelacion: motivo }),
  })
}

export async function cambiarEstado(id: string, estado: EstadoNota): Promise<void> {
  await restAutenticado(`sales_notes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  })
}

/** Un borrador sí se puede borrar: todavía no es registro de nada. */
export async function borrarBorrador(id: string): Promise<void> {
  await restAutenticado(
    `sales_notes?id=eq.${encodeURIComponent(id)}&estado=eq.borrador`,
    { method: "DELETE" }
  )
}

// ── Pagos ───────────────────────────────────────────────────────────────────

export async function listPagos(notaId: string): Promise<Pago[]> {
  const res = await restAutenticado(
    `sale_payments?nota_id=eq.${encodeURIComponent(notaId)}&select=*&order=pagado_en.asc`
  )
  const filas: Array<{
    id: string
    monto: string | number
    forma: FormaPago
    referencia: string
    pagado_en: string
  }> = await res.json()
  return filas.map((f) => ({
    id: f.id,
    monto: Number(f.monto),
    forma: f.forma,
    referencia: f.referencia,
    pagadoEn: f.pagado_en,
  }))
}

/**
 * Los pagos solo se insertan. Un cobro mal capturado se corrige con un
 * movimiento nuevo, no reescribiendo el anterior — el RLS ni siquiera permite
 * UPDATE ni DELETE sobre esta tabla.
 */
export async function registrarPago(
  notaId: string,
  monto: number,
  forma: FormaPago,
  referencia = ""
): Promise<void> {
  await restAutenticado("sale_payments", {
    method: "POST",
    body: JSON.stringify({ nota_id: notaId, monto, forma, referencia }),
  })
}

/** Saldo calculado por la vista, no por una columna que se desincroniza. */
export async function saldoDe(
  notaId: string
): Promise<{ total: number; pagado: number; saldo: number } | null> {
  const res = await restAutenticado(
    `sales_notes_saldo?id=eq.${encodeURIComponent(notaId)}&select=total,pagado,saldo`
  )
  const [row] = await res.json()
  if (!row) return null
  return {
    total: Number(row.total),
    pagado: Number(row.pagado),
    saldo: Number(row.saldo),
  }
}
