/**
 * Cliente de la API interna (API Gateway → Lambda → RDS).
 *
 * Antes el navegador hablaba directo con PostgREST y el RLS de Supabase era lo
 * único que lo contenía. Ahora la autorización vive en la Lambda: aquí solo se
 * adjunta el token y se traduce el 401 a algo que la UI sepa manejar.
 */

import { SinSesionError, tokenValido } from "./session"

const BASE = process.env.NEXT_PUBLIC_API_URL

export const apiEnabled = (): boolean => !!BASE

/**
 * `body` va como objeto y se serializa aquí. Hay que EXCLUIR el body de
 * RequestInit antes de intersectar: en una intersección el tipo resultante debe
 * satisfacer los dos lados, así que `RequestInit & { body?: unknown }` seguía
 * exigiendo un BodyInit y rechazaba los objetos planos.
 */
export async function api<T>(
  ruta: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> {
  if (!BASE) throw new Error("La API no está configurada")
  const token = await tokenValido()
  if (!token) throw new SinSesionError()

  const res = await fetch(`${BASE}${ruta}`, {
    method: init?.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  })

  if (res.status === 401) throw new SinSesionError()
  if (res.status === 204) return null as T
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // El mensaje viene del esquema ("la nota ya fue emitida…") y está escrito
    // para que lo entienda el vendedor: se muestra tal cual.
    throw new Error(json?.error || `Error ${res.status}`)
  }
  return json as T
}
