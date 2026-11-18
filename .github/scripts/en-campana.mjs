/**
 * ¿Hay que refrescar hoy los precios del sitio?
 *
 * Contesta sí mientras dura una campaña (más un margen a cada lado), y no el
 * resto del año. Lo usa el workflow de GitHub Actions para no disparar builds
 * de Amplify las 8.700 horas en las que no hay nada que refrescar.
 *
 * LAS FECHAS NO SE ESCRIBEN AQUÍ: se leen del código del sitio. Si alguien
 * corrige las de una temporada en lib/ofertas/config.ts, esto lo sigue solo.
 * Dos listas con las mismas fechas se separan en cuanto se toca una.
 */
import { readFile } from "node:fs/promises"
import { appendFile } from "node:fs/promises"

const RAIZ = new URL("../../storefront/src/lib/", import.meta.url)

async function fechas(archivo, nombres) {
  const texto = await readFile(new URL(archivo, RAIZ), "utf8")
  return nombres.map((n) => {
    const m = texto.match(new RegExp(`${n}\\s*=\\s*"([^"]+)"`))
    if (!m) throw new Error(`No encontré ${n} en ${archivo}`)
    return Date.parse(m[1])
  })
}

// El Buen Fin se desmontó el 2026-11-18 y con él lib/buenfin.ts. Este script
// lo leía al arrancar, así que sin esta línea fuera el workflow reventaba en
// cada ejecución horaria con "no such file".
const [bvIni, bvFin] = await fechas("ofertas/config.ts", [
  "BLACK_FRIDAY_INICIO",
  "BLACK_FRIDAY_FIN",
])

/**
 * LA VENTANA REAL DEL DESCUENTO, que no tiene por qué coincidir con la
 * campaña: los descuentos pueden verse ANTES de que arranque la temporada
 * con nombre, como pasó en noviembre de 2026, y mientras se vean hay que
 * mantenerlos
 * frescos: si cambia un descuento en Shopify hoy, el sitio tiene que recogerlo
 * hoy, no el viernes.
 *
 * Se lee del mismo config.ts: INICIO_DESCUENTO/FIN_DESCUENTO pueden ser null
 * ("sin límite por ese lado"), una fecha literal, o el nombre de una constante
 * de temporada, que aquí se resuelve con las fechas que ya tenemos.
 */
const config = await readFile(new URL("ofertas/config.ts", RAIZ), "utf8")
const encendido = /MOSTRAR_DESCUENTO_EN_SITIO\s*=\s*true/.test(config)
const leeLimite = (nombre, fallback) => {
  const m = config.match(new RegExp(`${nombre}:\\s*string\\s*\\|\\s*null\\s*=\\s*([^\n]+)`))
  if (!m) return fallback
  const v = m[1].trim().replace(/[;,]$/, "")
  if (v === "null") return fallback
  if (v === "BLACK_FRIDAY_INICIO") return bvIni
  if (v === "BLACK_FRIDAY_FIN") return bvFin
  const lit = v.match(/"([^"]+)"/)
  return lit ? Date.parse(lit[1]) : fallback
}

/**
 * Margen de una hora a cada lado. El de DESPUÉS es el que importa: garantiza
 * que haya al menos un build una vez terminada la campaña, que es el que
 * vacía el archivo de precios cuando el dueño apaga los descuentos en Shopify.
 */
const MARGEN = 60 * 60 * 1000
/** AHORA existe para poder probar esto sin esperar a noviembre. */
const ahora = process.env.AHORA ? Date.parse(process.env.AHORA) : Date.now()
const ventanaIni = leeLimite("INICIO_DESCUENTO", -Infinity)
const ventanaFin = leeLimite("FIN_DESCUENTO", Infinity)
const conDescuentosVivos =
  encendido && ahora >= ventanaIni - MARGEN && ahora <= ventanaFin + MARGEN

const dentro =
  conDescuentosVivos ||
  (ahora >= bvIni - MARGEN && ahora <= bvFin + MARGEN)

const motivo = !dentro
  ? "nada que refrescar"
  : conDescuentosVivos
    ? "descuentos a la vista"
    : "Black Friday"
console.log(`ahora: ${new Date(ahora).toISOString()} · motivo: ${motivo} · refrescar: ${dentro}`)

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `dentro=${dentro}\n`)
}
