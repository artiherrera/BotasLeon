/**
 * Genera /public/descuentos.json: lo que CADA bota cuesta de verdad.
 *
 * El problema que resuelve: casi todas las botas tienen un descuento
 * automático vivo en Shopify y el sitio no enseñaba ni uno. El comprador veía
 * $5,299 en la ficha, decidía si le alcanzaba, y el precio real —$3,709.30—
 * aparecía hasta el carrito. Después de haber decidido.
 *
 * SE LE PREGUNTA AL CARRITO, NO SE CALCULA. Los descuentos automáticos no
 * existen en el producto: la Storefront API solo los expone cuando algo está
 * en un carrito (`discountAllocations`). Se podrían leer las reglas con la API
 * de administración y rehacer la cuenta aquí, pero ahí es donde se mete uno en
 * líos —mínimos, combinaciones, excepciones, topes— y una cuenta mal hecha
 * publica un precio que la caja no cobra. Así que este script hace lo único
 * que no puede equivocarse: mete la bota a un carrito y anota lo que Shopify
 * dice que cuesta.
 *
 * UNA BOTA POR CARRITO, a propósito. En un carrito de veinte, un descuento con
 * mínimo de compra se activaría y el sitio prometería un precio que una bota
 * sola no consigue. Comprobado el 2026-10-13 con cinco botas: solas dan el
 * mismo descuento que acompañadas, así que hoy ninguno tiene mínimo — pero el
 * script no depende de que eso siga siendo verdad.
 *
 * MONEDA Y MERCADO: el carrito se crea con el país del build
 * (NEXT_PUBLIC_MARKET), así que la .mx mide pesos y la .com dólares. Cada rama
 * genera su propio archivo.
 *
 * ── DOS FALLOS QUE COSTARON DATOS FALSOS (2026-11-10) ─────────────────────
 *
 * La primera versión de este script entregó, sobre 110 productos, 28 con
 * descuento… de los cuales 21 decían "100% de descuento, $0". Y 82 "fallaron".
 * Ninguna de las dos cosas era verdad:
 *
 * 1. LOS $0 ERAN BOTAS AGOTADAS. Si se mete al carrito una variante sin
 *    existencias, Shopify crea la línea igual y devuelve `totalAmount` en 0 —
 *    no la cobra. El script lo leía como un descuento del 100%. Si eso llega
 *    al sitio, la portada anuncia botas gratis. Ahora solo se preguntan
 *    variantes DISPONIBLES, y cualquier resultado con `paga <= 0` se tira.
 *
 * 2. LOS "FALLOS" ERAN ESTRANGULAMIENTO. La Storefront API no contesta 429
 *    cuando te pasas de su cubo: contesta **200** con
 *    `errors[].extensions.code = "THROTTLED"`. El script solo reintentaba
 *    mirando el status, así que daba por perdida cada petición estrangulada.
 *    Con ocho carritos a la vez, a 22 puntos cada uno, eso era la mayoría.
 *    Ahora se reintenta por el CÓDIGO, con espera creciente, y se baja la
 *    concurrencia.
 *
 * REGLA QUE SE QUEDA: este archivo solo puede contener precios que Shopify
 * cobre. Ante la duda —cero, negativo, más caro que la lista, agotado— no se
 * escribe nada y la bota sale a precio de lista, que es como salía antes.
 *
 * Uso local: `NEXT_PUBLIC_MARKET=MX node scripts/generate-descuentos.mjs`
 * Uso CI: corre en el prebuild, junto al sitemap y al catálogo.
 */

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SALIDA = join(ROOT, "public", "descuentos.json")

// Mismo parseo manual de .env que el resto de los scripts: sin dependencias.
async function cargarEnv(path) {
  if (!existsSync(path)) return
  const contenido = await readFile(path, "utf8")
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim()
    if (!limpia || limpia.startsWith("#")) continue
    const eq = limpia.indexOf("=")
    if (eq === -1) continue
    const clave = limpia.slice(0, eq).trim()
    const valor = limpia.slice(eq + 1).trim()
    if (clave && !process.env[clave]) process.env[clave] = valor
  }
}

await cargarEnv(join(ROOT, ".env.production.local"))
await cargarEnv(join(ROOT, ".env.local"))

const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN
const TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || process.env.SHOPIFY_API_VERSION || "2025-01"
const PAIS = process.env.NEXT_PUBLIC_MARKET === "MX" ? "MX" : "US"
const ENDPOINT = DOMAIN ? `https://${DOMAIN}/api/${VERSION}/graphql.json` : ""

/**
 * Cuántos carritos a la vez. CUATRO, no ocho: cada cartCreate cuesta 22 puntos
 * y el cubo de la Storefront API se vacía despacio. Con ocho, tres de cada
 * cuatro peticiones volvían estranguladas.
 */
const EN_PARALELO = 4
/** Reintentos ante estrangulamiento, con espera creciente. */
const REINTENTOS = 8
/**
 * Pausa entre tandas. No es prudencia de más: el cubo de la Storefront API se
 * rellena a unos 100 puntos por segundo y cada cartCreate cuesta 22, así que
 * cuatro de golpe son 88 puntos y hay que darle al cubo un segundo para
 * recuperarse. Sin esta pausa, ocho botas de 64 seguían volviendo
 * estranguladas aunque se reintentara. Con ella, el trabajo entero tarda unos
 * veinte segundos más y no se pierde ninguna.
 */
const PAUSA_ENTRE_TANDAS = 1000

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Una petición, con reintento ante estrangulamiento.
 *
 * OJO con la forma del error: el estrangulamiento llega como 200 + un error
 * con `extensions.code = "THROTTLED"`, no como 429. Hay que mirar las dos
 * cosas.
 */
async function shopify(query, intento = 1) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
    })
  } catch (e) {
    // Red caída a media tanda: también se reintenta.
    if (intento <= REINTENTOS) {
      await esperar(500 * 2 ** intento)
      return shopify(query, intento + 1)
    }
    throw e
  }

  if ((res.status === 429 || res.status >= 500) && intento <= REINTENTOS) {
    await esperar(500 * 2 ** intento)
    return shopify(query, intento + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const estrangulado = json.errors?.some(
    (e) => e.extensions?.code === "THROTTLED" || /throttl/i.test(e.message || "")
  )
  if (estrangulado && intento <= REINTENTOS) {
    // Espera creciente con un pellizco al azar, para que las cuatro tandas en
    // vuelo no vuelvan a chocar todas en el mismo milisegundo.
    await esperar(500 * 2 ** intento + Math.random() * 400)
    return shopify(query, intento + 1)
  }
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))
  return json.data
}

/**
 * Lo que cuesta UNA de estas, sola en un carrito.
 *
 * Devuelve null —y la bota sale a precio de lista— ante cualquier cosa rara:
 * sin línea, sin cobro, cobro en cero (agotada), o un "descuento" que sale más
 * caro que la lista. Vale más una bota sin oferta que una con un precio que la
 * caja no respeta.
 */
async function precioReal(variante) {
  const data = await shopify(`
    mutation @inContext(country: ${PAIS}) {
      cartCreate(input: { lines: [{ merchandiseId: "${variante.id}", quantity: 1 }] }) {
        userErrors { message }
        cart {
          lines(first: 1) {
            nodes {
              merchandise { ... on ProductVariant { availableForSale price { amount currencyCode } } }
              cost { totalAmount { amount currencyCode } }
            }
          }
        }
      }
    }
  `)
  const linea = data?.cartCreate?.cart?.lines?.nodes?.[0]
  if (!linea) return null
  if (linea.merchandise?.availableForSale === false) return null

  const lista = parseFloat(linea.merchandise.price.amount)
  const paga = parseFloat(linea.cost.totalAmount.amount)
  if (!Number.isFinite(lista) || !Number.isFinite(paga)) return null
  // Cero es "no te la puedo cobrar", no "te la regalo".
  if (paga <= 0) return null
  if (paga > lista) return null
  // Un céntimo de diferencia no es una oferta: es redondeo.
  if (!(lista - paga > 0.5)) return null

  return {
    lista: Number(lista.toFixed(2)),
    paga: Number(paga.toFixed(2)),
    moneda: linea.cost.totalAmount.currencyCode,
  }
}

async function main() {
  if (!DOMAIN || !TOKEN) {
    console.warn("[descuentos] sin credenciales de Shopify — se escribe un archivo vacío")
    await writeFile(SALIDA, JSON.stringify({ generado: null, productos: {} }, null, 0))
    return
  }

  // 100 variantes por producto: de sobra (la que más tiene son colores) y
  // dentro del tope de la API.
  const data = await shopify(`
    query @inContext(country: ${PAIS}) {
      products(first: 250) {
        nodes {
          handle
          availableForSale
          variants(first: 100) {
            nodes { id availableForSale price { amount currencyCode } }
          }
        }
      }
    }
  `)
  const productos = data?.products?.nodes ?? []

  /**
   * UNA CONSULTA POR PRECIO DISTINTO, no por variante.
   *
   * Una bota con seis colores al mismo precio tiene un solo precio que
   * averiguar; preguntar seis veces multiplica por seis el riesgo de
   * estrangulamiento sin aportar un dato nuevo. Pero si dos variantes valen
   * distinto —la talla extra, el exótico— cada precio puede llevar su propio
   * descuento, y entonces sí hay que preguntar las dos.
   *
   * Solo variantes DISPONIBLES: a una agotada Shopify le cobra cero y eso no
   * es un descuento (ver la cabecera).
   */
  const tareas = []
  let agotados = 0
  for (const p of productos) {
    const vivas = (p.variants?.nodes ?? []).filter((v) => v.availableForSale)
    if (vivas.length === 0) {
      agotados++
      continue
    }
    const porPrecio = new Map()
    for (const v of vivas) {
      const clave = v.price.amount
      if (!porPrecio.has(clave)) porPrecio.set(clave, v)
    }
    for (const v of porPrecio.values()) tareas.push({ handle: p.handle, variante: v })
  }

  console.log(
    `[descuentos] ${productos.length} productos, mercado ${PAIS} · ` +
      `${agotados} agotados (se saltan) · ${tareas.length} precios distintos que consultar`
  )

  const porHandle = new Map()
  const fallaron = []
  for (let i = 0; i < tareas.length; i += EN_PARALELO) {
    if (i > 0) await esperar(PAUSA_ENTRE_TANDAS)
    const lote = tareas.slice(i, i + EN_PARALELO)
    const res = await Promise.all(
      lote.map((t) =>
        precioReal(t.variante).catch((e) => {
          fallaron.push(`${t.handle} (${e.message})`)
          return null
        })
      )
    )
    res.forEach((r, j) => {
      if (!r) return
      const h = lote[j].handle
      const lista = porHandle.get(h) ?? []
      lista.push(r)
      porHandle.set(h, lista)
    })
  }

  /**
   * De la lista de precios de cada bota sale UN registro. `lista` y `paga` son
   * los del precio MÁS BARATO con descuento, porque es el que enseña la
   * tarjeta ("desde $X"); `precios` guarda todos, para la ficha, que sí sabe
   * qué variante eligió el cliente.
   */
  const encontrados = {}
  for (const [handle, precios] of porHandle) {
    precios.sort((a, b) => a.paga - b.paga)
    const barato = precios[0]
    encontrados[handle] = {
      lista: barato.lista,
      paga: barato.paga,
      moneda: barato.moneda,
      pct: Math.round(((barato.lista - barato.paga) / barato.lista) * 100),
      ...(precios.length > 1
        ? { precios: precios.map((p) => ({ lista: p.lista, paga: p.paga })) }
        : {}),
    }
  }

  const salida = {
    generado: new Date().toISOString(),
    mercado: PAIS,
    productos: encontrados,
  }
  await writeFile(SALIDA, JSON.stringify(salida))

  const n = Object.keys(encontrados).length
  const maximo = Object.values(encontrados).reduce((m, d) => Math.max(m, d.pct), 0)
  console.log(
    `[descuentos] ${n} con descuento · el mayor es ${maximo}%` +
      (fallaron.length
        ? `\n[descuentos] ${fallaron.length} se quedaron sin consultar y salen a precio de lista:\n  - ` +
          fallaron.slice(0, 20).join("\n  - ")
        : "")
  )
}

// Que NO reviente el build: sin este archivo las botas salen a precio de
// lista, que es exactamente como salían antes. Un sitio sin tachados es peor
// que el de ayer; un sitio que no compila es peor que todo.
await main().catch(async (e) => {
  console.warn("[descuentos] falló:", e.message)
  await writeFile(SALIDA, JSON.stringify({ generado: null, productos: {} }))
})
