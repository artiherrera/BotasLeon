/**
 * Mide el fondo de los logos de los talleres y dice cuáles hay que invertir.
 *
 * La franja de la portada los pinta en escala de grises con multiply sobre la
 * crema, y eso solo funciona si el logo trae fondo blanco o transparencia. Con
 * fondo oscuro o de color, el multiply pinta el rectángulo entero. Este script
 * baja los catorce logos del metaobjeto `brand`, mide la luminancia media de
 * las cuatro esquinas y devuelve la lista que va en src/lib/logos-talleres.ts.
 *
 *   node scripts/mide-logos.mjs
 *
 * Hay que volver a correrlo cuando el dueño suba o cambie un logo en Shopify.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = Object.fromEntries(
  fs.readFileSync(path.join(raiz, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const res = await fetch(
  `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION || "2025-01"}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query: `{ metaobjects(type:"brand", first:50) { edges { node { handle
        fields { key value reference { ... on MediaImage { image { url } } } } } } } }`,
    }),
  }
)
const { data, errors } = await res.json()
if (errors) {
  console.error(errors)
  process.exit(1)
}

const oscuros = []
for (const { node } of data.metaobjects.edges) {
  const nombre = node.fields.find((f) => f.key === "name")?.value || node.handle
  const url = node.fields.find((f) => f.key === "logo")?.reference?.image?.url
  if (!url) {
    console.log(`${nombre.padEnd(22)} sin logo`)
    continue
  }
  const buf = Buffer.from(
    await (await fetch(url.split("?")[0] + "?width=400")).arrayBuffer()
  )
  // Aplanar sobre blanco: un logo con alfa se comporta como uno de fondo blanco.
  const { data: px, info } = await sharp(buf)
    .flatten({ background: "#FFFFFF" })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const en = (x, y) => {
    const i = (y * info.width + x) * info.channels
    return [px[i], px[i + 1], px[i + 2]]
  }
  const esquinas = [
    en(2, 2),
    en(info.width - 3, 2),
    en(2, info.height - 3),
    en(info.width - 3, info.height - 3),
  ]
  const fondo = [0, 1, 2].map((c) =>
    Math.round(esquinas.reduce((s, e) => s + e[c], 0) / esquinas.length)
  )
  const lum = Math.round(0.2126 * fondo[0] + 0.7152 * fondo[1] + 0.0722 * fondo[2])
  // Por debajo de 235 el fondo ya se nota como un rectángulo sobre la crema.
  const invertir = lum < 235
  if (invertir) oscuros.push(node.handle)
  console.log(
    `${nombre.padEnd(22)} fondo=${fondo.join(",").padEnd(13)} lum=${String(lum).padStart(3)}  ${invertir ? "INVERTIR" : "ok"}`
  )
}

console.log("\nLista para src/lib/logos-talleres.ts:")
console.log(oscuros.map((h) => `  "${h}",`).join("\n"))
