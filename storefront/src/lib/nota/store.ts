/**
 * Persistencia de notas de venta contra la API interna.
 *
 * Cada llamada lleva el token de Cognito; la Lambda lo verifica antes de tocar
 * la base. `estado` y `folio` NO se mandan nunca: el folio lo genera Postgres y
 * el estado solo se mueve por rutas explícitas (emitir, cancelar).
 */

import { api, apiEnabled } from "@/lib/api/client"
import type { EstadoNota, FormaPago, Nota, Pago } from "./types"
import { importeTotal, totalPares } from "./types"

export { apiEnabled as notasEnabled }

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
  return api<NotaGuardada[]>("/notas")
}

export async function insertNota(nota: Nota): Promise<NotaGuardada> {
  return api<NotaGuardada>("/notas", { method: "POST", body: filaDe(nota) })
}

/**
 * Solo tiene efecto en borrador: un trigger de la base rechaza cambiar importes
 * o contenido de una nota ya emitida. El error sube tal cual para que la UI
 * muestre el motivo real en vez de fallar en silencio.
 */
export async function updateNota(id: string, nota: Nota): Promise<NotaGuardada> {
  return api<NotaGuardada>(`/notas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: filaDe(nota),
  })
}

/** Congela la nota y devuelve su folio. A partir de aquí ya no se edita. */
export async function emitirNota(id: string): Promise<string> {
  const r = await api<{ folio: string }>(`/notas/${encodeURIComponent(id)}/emitir`, {
    method: "POST",
  })
  return r.folio
}

/**
 * Cancelar en vez de borrar: una nota emitida es el registro de que se cobró
 * dinero, y un hueco en el consecutivo no hay cómo explicarlo después.
 */
export async function cancelarNota(id: string, motivo: string): Promise<void> {
  await api(`/notas/${encodeURIComponent(id)}/cancelar`, {
    method: "POST",
    body: { motivo },
  })
}

export async function cambiarEstado(id: string, estado: EstadoNota): Promise<void> {
  await api(`/notas/${encodeURIComponent(id)}/estado`, {
    method: "POST",
    body: { estado },
  })
}

/** Un borrador sí se puede borrar: todavía no es registro de nada. */
export async function borrarBorrador(id: string): Promise<void> {
  await api(`/notas/${encodeURIComponent(id)}`, { method: "DELETE" })
}

// ── Pagos ───────────────────────────────────────────────────────────────────

/** Postgres devuelve `numeric` como cadena: se convierte aquí, no en la UI. */
export async function listPagos(notaId: string): Promise<Pago[]> {
  const filas = await api<Array<{
    id: string
    monto: string
    forma: FormaPago
    referencia: string
    pagado_en: string
  }>>(`/notas/${encodeURIComponent(notaId)}/pagos`)
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
 * movimiento nuevo, no reescribiendo el anterior — la API ni siquiera expone
 * ruta de edición ni de borrado.
 */
export async function registrarPago(
  notaId: string,
  monto: number,
  forma: FormaPago,
  referencia = ""
): Promise<void> {
  await api(`/notas/${encodeURIComponent(notaId)}/pagos`, {
    method: "POST",
    body: { monto, forma, referencia },
  })
}

/** Saldo calculado por una vista en la base, no por una columna desincronizada. */
export async function saldoDe(
  notaId: string
): Promise<{ total: number; pagado: number; saldo: number } | null> {
  const r = await api<{ total: string; pagado: string; saldo: string } | null>(
    `/notas/${encodeURIComponent(notaId)}/saldo`
  )
  if (!r) return null
  return { total: Number(r.total), pagado: Number(r.pagado), saldo: Number(r.saldo) }
}
