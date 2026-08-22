/**
 * API interna de BotasLeón: cotizaciones, notas de venta y pagos.
 *
 * Una sola Lambda detrás de una Function URL. No hay API Gateway porque no hace
 * falta nada de lo que aporta (planes de uso, autorizadores, etapas) y la
 * Function URL no cobra por petición.
 *
 * La función vive DENTRO de la VPC para poder hablar con la RDS privada. Eso le
 * quita la salida a internet, cosa que aquí no estorba: solo necesita Postgres,
 * Secrets Manager y el JWKS de Cognito, y los dos últimos se alcanzan por
 * endpoints públicos de AWS a los que la subred sí llega.
 */
import { readdir, readFile } from "node:fs/promises"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { q, q1, getPool } from "./db.mjs"
import { verificarToken, NoAutorizado } from "./auth.mjs"

const MIGRACIONES = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations")

const json = (code, body) => ({
  statusCode: code,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
})

/**
 * Correo real del usuario.
 *
 * El ACCESS token no lo trae: en un pool con el correo como alias, su claim
 * `username` es el propio sub, así que usarlo dejaba un UUID como nombre del
 * vendedor impreso en cada documento. El correo vive en el id token o en
 * Cognito; se consulta aquí una sola vez, al dar de alta la fila.
 */
async function correoDe(sub) {
  try {
    const cli = new CognitoIdentityProviderClient({})
    const res = await cli.send(
      new AdminGetUserCommand({ UserPoolId: process.env.COGNITO_POOL_ID, Username: sub })
    )
    const attr = (res.UserAttributes || []).find((a) => a.Name === "email")
    return attr?.Value || ""
  } catch (e) {
    // Que no se pueda leer el correo no debe impedir trabajar: la fila se crea
    // igual y el nombre se puede corregir después.
    console.warn("No se pudo leer el correo en Cognito:", e.message)
    return ""
  }
}

/**
 * Alta implícita del vendedor a partir del token. Evita mantener a mano un
 * espejo de Cognito: la primera vez que alguien entra, se crea su fila.
 */
async function vendedorDe(claims) {
  const sub = claims.sub
  const existente = await q1("select * from vendedores where cognito_sub = $1", [sub])
  if (existente) return existente
  const email = await correoDe(sub)
  return q1(
    `insert into vendedores (cognito_sub, email, nombre) values ($1, $2, $3)
     on conflict (cognito_sub) do update set email = excluded.email
     returning *`,
    [sub, email, email ? email.split("@")[0] : "Sin nombre"]
  )
}

/**
 * Aplica las migraciones pendientes. Idempotente y con registro: reejecutarla
 * no reaplica lo ya corrido, y el orden lo fija el nombre del archivo.
 */
async function migrar() {
  await q(`create table if not exists schema_migrations (
             nombre text primary key, aplicada_en timestamptz not null default now())`)
  const aplicadas = new Set((await q("select nombre from schema_migrations")).map((r) => r.nombre))
  const archivos = (await readdir(MIGRACIONES)).filter((f) => f.endsWith(".sql")).sort()
  const corridas = []
  const pool = await getPool()
  for (const f of archivos) {
    if (aplicadas.has(f)) continue
    const sql = await readFile(join(MIGRACIONES, f), "utf8")
    const cli = await pool.connect()
    try {
      // Cada migración en su transacción: si una falla, no deja el esquema a
      // medias ni se marca como aplicada.
      await cli.query("begin")
      await cli.query(sql)
      await cli.query("insert into schema_migrations (nombre) values ($1)", [f])
      await cli.query("commit")
      corridas.push(f)
    } catch (e) {
      await cli.query("rollback")
      throw new Error(`Migración ${f}: ${e.message}`)
    } finally {
      cli.release()
    }
  }
  return { aplicadas: corridas, yaEstaban: archivos.filter((f) => aplicadas.has(f)) }
}

// ── Rutas ───────────────────────────────────────────────────────────────────
// Las escrituras de cotizaciones y notas NO reciben `folio` del cliente: lo
// pone el default de la base. Tampoco reciben `estado`: se mueve por rutas
// explícitas (emitir, cancelar), nunca por un PATCH suelto.

const CAMPOS_NOTA = [
  "tipo", "incoterm", "cliente", "comprador_domicilio", "contacto",
  "vendedor_nombre", "vendedor_domicilio", "entrega", "entrega_estimada",
  "atiende", "moneda", "idioma", "certifica_nombre", "certifica_cargo",
  "total", "pares", "data",
]

const CAMPOS_QUOTE = [
  "cliente", "atiende", "moneda", "idioma", "total", "pares", "vigencia_hasta", "data",
]

function insert(tabla, campos, body, vendedorId) {
  const cols = campos.filter((c) => body[c] !== undefined)
  const vals = cols.map((c) => body[c])
  cols.push("vendedor_id")
  vals.push(vendedorId)
  const marcas = cols.map((_, i) => `$${i + 1}`).join(",")
  return [`insert into ${tabla} (${cols.join(",")}) values (${marcas}) returning *`, vals]
}

function update(tabla, campos, id, body) {
  const cols = campos.filter((c) => body[c] !== undefined)
  const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(",")
  return [`update ${tabla} set ${sets} where id = $1 returning *`, [id, ...cols.map((c) => body[c])]]
}

async function router(metodo, ruta, body, vendedor) {
  const p = ruta.split("/").filter(Boolean)

  if (metodo === "GET" && p[0] === "yo") return json(200, vendedor)

  // ── Cotizaciones ──
  if (p[0] === "quotes") {
    if (metodo === "GET" && !p[1])
      return json(200, await q("select * from quotes order by updated_at desc limit 300"))
    if (metodo === "POST" && !p[1])
      return json(201, await q1(...insert("quotes", CAMPOS_QUOTE, body, vendedor.id)))
    if (metodo === "PATCH" && p[1])
      return json(200, await q1(...update("quotes", CAMPOS_QUOTE, p[1], body)))
    if (metodo === "POST" && p[1] && p[2] === "emitir")
      return json(200, { version: (await q1("select emitir_quote($1,$2) as v", [p[1], vendedor.id])).v })
    if (metodo === "DELETE" && p[1]) {
      await q("delete from quotes where id = $1", [p[1]])
      return json(204, null)
    }
  }

  // ── Notas de venta ──
  if (p[0] === "notas") {
    if (metodo === "GET" && !p[1])
      return json(200, await q("select * from sales_notes order by updated_at desc limit 300"))
    if (metodo === "POST" && !p[1])
      return json(201, await q1(...insert("sales_notes", CAMPOS_NOTA, body, vendedor.id)))
    if (metodo === "PATCH" && p[1] && !p[2])
      return json(200, await q1(...update("sales_notes", CAMPOS_NOTA, p[1], body)))
    if (metodo === "POST" && p[1] && p[2] === "emitir")
      return json(200, { folio: (await q1("select emitir_nota($1) as f", [p[1]])).f })
    if (metodo === "POST" && p[1] && p[2] === "cancelar")
      return json(200, await q1(
        "update sales_notes set estado='cancelada', motivo_cancelacion=$2 where id=$1 returning *",
        [p[1], body?.motivo ?? ""]))
    if (metodo === "POST" && p[1] && p[2] === "estado")
      return json(200, await q1(
        "update sales_notes set estado=$2 where id=$1 returning *", [p[1], body?.estado]))
    // Un borrador sí se borra; una nota emitida se cancela, nunca desaparece.
    if (metodo === "DELETE" && p[1]) {
      await q("delete from sales_notes where id=$1 and estado='borrador'", [p[1]])
      return json(204, null)
    }
    if (metodo === "GET" && p[1] && p[2] === "saldo")
      return json(200, await q1("select total,pagado,saldo from sales_notes_saldo where id=$1", [p[1]]))
    if (metodo === "GET" && p[1] && p[2] === "pagos")
      return json(200, await q("select * from sale_payments where nota_id=$1 order by pagado_en", [p[1]]))
    // Solo alta de pagos: un cobro mal capturado se corrige con otro
    // movimiento, no reescribiendo el anterior.
    if (metodo === "POST" && p[1] && p[2] === "pagos")
      return json(201, await q1(
        `insert into sale_payments (nota_id, monto, forma, referencia, registro_por)
         values ($1,$2,$3,$4,$5) returning *`,
        [p[1], body?.monto, body?.forma ?? "efectivo", body?.referencia ?? "", vendedor.id]))
  }

  return json(404, { error: `Sin ruta para ${metodo} /${p.join("/")}` })
}

export async function handler(evt) {
  const metodo = evt.requestContext?.http?.method ?? "GET"
  const ruta = evt.rawPath ?? "/"
  if (metodo === "OPTIONS") return { statusCode: 204 }

  try {
    const claims = await verificarToken(evt.headers?.authorization ?? evt.headers?.Authorization)

    // /migrate va ANTES de buscar al vendedor: en una base recién creada la
    // tabla `vendedores` todavía no existe, y buscarlo primero hacía que la
    // única ruta capaz de crearla fallara por su ausencia.
    if (metodo === "POST" && ruta.replace(/\/+$/, "") === "/migrate") {
      return json(200, await migrar())
    }

    const vendedor = await vendedorDe(claims)
    if (!vendedor?.activo) return json(403, { error: "Usuario desactivado" })

    const body = evt.body
      ? JSON.parse(evt.isBase64Encoded ? Buffer.from(evt.body, "base64").toString() : evt.body)
      : null
    return await router(metodo, ruta, body, vendedor)
  } catch (e) {
    if (e instanceof NoAutorizado) return json(401, { error: e.message })
    // El mensaje de Postgres se devuelve tal cual: los que importan aquí son
    // los `raise exception` del esquema ("la nota ya fue emitida…"), que están
    // escritos para que el vendedor los entienda.
    console.error(e)
    return json(400, { error: e.message })
  }
}
