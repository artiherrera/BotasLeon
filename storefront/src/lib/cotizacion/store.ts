/**
 * Almacenamiento COMPARTIDO de cotizaciones en Supabase (Postgres hospedado).
 *
 * El cotizador es estático/cliente, así que hablamos directo a la REST API de
 * Supabase (PostgREST) con fetch — sin SDK ni servidor propio. La `anon key` es
 * pública (va en el bundle) y la protege el RLS de la tabla; los datos de una
 * cotización (cliente, ítems, precios) no son sensibles y el cotizador ya está
 * tras contraseña.
 *
 * Config (env de Amplify):
 *   NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  = <anon public key>
 *
 * Si faltan, quotesEnabled() = false y la UI de guardado se oculta (el cotizador
 * sigue funcionando como antes).
 */

import { api, apiEnabled } from "@/lib/api/client"
import type { Quote } from "./types"
import { importeTotal, totalPares } from "./types"

export { apiEnabled as quotesEnabled }

export type SavedQuote = {
  id: string
  folio: string
  cliente: string
  atiende: string
  moneda: string
  idioma: string
  total: number
  pares: number
  data: Quote
  updated_at: string
  created_at: string
}

/** Fila para guardar: columnas de resumen + el Quote completo en `data`. */
function rowFrom(quote: Quote) {
  return {
    folio: quote.folio,
    cliente: quote.cliente,
    atiende: quote.atiende,
    moneda: quote.moneda,
    idioma: quote.idioma,
    total: importeTotal(quote.items),
    pares: totalPares(quote.items),
    data: quote,
  }
}

/** Trae las cotizaciones (más recientes primero). El filtro de texto es local. */
export async function listQuotes(): Promise<SavedQuote[]> {
  return api<SavedQuote[]>("/quotes")
}

/** Inserta una cotización nueva y devuelve la fila guardada (con id). */
export async function insertQuote(quote: Quote): Promise<SavedQuote> {
  return api<SavedQuote>("/quotes", { method: "POST", body: rowFrom(quote) })
}

/** Actualiza una cotización existente. */
export async function updateQuote(id: string, quote: Quote): Promise<SavedQuote> {
  return api<SavedQuote>(`/quotes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: rowFrom(quote),
  })
}

/** Elimina una cotización. */
export async function deleteQuote(id: string): Promise<void> {
  await api(`/quotes/${encodeURIComponent(id)}`, { method: "DELETE" })
}
