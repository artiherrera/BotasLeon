/**
 * Genera /public/descuentos.json: lo que CADA bota cuesta de verdad.
 *
 * El problema que resuelve: 113 de las 118 botas tienen un descuento
 * automático vivo en Shopify —entre 5% y 32%— y el sitio no enseñaba ni uno.
 * El comprador veía $4,499 en la ficha, decidía si le alcanzaba, y el precio
 * real, $3,599, aparecía hasta el carrito. Después de haber decidido.
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
 * LÍMITE CONOCIDO: la foto se toma al compilar. Un descuento nuevo no se ve
 * hasta el siguiente despliegue — y los builds los disparan los cambios de
 * PRODUCTO, no los de descuento. Si cambias una promoción y quieres que se
 * note hoy, hay que redesplegar.
 *
 * Uso local: `node scripts/generate-descuentos.mjs`
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

/** Cuántos carritos a la vez. Ocho va holgado dentro del límite de Shopify. */
const EN_PARALELO = 8

async function shopify(query, intento = 1) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query }),
  })
  if (res.status === 429 && intento <= 4) {
    await new Promise((r) => setTimeout(r, 1000 * intento))
    return shopify(query, intento + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))
  return json.data
}

/** Lo que cuesta UNA de estas, sola en un carrito. */
async function precioReal(producto) {
  const variante = producto.variants?.nodes?.[0]?.id
  if (!variante) return null
  const data = await shopify(`
    mutation @inContext(country: ${PAIS}) {
      cartCreate(input: { lines: [{ merchandiseId: "${variante}", quantity: 1 }] }) {
        cart {
          lines(first: 1) {
            nodes {
              merchandise { ... on ProductVariant { price { amount currencyCode } } }
              cost { totalAmount { amount currencyCode } }
              discountAllocations { discountedAmount { amount } }
            }
          }
        }
      }
    }
  `)
  const linea = data?.cartCreate?.cart?.lines?.nodes?.[0]
  if (!linea) return null
  const lista = parseFloat(linea.merchandise.price.amount)
  const paga = parseFloat(linea.cost.totalAmount.amount)
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

  const data = await shopify(`
    query @inContext(country: ${PAIS}) {
      products(first: 250) {
        nodes { handle variants(first: 1) { nodes { id } } }
      }
    }
  `)
  const productos = (data?.products?.nodes ?? []).filter((p) => p.variants?.nodes?.length)
  console.log(`[descuentos] ${productos.length} productos, mercado ${PAIS}`)

  const encontrados = {}
  let fallos = 0
  for (let i = 0; i < productos.length; i += EN_PARALELO) {
    const lote = productos.slice(i, i + EN_PARALELO)
    const res = await Promise.all(
      lote.map((p) =>
        precioReal(p).catch(() => {
          fallos++
          return null
        })
      )
    )
    res.forEach((r, j) => {
      if (r) encontrados[lote[j].handle] = r
    })
  }

  const salida = {
    generado: new Date().toISOString(),
    mercado: PAIS,
    productos: encontrados,
  }
  await writeFile(SALIDA, JSON.stringify(salida))
  const n = Object.keys(encontrados).length
  console.log(
    `[descuentos] ${n} con descuento de ${productos.length}` +
      (fallos ? ` · ${fallos} fallaron y quedan sin descuento (se publican a precio de lista)` : "")
  )
}

// Que NO reviente el build: sin este archivo las botas salen a precio de
// lista, que es exactamente como salían antes. Un sitio sin tachados es peor
// que el de ayer; un sitio que no compila es peor que todo.
await main().catch(async (e) => {
  console.warn("[descuentos] falló:", e.message)
  await writeFile(SALIDA, JSON.stringify({ generado: null, productos: {} }))
})
