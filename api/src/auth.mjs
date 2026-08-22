/**
 * Verificación del token de Cognito.
 *
 * Sin librerías: Node trae lo necesario para verificar RS256 (`crypto` sabe
 * importar un JWK desde Node 18). Meter jose o aws-jwt-verify por tres
 * operaciones engordaría el paquete y añadiría una dependencia que mantener.
 *
 * ESTO ES LA AUTORIZACIÓN COMPLETA. Al quitar el RLS de Supabase, lo único que
 * separa a un desconocido de las cotizaciones y las notas es esta función. Por
 * eso valida firma, emisor, audiencia, uso y expiración — no solo la firma.
 */
import { createPublicKey, createVerify } from "node:crypto"

const REGION = process.env.AWS_REGION
const POOL_ID = process.env.COGNITO_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID
const ISS = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`

let jwksCache = null

async function jwks() {
  if (jwksCache) return jwksCache
  const res = await fetch(`${ISS}/.well-known/jwks.json`)
  if (!res.ok) throw new Error(`JWKS ${res.status}`)
  jwksCache = (await res.json()).keys
  return jwksCache
}

const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64")

export class NoAutorizado extends Error {
  constructor(motivo) {
    super(motivo)
    this.name = "NoAutorizado"
  }
}

/**
 * Devuelve los claims del token o lanza NoAutorizado.
 * @param {string} header valor crudo de la cabecera Authorization
 */
export async function verificarToken(header) {
  const token = (header || "").replace(/^Bearer\s+/i, "").trim()
  if (!token) throw new NoAutorizado("Falta el token")

  const [h64, p64, s64] = token.split(".")
  if (!h64 || !p64 || !s64) throw new NoAutorizado("Token mal formado")

  const head = JSON.parse(b64u(h64).toString())
  const claims = JSON.parse(b64u(p64).toString())

  let keys = await jwks()
  let jwk = keys.find((k) => k.kid === head.kid)
  if (!jwk) {
    // Cognito rota llaves: si el kid no está, se relee el JWKS una vez antes de
    // rechazar. Sin esto, una rotación tumbaría la app hasta el próximo
    // arranque en frío.
    jwksCache = null
    keys = await jwks()
    jwk = keys.find((k) => k.kid === head.kid)
  }
  if (!jwk) throw new NoAutorizado("Llave desconocida")

  const ok = createVerify("RSA-SHA256")
    .update(`${h64}.${p64}`)
    .verify(createPublicKey({ key: jwk, format: "jwk" }), b64u(s64))
  if (!ok) throw new NoAutorizado("Firma inválida")

  if (claims.iss !== ISS) throw new NoAutorizado("Emisor incorrecto")
  if (claims.token_use !== "access") throw new NoAutorizado("Se requiere access token")
  // El access token de Cognito trae client_id; el id token trae aud. Se exige
  // el access token, así que se compara contra client_id.
  if (claims.client_id !== CLIENT_ID) throw new NoAutorizado("Cliente incorrecto")
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now())
    throw new NoAutorizado("Token expirado")

  return claims
}
