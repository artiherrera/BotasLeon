/**
 * Sesión de Supabase Auth para las herramientas internas (cotizador y notas de
 * venta).
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ───────────────────────────
 * Las tablas de `supabase/migrations/` tienen RLS `to authenticated`. La anon
 * key que viaja en el bundle da el rol `anon`, NO `authenticated`: usándola sola,
 * toda lectura devuelve cero filas y toda escritura responde 401. Hace falta un
 * token de usuario real, y eso es lo que produce este módulo.
 *
 * No usamos @supabase/supabase-js: el sitio es estático y solo necesitamos dos
 * llamadas HTTP (login y refresh). Traer el SDK entero para eso engorda el
 * bundle de todo el sitio por una sección que usan dos personas.
 *
 * ADEMÁS DE SEGURIDAD, IDENTIDAD: las tablas traen
 * `vendedor_id uuid default auth.uid()`, así que con sesión real cada documento
 * queda firmado por quien lo hizo sin que nadie teclee su nombre. Con dos
 * vendedores y precios que se arman al momento, eso es justo lo auditable.
 *
 * Los tokens se guardan en localStorage. Es el mismo criterio del SDK oficial y
 * la alternativa (memoria) obligaría a volver a entrar en cada recarga. A cambio,
 * un XSS los alcanzaría — asumible aquí porque detrás no hay más que cotizaciones
 * y notas, nunca cobros ni datos de tarjeta.
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** ¿Hay proyecto configurado? Si no, la UI de guardado se oculta entera. */
export const supabaseEnabled = (): boolean => !!(URL_BASE && ANON_KEY)

const STORAGE_KEY = "botasleon:supabase-session"

/** Margen antes de que expire el token para renovarlo: 60 s. */
const MARGEN_MS = 60_000

export type Sesion = {
  access_token: string
  refresh_token: string
  /** Epoch en ms en que caduca el access_token. */
  expira_en: number
  email: string
  user_id: string
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user?: { id?: string; email?: string }
  error_description?: string
  msg?: string
}

export function cargarSesion(): Sesion | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Sesion) : null
  } catch {
    return null
  }
}

function guardarSesion(s: Sesion): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* modo privado o cuota llena: la sesión dura lo que dure la pestaña */
  }
}

export function cerrarSesion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nada que limpiar */
  }
}

export function correoActual(): string | null {
  return cargarSesion()?.email ?? null
}

function aSesion(t: TokenResponse, emailPrevio?: string): Sesion {
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expira_en: Date.now() + t.expires_in * 1000,
    email: t.user?.email ?? emailPrevio ?? "",
    user_id: t.user?.id ?? "",
  }
}

async function pedirToken(
  grant: "password" | "refresh_token",
  body: Record<string, string>
): Promise<TokenResponse> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=${grant}`, {
    method: "POST",
    headers: { apikey: ANON_KEY as string, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as TokenResponse
  if (!res.ok) {
    // Supabase manda el detalle en error_description o msg según el endpoint.
    throw new Error(
      json.error_description ||
        json.msg ||
        (res.status === 400
          ? "Correo o contraseña incorrectos"
          : `Supabase auth ${res.status}`)
    )
  }
  return json
}

export async function iniciarSesion(
  email: string,
  password: string
): Promise<Sesion> {
  if (!supabaseEnabled()) throw new Error("Base de datos no configurada")
  const s = aSesion(await pedirToken("password", { email, password }), email)
  guardarSesion(s)
  return s
}

/**
 * Token válido para PostgREST, renovándolo si está por vencer. Devuelve null
 * cuando no hay sesión o el refresh ya no sirve: quien llama debe mandar al
 * usuario a la pantalla de entrada en vez de disparar una petición que
 * devolvería 401 sin explicación.
 */
export async function tokenValido(): Promise<string | null> {
  const s = cargarSesion()
  if (!s) return null
  if (Date.now() < s.expira_en - MARGEN_MS) return s.access_token
  try {
    const nueva = aSesion(
      await pedirToken("refresh_token", { refresh_token: s.refresh_token }),
      s.email
    )
    guardarSesion(nueva)
    return nueva.access_token
  } catch {
    // El refresh token caducó o fue revocado: la sesión ya no sirve de nada.
    cerrarSesion()
    return null
  }
}

/** Error que la UI distingue para mandar a la pantalla de entrada. */
export class SinSesionError extends Error {
  constructor() {
    super("Tu sesión expiró. Vuelve a entrar.")
    this.name = "SinSesionError"
  }
}

/**
 * fetch contra PostgREST con el token del usuario. Es el único punto por donde
 * deben pasar las tablas protegidas por RLS.
 */
export async function restAutenticado(
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (!supabaseEnabled()) throw new Error("Base de datos no configurada")
  const token = await tokenValido()
  if (!token) throw new SinSesionError()

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY as string,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (res.status === 401) {
    cerrarSesion()
    throw new SinSesionError()
  }
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => "")}`)
  }
  return res
}

/** Llama a una función SQL (`rpc/...`) con la sesión del usuario. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await restAutenticado(`rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify(args),
  })
  return res.json() as Promise<T>
}
