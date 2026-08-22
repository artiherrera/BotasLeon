/**
 * Conexión a Postgres desde la Lambda.
 *
 * La credencial NO vive en una variable de entorno ni en el repo: RDS la
 * administra en Secrets Manager (--manage-master-user-password) y aquí se lee
 * una sola vez por contenedor. Rotarla no obliga a redesplegar.
 *
 * El pool se guarda fuera del handler a propósito: Lambda reutiliza el
 * contenedor entre invocaciones, así que abrir una conexión por petición
 * agotaría los ~85 slots de una db.t4g.micro en cuanto hubiera concurrencia.
 */
import pg from "pg"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

let pool = null

async function credenciales() {
  const sm = new SecretsManagerClient({})
  const res = await sm.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
  )
  const { username, password } = JSON.parse(res.SecretString)
  return { username, password }
}

export async function getPool() {
  if (pool) return pool
  const { username, password } = await credenciales()
  pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: username,
    password,
    // RDS presenta un certificado de su propia CA. Verificarlo del todo
    // obligaría a empaquetar el bundle de CAs de Amazon; el tráfico va cifrado
    // y no sale de la VPC.
    ssl: { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  })
  return pool
}

export async function q(text, params = []) {
  const p = await getPool()
  const res = await p.query(text, params)
  return res.rows
}

/** Una sola fila, o null. Evita repetir `rows[0] ?? null` en cada ruta. */
export async function q1(text, params = []) {
  const rows = await q(text, params)
  return rows[0] ?? null
}
