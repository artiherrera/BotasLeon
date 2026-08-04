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

import type { Quote } from "./types"
import { importeTotal, totalPares } from "./types"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const quotesEnabled = (): boolean => !!(URL && KEY)

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

async function rest(path: string, init?: RequestInit): Promise<Response> {
  if (!quotesEnabled()) throw new Error("Base de datos de cotizaciones no configurada")
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY as string,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => "")}`)
  return res
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
  const res = await rest("quotes?select=*&order=updated_at.desc&limit=300")
  return res.json()
}

/** Inserta una cotización nueva y devuelve la fila guardada (con id). */
export async function insertQuote(quote: Quote): Promise<SavedQuote> {
  const res = await rest("quotes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rowFrom(quote)),
  })
  const [row] = await res.json()
  return row
}

/** Actualiza una cotización existente. */
export async function updateQuote(id: string, quote: Quote): Promise<SavedQuote> {
  const res = await rest(`quotes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...rowFrom(quote), updated_at: new Date().toISOString() }),
  })
  const [row] = await res.json()
  return row
}

/** Elimina una cotización. */
export async function deleteQuote(id: string): Promise<void> {
  await rest(`quotes?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" })
}
