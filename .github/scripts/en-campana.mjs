/**
 * ¿Hay que refrescar hoy los precios del sitio?
 *
 * Contesta sí mientras dura una campaña (más un margen a cada lado), y no el
 * resto del año. Lo usa el workflow de GitHub Actions para no disparar builds
 * de Amplify las 8.700 horas en las que no hay nada que refrescar.
 *
 * LAS FECHAS NO SE ESCRIBEN AQUÍ: se leen del código del sitio. Si alguien
 * corrige el Buen Fin en lib/buenfin.ts, esto lo sigue solo. Dos listas con
 * las mismas fechas se separan en cuanto se toca una.
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

const [bfIni, bfFin] = await fechas("buenfin.ts", ["BUEN_FIN_INICIO", "BUEN_FIN_FIN"])
const [bvIni, bvFin] = await fechas("ofertas/config.ts", [
  "BLACK_FRIDAY_INICIO",
  "BLACK_FRIDAY_FIN",
])

/**
 * Margen de una hora a cada lado. El de DESPUÉS es el que importa: garantiza
 * que haya al menos un build una vez terminada la campaña, que es el que
 * vacía el archivo de precios cuando el dueño apaga los descuentos en Shopify.
 */
const MARGEN = 60 * 60 * 1000
/** AHORA existe para poder probar esto sin esperar a noviembre. */
const ahora = process.env.AHORA ? Date.parse(process.env.AHORA) : Date.now()
const dentro = [
  [bfIni, bfFin],
  [bvIni, bvFin],
].some(([i, f]) => ahora >= i - MARGEN && ahora <= f + MARGEN)

const cual = dentro ? (ahora <= bfFin + MARGEN ? "Buen Fin" : "Black Friday") : "ninguna"
console.log(`ahora: ${new Date(ahora).toISOString()} · campaña: ${cual} · refrescar: ${dentro}`)

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `dentro=${dentro}\n`)
}
