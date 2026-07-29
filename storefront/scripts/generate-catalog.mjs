/**
 * Genera el CATÁLOGO en PDF (tipo revista) como archivos estáticos:
 *   public/catalogo-es.pdf  (español / MXN)
 *   public/catalogo-en.pdf  (inglés  / USD)
 *
 * Corre en prebuild. Pre-generado = descarga instantánea, sin cargar el
 * navegador del cliente. Las fotos se recomprimen a JPEG con sharp (de ~260KB
 * PNG a ~33KB) para que el PDF pese poco y react-pdf lo arme al instante.
 *
 * Estructura: portada-menú (2 mosaicos Hombre/Mujer, clic → sección) · sección
 * Hombre/Mujer (divisoria + 1 bota por página con fotos, logo de marca, nombre,
 * marca, precio, descripción, QR + enlace) · contraportada.
 *
 * RESILIENTE: si algo falla NO tumba el build — loguea y sale con 0.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import pdfPkg from "@react-pdf/renderer"
import QRCode from "qrcode"
import sharp from "sharp"

const { Document, Page, View, Text, Image, Link } = pdfPkg
const h = React.createElement

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// ── env ────────────────────────────────────────────────────────────────
async function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    if (k && !process.env[k]) process.env[k] = t.slice(eq + 1).trim()
  }
}
await loadEnvFile(join(ROOT, ".env.production.local"))
await loadEnvFile(join(ROOT, ".env.local"))

const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN
const TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-01"
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://botasleon.com").replace(/\/$/, "")
const ENDPOINT = DOMAIN ? `https://${DOMAIN}/api/${VERSION}/graphql.json` : ""

// anchos objetivo (px) por tipo de imagen
const W = { main: 760, thumb: 240, cover: 1000, logo: 260 }

const C = {
  leather: "#3B2A20", brown: "#8B5A2B", gold: "#C9A227", text: "#1F1814",
  muted: "#5A4F44", subtle: "#9B8E7C", cream: "#F4E9D8", creamSoft: "#FBF5EA",
  border: "#D8D0C2", white: "#FFFFFF",
}

// ── helpers de imagen (sharp → JPEG data-uri, con caché + paralelo) ───────
const imgCache = new Map() // `${url}|${w}` → dataUri | null
function sizedUrl(url, w) {
  return url + (url.includes("?") ? "&" : "?") + `width=${w}`
}
async function fetchJpeg(url, w) {
  try {
    const res = await fetch(sizedUrl(url, w), { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const jpg = await sharp(buf).flatten({ background: "#ffffff" }).jpeg({ quality: 76 }).toBuffer()
    return "data:image/jpeg;base64," + jpg.toString("base64")
  } catch {
    return null
  }
}
// Procesa una lista de {url, w} en paralelo (batches) → llena imgCache.
async function prepareImages(jobs) {
  const uniq = [...new Map(jobs.filter((j) => j.url).map((j) => [`${j.url}|${j.w}`, j])).values()]
  const BATCH = 10
  for (let i = 0; i < uniq.length; i += BATCH) {
    const slice = uniq.slice(i, i + BATCH)
    const out = await Promise.all(slice.map((j) => fetchJpeg(j.url, j.w)))
    slice.forEach((j, k) => imgCache.set(`${j.url}|${j.w}`, out[k]))
  }
}
function img(url, w) {
  return url ? imgCache.get(`${url}|${w}`) ?? null : null
}

function stripHtml(s) {
  if (!s) return ""
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim()
}
function money(amount, currency, locale) {
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return ""
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
async function qr(url) {
  try {
    return await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: C.leather, light: "#FFFFFF" } })
  } catch { return null }
}

// ── Shopify (resiliente) ─────────────────────────────────────────────────
async function shopify(query, variables, attempt = 1) {
  if (!ENDPOINT || !TOKEN) return null
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    return (await res.json()).data ?? null
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 1000 * attempt)); return shopify(query, variables, attempt + 1) }
    console.warn(`[catalog] Shopify no respondió: ${err?.message || err}`)
    return null
  }
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query CatalogProducts($first: Int!, $country: CountryCode!, $language: LanguageCode!)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges { node {
        handle title vendor description productType
        featuredImage { url }
        images(first: 3) { edges { node { url } } }
        priceRange { minVariantPrice { amount currencyCode } }
        gender: metafield(namespace: "shopify", key: "target-gender") {
          references(first: 5) { edges { node { ... on Metaobject { handle } } } }
        }
      } }
    }
  }
`
function mapProduct(node) {
  const imgs = []
  if (node.featuredImage?.url) imgs.push(node.featuredImage.url)
  for (const e of node.images?.edges ?? []) if (e.node?.url && !imgs.includes(e.node.url)) imgs.push(e.node.url)
  return {
    handle: node.handle, title: node.title, vendor: node.vendor || "",
    description: stripHtml(node.description).slice(0, 300),
    images: imgs.slice(0, 3),
    price: node.priceRange?.minVariantPrice ?? null,
    genders: (node.gender?.references?.edges ?? []).map((e) => e.node.handle),
  }
}
function splitByGender(data) {
  const all = (data?.products?.edges ?? []).map((e) => mapProduct(e.node))
  return {
    hombre: all.filter((p) => p.genders.includes("masculino")),
    mujer: all.filter((p) => p.genders.includes("femenino")),
  }
}
async function getBrandLogos() {
  const data = await shopify(`{ metaobjects(type:"brand", first:60){ edges{ node{ fields{ key value reference{ ... on MediaImage { image { url } } } } } } } }`, {})
  const map = new Map()
  for (const e of data?.metaobjects?.edges ?? []) {
    const f = e.node.fields
    const name = f.find((x) => x.key === "name")?.value
    const logo = f.find((x) => x.key === "logo")?.reference?.image?.url
    if (name && logo) map.set(name.trim().toLowerCase(), logo)
  }
  return map
}
async function getCovers() {
  const data = await shopify(`{ metaobjects(type:"category_card", first:20){ edges{ node{ fields{ key value reference{ ... on MediaImage { image { url } } } } } } } }`, {})
  const covers = {}
  for (const e of data?.metaobjects?.edges ?? []) {
    const f = e.node.fields
    const link = (f.find((x) => x.key === "link_url")?.value || "").toLowerCase()
    const im = f.find((x) => x.key === "image")?.reference?.image?.url
    if (!im) continue
    if (link.includes("/hombre")) covers.hombre = im
    else if (link.includes("/mujer")) covers.mujer = im
  }
  return covers
}

// ── componentes del PDF ───────────────────────────────────────────────────
function Wordmark({ size = 26, color = C.cream }) {
  return h(Text, { style: { fontFamily: "Helvetica-Bold", fontSize: size, letterSpacing: 1, color } }, "BOTAS", h(Text, { style: { color: C.gold } }, "LEÓN"))
}

function CoverMenu({ tr, covers }) {
  const tile = (label, cover, dest) =>
    h(Link, { src: `#${dest}`, style: { flex: 1, textDecoration: "none" } },
      h(View, { style: { flex: 1, position: "relative", backgroundColor: C.brown } },
        img(cover, W.cover) ? h(Image, { src: img(cover, W.cover), style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null,
        h(View, { style: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(59,42,32,0.75)", paddingVertical: 16, alignItems: "center" } },
          h(Text, { style: { color: C.cream, fontSize: 22, letterSpacing: 4, fontFamily: "Helvetica-Bold" } }, label),
          h(Text, { style: { color: C.gold, fontSize: 8, letterSpacing: 2, marginTop: 4 } }, tr.tapToSee))))
  return h(Page, { size: "A4", wrap: false, style: { backgroundColor: C.leather, padding: 0 } },
    h(View, { style: { paddingTop: 48, paddingBottom: 24, alignItems: "center" } },
      h(Wordmark, { size: 30 }),
      h(Text, { style: { color: C.gold, fontSize: 11, letterSpacing: 4, marginTop: 16 } }, tr.coverEyebrow),
      h(Text, { style: { color: C.cream, fontSize: 13, marginTop: 6 } }, tr.coverTitle)),
    h(View, { style: { flexDirection: "row", flex: 1 } }, tile(tr.men, covers.hombre, "sec-hombre"), tile(tr.women, covers.mujer, "sec-mujer")),
    h(Text, { style: { color: C.subtle, fontSize: 9, textAlign: "center", paddingVertical: 12 } }, "botasleon.com"))
}

function Divider({ label, cover, dest }) {
  return h(Page, { size: "A4", wrap: false, style: { padding: 0, backgroundColor: C.leather }, bookmark: { title: label } },
    h(View, { id: dest, style: { flex: 1, position: "relative", backgroundColor: C.brown } },
      img(cover, W.cover) ? h(Image, { src: img(cover, W.cover), style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null,
      h(View, { style: { position: "absolute", bottom: 70, left: 0, right: 0, alignItems: "center", backgroundColor: "rgba(59,42,32,0.55)", paddingVertical: 24 } },
        h(Text, { style: { color: C.cream, fontSize: 36, letterSpacing: 8, fontFamily: "Helvetica-Bold" } }, label))))
}

function BootPage({ p, tr, locale, currency, brandLogos, qrMap }) {
  const main = img(p.images[0], W.main)
  const thumbs = p.images.slice(1, 3).map((u) => img(u, W.thumb)).filter(Boolean)
  const logo = img(brandLogos.get((p.vendor || "").trim().toLowerCase()), W.logo)
  const url = `${SITE}/products/${p.handle}`
  const price = p.price ? money(p.price.amount, p.price.currencyCode || currency, locale) : ""
  const qrImg = qrMap.get(p.handle)
  return h(Page, { size: "A4", style: { padding: 0, backgroundColor: C.white } },
    h(View, { style: { height: "52%", position: "relative", backgroundColor: C.creamSoft } },
      main ? h(Image, { src: main, style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null),
    h(View, { style: { flex: 1, paddingHorizontal: 40, paddingTop: 22, paddingBottom: 26 } },
      logo ? h(Image, { src: logo, style: { height: 26, width: 92, objectFit: "contain", marginBottom: 8 } })
           : h(Text, { style: { color: C.brown, fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: "Helvetica-Bold" } }, (p.vendor || "").toUpperCase()),
      h(Text, { style: { color: C.text, fontSize: 19, fontFamily: "Helvetica-Bold", marginBottom: 6 } }, p.title),
      price ? h(Text, { style: { color: C.leather, fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 10 } }, price) : null,
      p.description ? h(Text, { style: { color: C.muted, fontSize: 10.5, lineHeight: 1.5, marginBottom: 12 } }, p.description) : null,
      h(View, { style: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" } },
        h(View, { style: { flexDirection: "row", gap: 8 } },
          ...thumbs.map((j, i) => h(Image, { key: i, src: j, style: { width: 64, height: 64, objectFit: "cover", borderRadius: 3, border: `1px solid ${C.border}` } }))),
        h(Link, { src: url, style: { flexDirection: "row", alignItems: "center", gap: 8, textDecoration: "none" } },
          qrImg ? h(Image, { src: qrImg, style: { width: 60, height: 60 } }) : null,
          h(Text, { style: { color: C.brown, fontSize: 9, fontFamily: "Helvetica-Bold", maxWidth: 62 } }, tr.buy))))
  )
}

function BackCover({ tr }) {
  return h(Page, { size: "A4", style: { backgroundColor: C.leather, padding: 50, justifyContent: "center", alignItems: "center" } },
    h(Wordmark, { size: 30 }),
    h(Text, { style: { color: C.cream, fontSize: 15, marginTop: 24, marginBottom: 16, textAlign: "center" } }, tr.shopOnline),
    h(Text, { style: { color: C.gold, fontSize: 20, letterSpacing: 1, marginBottom: 26, fontFamily: "Helvetica-Bold" } }, "botasleon.com"),
    h(Text, { style: { color: C.cream, fontSize: 11, lineHeight: 1.8, textAlign: "center" } }, "WhatsApp: +52 479 303 2457"),
    h(Text, { style: { color: C.cream, fontSize: 11, lineHeight: 1.8, textAlign: "center" } }, "contacto@botasleon.com"),
    h(Text, { style: { color: C.subtle, fontSize: 10, textAlign: "center", marginTop: 6 } }, "Blvd. Hilario Medina 407, 2º piso · León, Gto."),
    h(Text, { style: { color: C.subtle, fontSize: 9, textAlign: "center", marginTop: 28 } }, tr.madeIn))
}

function buildCatalog({ hombre, mujer, brandLogos, covers, qrMap, tr, locale, currency }) {
  return h(Document, { title: tr.docTitle, author: "BotasLeón" },
    h(CoverMenu, { key: "c", tr, covers }),
    h(Divider, { key: "dh", label: tr.men, cover: covers.hombre, dest: "sec-hombre" }),
    ...hombre.map((p, i) => h(BootPage, { key: "h" + i, p, tr, locale, currency, brandLogos, qrMap })),
    h(Divider, { key: "dm", label: tr.women, cover: covers.mujer, dest: "sec-mujer" }),
    ...mujer.map((p, i) => h(BootPage, { key: "m" + i, p, tr, locale, currency, brandLogos, qrMap })),
    h(BackCover, { key: "b", tr }))
}

const STR = {
  es: { coverEyebrow: "CATÁLOGO", coverTitle: "Botas hechas en León, Guanajuato", men: "HOMBRE", women: "MUJER", tapToSee: "TOCA PARA VER", buy: "Comprar →", shopOnline: "Compra en línea · Envío a todo México", madeIn: "Hecho con orgullo en México", docTitle: "Catálogo BotasLeón" },
  en: { coverEyebrow: "CATALOG", coverTitle: "Boots handcrafted in León, Mexico", men: "MEN", women: "WOMEN", tapToSee: "TAP TO VIEW", buy: "Shop →", shopOnline: "Shop online · Shipped across the USA", madeIn: "Proudly made in Mexico", docTitle: "BotasLeón Catalog" },
}

// ── main ─────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now()
  const [esData, enData] = await Promise.all([
    shopify(PRODUCTS_QUERY, { first: 250, country: "MX", language: "ES" }),
    shopify(PRODUCTS_QUERY, { first: 250, country: "US", language: "EN" }),
  ])
  if (!esData?.products?.edges?.length && !enData?.products?.edges?.length) {
    console.warn("[catalog] sin productos; salto la generación")
    return
  }
  const es = esData ? splitByGender(esData) : null
  const en = enData ? splitByGender(enData) : null
  const [brandLogos, covers] = await Promise.all([getBrandLogos(), getCovers()])

  // Reunir TODAS las imágenes (compartidas entre ES/EN) y procesarlas 1 vez.
  const src = es || en
  const jobs = []
  for (const p of [...src.hombre, ...src.mujer]) {
    if (p.images[0]) jobs.push({ url: p.images[0], w: W.main })
    for (const u of p.images.slice(1, 3)) jobs.push({ url: u, w: W.thumb })
  }
  jobs.push({ url: covers.hombre, w: W.cover }, { url: covers.mujer, w: W.cover })
  for (const logo of brandLogos.values()) jobs.push({ url: logo, w: W.logo })
  await prepareImages(jobs)

  // QR por handle (mismo para ambos idiomas).
  const qrMap = new Map()
  await Promise.all([...src.hombre, ...src.mujer].map(async (p) => qrMap.set(p.handle, await qr(`${SITE}/products/${p.handle}`))))

  await mkdir(join(ROOT, "public"), { recursive: true })
  if (es) {
    await pdfPkg.renderToFile(buildCatalog({ ...es, brandLogos, covers, qrMap, tr: STR.es, locale: "es-MX", currency: "MXN" }), join(ROOT, "public", "catalogo-es.pdf"))
    console.log(`[catalog] catalogo-es.pdf: ${es.hombre.length} hombre + ${es.mujer.length} mujer`)
  }
  if (en) {
    await pdfPkg.renderToFile(buildCatalog({ ...en, brandLogos, covers, qrMap, tr: STR.en, locale: "en-US", currency: "USD" }), join(ROOT, "public", "catalogo-en.pdf"))
    console.log(`[catalog] catalogo-en.pdf: ${en.hombre.length} hombre + ${en.mujer.length} mujer`)
  }
  console.log(`[catalog] listo en ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error("[catalog] error no fatal, el build continúa:", err?.message || err)
  process.exit(0)
})
