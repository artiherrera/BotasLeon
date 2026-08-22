/**
 * Sesión contra Cognito, desde el navegador.
 *
 * Sustituye a lib/supabase/session.ts. El proyecto se movió entero a AWS: la
 * base es una RDS privada y el navegador ya no habla con ella — pasa por API
 * Gateway a una Lambda que verifica este token.
 *
 * Sin amazon-cognito-identity-js ni Amplify: `InitiateAuth` y
 * `RespondToAuthChallenge` son dos POST sin firmar contra el endpoint público de
 * Cognito. Meter el SDK por eso engordaría el bundle de todo el sitio por una
 * sección que usan dos personas.
 *
 * Los tokens viven en localStorage. Un XSS los alcanzaría, y se asume: detrás
 * hay cotizaciones y notas, nunca cobros ni datos de tarjeta. La alternativa
 * (memoria) obligaría a volver a entrar en cada recarga.
 */

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2"
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
const IDP = `https://cognito-idp.${REGION}.amazonaws.com/`

export const authEnabled = (): boolean => !!CLIENT_ID

const STORAGE_KEY = "botasleon:sesion"
/** Margen para renovar antes de que caduque el access token. */
const MARGEN_MS = 60_000

export type Sesion = {
  access_token: string
  refresh_token: string
  expira_en: number
  email: string
}

/** El primer ingreso de un usuario nuevo exige cambiar la contraseña. */
export class CambioDeClaveRequerido extends Error {
  constructor(public readonly session: string, public readonly email: string) {
    super("Tienes que definir una contraseña nueva")
    this.name = "CambioDeClaveRequerido"
  }
}

export class SinSesionError extends Error {
  constructor() {
    super("Tu sesión expiró. Vuelve a entrar.")
    this.name = "SinSesionError"
  }
}

type RespuestaAuth = {
  AuthenticationResult?: {
    AccessToken: string
    RefreshToken?: string
    ExpiresIn: number
  }
  ChallengeName?: string
  Session?: string
  message?: string
  __type?: string
}

async function idp(target: string, body: unknown): Promise<RespuestaAuth> {
  const res = await fetch(IDP, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as RespuestaAuth
  if (!res.ok) {
    // Cognito distingue "usuario no existe" de "contraseña mal", pero decirlo
    // regala información: se responde igual para los dos.
    const tipo = (json.__type || "").split("#").pop()
    throw new Error(
      tipo === "NotAuthorizedException" || tipo === "UserNotFoundException"
        ? "Correo o contraseña incorrectos"
        : json.message || `Cognito ${res.status}`
    )
  }
  return json
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

function guardar(s: Sesion): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* modo privado: la sesión dura lo que dure la pestaña */
  }
}

export function cerrarSesion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nada que limpiar */
  }
}

export const correoActual = (): string | null => cargarSesion()?.email ?? null

function desde(r: RespuestaAuth, email: string, refreshPrevio?: string): Sesion {
  const a = r.AuthenticationResult!
  return {
    access_token: a.AccessToken,
    // Al renovar, Cognito NO devuelve refresh_token: se conserva el anterior o
    // la sesión moriría en la primera renovación.
    refresh_token: a.RefreshToken || refreshPrevio || "",
    expira_en: Date.now() + a.ExpiresIn * 1000,
    email,
  }
}

export async function iniciarSesion(email: string, password: string): Promise<Sesion> {
  if (!authEnabled()) throw new Error("Cognito no está configurado")
  const r = await idp("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  })
  if (r.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    throw new CambioDeClaveRequerido(r.Session!, email)
  }
  if (!r.AuthenticationResult) throw new Error(`Cognito pidió: ${r.ChallengeName}`)
  const s = desde(r, email)
  guardar(s)
  return s
}

/** Segundo paso del primer ingreso: fijar la contraseña definitiva. */
export async function definirClaveNueva(
  email: string,
  session: string,
  passwordNueva: string
): Promise<Sesion> {
  const r = await idp("RespondToAuthChallenge", {
    ChallengeName: "NEW_PASSWORD_REQUIRED",
    ClientId: CLIENT_ID,
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: passwordNueva },
  })
  if (!r.AuthenticationResult) throw new Error("Cognito no devolvió la sesión")
  const s = desde(r, email)
  guardar(s)
  return s
}

/**
 * Token vigente, renovándolo si está por vencer. Devuelve null cuando ya no hay
 * sesión válida: quien llama debe mandar a la pantalla de entrada en vez de
 * disparar una petición que respondería 401 sin explicación.
 */
export async function tokenValido(): Promise<string | null> {
  const s = cargarSesion()
  if (!s) return null
  if (Date.now() < s.expira_en - MARGEN_MS) return s.access_token
  try {
    const r = await idp("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: s.refresh_token },
    })
    const nueva = desde(r, s.email, s.refresh_token)
    guardar(nueva)
    return nueva.access_token
  } catch {
    cerrarSesion()
    return null
  }
}
