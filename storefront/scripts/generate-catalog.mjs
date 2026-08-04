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

import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import React from "react"
import pdfPkg from "@react-pdf/renderer"
import QRCode from "qrcode"
import sharp from "sharp"

const execFileP = promisify(execFile)

const { Document, Page, View, Text, Image, Link, Font } = pdfPkg
const h = React.createElement

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// Tipografías de marca (mismas del sitio): Bevan (display western) + Zilla Slab.
Font.register({ family: "Bevan", src: join(__dirname, "fonts", "Bevan-Regular.ttf") })
Font.register({
  family: "Zilla",
  fonts: [
    { src: join(__dirname, "fonts", "ZillaSlab-Regular.ttf"), fontWeight: 400 },
    { src: join(__dirname, "fonts", "ZillaSlab-SemiBold.ttf"), fontWeight: 600 },
    { src: join(__dirname, "fonts", "ZillaSlab-Bold.ttf"), fontWeight: 700 },
  ],
})
// Evita que react-pdf intente cortar palabras con guiones (mejor para títulos).
Font.registerHyphenationCallback((word) => [word])

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
const W = { photo: 480, cover: 1100, logo: 460 }

// Logo real de BotasLeón (public/logo_botasleon.png = 800×220), versión BLANCA
// para los fondos oscuros. Se carga en main(); cae a wordmark si falla.
let LOGO_WHITE = null
const LOGO_RATIO = 220 / 800

// Colores OFICIALES (globals.css @theme).
const C = {
  leather: "#4B2E1F", brown: "#8B5A2B", gold: "#B8924A", text: "#1F1814",
  muted: "#5A4F44", subtle: "#6E6250", cream: "#F4E9D8", creamSoft: "#FBF8F1",
  border: "#D4CCBE", terracotta: "#8B3A24", white: "#FFFFFF",
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
  const BATCH = 20
  for (let i = 0; i < uniq.length; i += BATCH) {
    const slice = uniq.slice(i, i + BATCH)
    const out = await Promise.all(slice.map((j) => fetchJpeg(j.url, j.w)))
    slice.forEach((j, k) => imgCache.set(`${j.url}|${j.w}`, out[k]))
  }
}
function img(url, w) {
  return url ? imgCache.get(`${url}|${w}`) ?? null : null
}
// Convierte el logo (oscuro sobre transparente) a BLANCO respetando el alfa
// (equivale al `brightness(0) invert(1)` que usa el sitio en los fondos oscuros).
async function loadWhiteLogo() {
  try {
    const p = join(ROOT, "public", "logo_botasleon.png")
    if (!existsSync(p)) return null
    const buf = await readFile(p)
    const white = await sharp(buf).ensureAlpha().linear([0, 0, 0, 1], [255, 255, 255, 0]).png().toBuffer()
    return "data:image/png;base64," + white.toString("base64")
  } catch {
    return null
  }
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
        images(first: 6) { edges { node { url } } }
        options { name values }
        collections(first: 30) { edges { node { handle title } } }
        priceRange { minVariantPrice { amount currencyCode } }
        compareAtPriceRange { minVariantPrice { amount currencyCode } }
        gender: metafield(namespace: "shopify", key: "target-gender") {
          references(first: 5) { edges { node { ... on Metaobject { handle } } } }
        }
        material: metafield(namespace: "shopify", key: "footwear-material") {
          references(first: 5) { edges { node { ... on Metaobject { handle fields { key value } } } } }
        }
        toe: metafield(namespace: "shopify", key: "toe-style") {
          references(first: 5) { edges { node { ... on Metaobject { handle fields { key value } } } } }
        }
        style: metafield(namespace: "shopify", key: "boot-style") {
          references(first: 5) { edges { node { ... on Metaobject { handle fields { key value } } } } }
        }
      } }
    }
  }
`
function refLabels(mf) {
  return (mf?.references?.edges ?? [])
    .map((e) => {
      const f = e.node.fields || []
      return (
        f.find((x) => x.key === "label")?.value ||
        f.find((x) => x.key === "name")?.value ||
        f.find((x) => x.key === "value")?.value ||
        ""
      )
    })
    .filter(Boolean)
}
// {handle, label} por referencia — el handle sirve para canonicalizar estilos.
function refItems(mf) {
  return (mf?.references?.edges ?? [])
    .map((e) => {
      const f = e.node.fields || []
      const label =
        f.find((x) => x.key === "label")?.value ||
        f.find((x) => x.key === "name")?.value ||
        f.find((x) => x.key === "value")?.value ||
        ""
      return { handle: e.node.handle || "", label }
    })
    .filter((x) => x.handle || x.label)
}
// Tallas desde las variantes reales: la opción "Talla"/"Size".
function sizesFromOptions(node) {
  const opt = (node.options ?? []).find((o) => /talla|size/i.test(o.name || ""))
  return opt?.values ?? []
}
function mapProduct(node) {
  const imgs = []
  if (node.featuredImage?.url) imgs.push(node.featuredImage.url)
  for (const e of node.images?.edges ?? []) if (e.node?.url && !imgs.includes(e.node.url)) imgs.push(e.node.url)
  const price = node.priceRange?.minVariantPrice ?? null
  const ca = node.compareAtPriceRange?.minVariantPrice
  const compareAt = ca && parseFloat(ca.amount) > parseFloat(price?.amount ?? "0") ? ca : null
  return {
    handle: node.handle, title: node.title, vendor: node.vendor || "",
    productType: node.productType || "",
    description: stripHtml(node.description).slice(0, 480),
    images: imgs.slice(0, 6),
    price, compareAt,
    sizes: sizesFromOptions(node),
    collections: (node.collections?.edges ?? []).map((e) => ({
      handle: e.node.handle || "",
      title: e.node.title || "",
    })),
    material: refLabels(node.material),
    horma: refLabels(node.toe),
    styles: refLabels(node.style),
    styleItems: refItems(node.style),
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
  console.log(`[catalog] portadas de categoría → hombre:${covers.hombre ? "OK" : "FALTA"} mujer:${covers.mujer ? "OK" : "FALTA"}`)
  return covers
}

// ── componentes del PDF ───────────────────────────────────────────────────
// Logo real de BotasLeón (blanco). Si no se pudo cargar, cae al wordmark de texto.
function Logo({ w = 220 }) {
  if (LOGO_WHITE) return h(Image, { src: LOGO_WHITE, style: { width: w, height: Math.round(w * LOGO_RATIO), objectFit: "contain" } })
  return h(Text, { style: { fontFamily: "Bevan", fontSize: Math.round(w * 0.14), letterSpacing: 1, color: C.cream } }, "BOTAS", h(Text, { style: { color: C.gold } }, "LEÓN"))
}

// LETTER = 612 × 792 pt. Alturas EXPLÍCITAS (flex:1 no le daba alto a las fotos).
const COVER_TILE_H = 640
function CoverMenu({ tr, covers, edition }) {
  const tile = (label, cover, dest) =>
    h(Link, { src: `#${dest}`, style: { width: "50%", height: COVER_TILE_H, textDecoration: "none" } },
      h(View, { style: { width: "100%", height: "100%", position: "relative", backgroundColor: C.brown } },
        img(cover, W.cover) ? h(Image, { src: img(cover, W.cover), style: { width: "100%", height: "100%", objectFit: "cover" } }) : null,
        h(View, { style: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(59,42,32,0.78)", paddingVertical: 18, alignItems: "center" } },
          h(Text, { style: { color: C.cream, fontSize: 18, letterSpacing: 2, fontFamily: "Bevan" } }, label),
          h(Text, { style: { color: C.gold, fontSize: 8, letterSpacing: 2, marginTop: 5, fontFamily: "Zilla" } }, tr.tapToSee))))
  return h(Page, { size: "LETTER", wrap: false, style: { backgroundColor: C.leather, padding: 0, fontFamily: "Zilla" } },
    h(View, { style: { height: 120, alignItems: "center", justifyContent: "center" } },
      h(Logo, { w: 250 }),
      h(Text, { style: { color: C.gold, fontSize: 11, letterSpacing: 4, marginTop: 14 } }, tr.coverEyebrow),
      h(Text, { style: { color: C.cream, fontSize: 13, marginTop: 6 } }, tr.coverTitle),
      edition ? h(Text, { style: { color: C.subtle, fontSize: 9, letterSpacing: 2, marginTop: 6 } }, edition) : null),
    h(View, { style: { flexDirection: "row", height: COVER_TILE_H } }, tile(tr.men, covers.hombre, "sec-hombre"), tile(tr.women, covers.mujer, "sec-mujer")),
    h(View, { style: { height: 32, alignItems: "center", justifyContent: "center" } },
      h(Text, { style: { color: C.subtle, fontSize: 9 } }, "botasleon.com")))
}

function Divider({ label, cover, dest }) {
  return h(Page, { size: "LETTER", wrap: false, style: { padding: 0, backgroundColor: C.leather }, bookmark: { title: label } },
    h(View, { id: dest, style: { width: "100%", height: 792, position: "relative", backgroundColor: C.brown } },
      img(cover, W.cover) ? h(Image, { src: img(cover, W.cover), style: { width: "100%", height: "100%", objectFit: "cover" } }) : null,
      h(View, { style: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center", backgroundColor: "rgba(59,42,32,0.55)", paddingVertical: 28 } },
        h(Text, { style: { color: C.cream, fontSize: 34, letterSpacing: 3, fontFamily: "Bevan" } }, label))))
}

function Chip(label) {
  return h(View, { key: label, style: { backgroundColor: C.cream, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9, marginRight: 6, marginBottom: 6 } },
    h(Text, { style: { color: C.leather, fontSize: 8.5, letterSpacing: 0.4 } }, label))
}

// Tile de foto: SIEMPRE contain (la bota completa, nunca recortada) sobre crema.
function photoTile(src, style) {
  return h(View, { style: { backgroundColor: C.creamSoft, borderRadius: 4, alignItems: "center", justifyContent: "center", padding: 6, ...style } },
    src ? h(Image, { src, style: { width: "100%", height: "100%", objectFit: "contain" } }) : null)
}

function BootPage({ p, tr, locale, currency, brandLogos, qrMap }) {
  const photos = p.images.map((u) => img(u, W.photo)).filter(Boolean)
  const logo = img(brandLogos.get((p.vendor || "").trim().toLowerCase()), W.logo)
  const url = `${SITE}/products/${p.handle}`
  const price = p.price ? money(p.price.amount, p.price.currencyCode || currency, locale) : ""
  const compareAt = p.compareAt ? money(p.compareAt.amount, p.compareAt.currencyCode || currency, locale) : ""
  const qrImg = qrMap.get(p.handle)
  const specs = [...new Set([...p.styles, ...p.material, ...p.horma])].slice(0, 6)

  // Collage — todas las fotos, sin recortar. 1 foto = grande; 2+ = grid 2 col.
  const tileH = photos.length <= 2 ? 462 : photos.length <= 4 ? 226 : 148
  const collage =
    photos.length <= 1
      ? photoTile(photos[0], { flex: 1 })
      : h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignContent: "flex-start" } },
          ...photos.map((ph, i) => photoTile(ph, { width: "48.5%", height: tileH })))

  return h(Page, { size: "LETTER", style: { padding: 30, backgroundColor: C.white, flexDirection: "column", fontFamily: "Zilla" } },
    // Encabezado: marca + nombre · precio
    h(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
      h(View, { style: { flex: 1, paddingRight: 12 } },
        logo ? h(View, { style: { alignItems: "flex-start", marginBottom: 10 } },
                 h(Image, { src: logo, style: { height: 42, width: 170, objectFit: "contain" } }))
             : h(Text, { style: { color: C.brown, fontSize: 12, letterSpacing: 2, marginBottom: 8, fontFamily: "Bevan" } }, (p.vendor || "").toUpperCase()),
        h(Text, { style: { color: C.text, fontSize: 19, fontFamily: "Zilla", fontWeight: 700, lineHeight: 1.15 } }, p.title)),
      h(View, { style: { alignItems: "flex-end" } },
        price ? h(Text, { style: { color: C.leather, fontSize: 17, fontFamily: "Zilla", fontWeight: 700 } }, price) : null,
        compareAt ? h(Text, { style: { color: C.subtle, fontSize: 10, textDecoration: "line-through", marginTop: 2 } }, compareAt) : null)),
    // Collage (zona central de altura fija → nada se corta)
    h(View, { style: { height: 470, marginBottom: 12 } }, collage),
    // Specs (chips)
    specs.length ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 } }, ...specs.map((s) => Chip(s))) : null,
    // Descripción completa
    p.description ? h(Text, { style: { color: C.muted, fontSize: 10, lineHeight: 1.5 } }, p.description) : null,
    // Pie: web + QR/enlace
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: `1px solid ${C.border}`, paddingTop: 10 } },
      h(Text, { style: { color: C.subtle, fontSize: 9 } }, "botasleon.com"),
      h(Link, { src: url, style: { flexDirection: "row", alignItems: "center", gap: 8, textDecoration: "none" } },
        h(Text, { style: { color: C.brown, fontSize: 10, fontFamily: "Zilla", fontWeight: 700 } }, tr.buy),
        qrImg ? h(Image, { src: qrImg, style: { width: 54, height: 54 } }) : null)))
}

function BackCover({ tr }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, padding: 50, justifyContent: "center", alignItems: "center", fontFamily: "Zilla" } },
    h(Logo, { w: 260 }),
    h(Text, { style: { color: C.cream, fontSize: 15, marginTop: 24, marginBottom: 16, textAlign: "center" } }, tr.shopOnline),
    h(Text, { style: { color: C.gold, fontSize: 20, letterSpacing: 1, marginBottom: 26, fontFamily: "Zilla", fontWeight: 700 } }, "botasleon.com"),
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
  es: {
    coverEyebrow: "CATÁLOGO", coverTitle: "Botas hechas en León, Guanajuato", men: "HOMBRE", women: "MUJER", tapToSee: "TOCA PARA VER", buy: "Comprar →", shopOnline: "Compra en línea · Envío a todo México", madeIn: "Hecho con orgullo en México", docTitle: "Catálogo BotasLeón", pageAlt: "Página", downloadPdf: "Descargar PDF", backToStore: "Ir a la tienda", langHref: "/catalogo-en.html", langLabel: "EN", htmlLang: "es",
    editionWord: "EDICIÓN", collectionLabel: "COLECCIÓN",
    historyEyebrow: "NUESTRA HISTORIA", historyTitle: "380 años de tradición en cuero",
    historyParas: [
      "León, Guanajuato, es la capital mundial del cuero. Aquí el oficio se hereda de generación en generación desde hace casi cuatro siglos.",
      "Trabajamos directo con los talleres — sin intermediarios — para llevarte el par exacto: construcción artesanal, piel auténtica y ajuste real.",
      "Cada modelo pasa por nuestro filtro de calidad. Las pieles exóticas se ofrecen con certificación CITES, garantía de origen legal y responsable.",
    ],
    indexEyebrow: "CONTENIDO", indexTitle: "Índice",
    brandsEyebrow: "NUESTROS TALLERES", brandsTitle: "Marcas", modelSingular: "modelo", modelPlural: "modelos",
    guideEyebrow: "GUÍA", guideTitle: "Pieles y hormas", guidePielesLabel: "PIELES", guideHormasLabel: "HORMAS",
    pieles: [
      { name: "Pitón", desc: "Escamas naturales, ligera y flexible." },
      { name: "Caimán", desc: "Escama marcada y estructura firme; símbolo de estatus." },
      { name: "Mantarraya", desc: "Textura de perlas; de las pieles más resistentes del mundo." },
      { name: "Avestruz", desc: "Puntos de folículo característicos; suave y muy durable." },
      { name: "Bisonte", desc: "Grano robusto y carácter rústico; ideal para diario." },
      { name: "Venado", desc: "Piel suave y ligera; comodidad desde el primer día." },
    ],
    hormas: [
      { name: "Dubai", desc: "Punta cuadrada moderna, corte estilizado." },
      { name: "Puntal", desc: "Punta afilada tradicional; silueta clásica vaquera." },
      { name: "Cuadrada", desc: "Punta cuadrada amplia; comodidad y presencia." },
      { name: "Roper", desc: "Punta redonda baja; para faena y montar." },
    ],
    sizesEyebrow: "TALLAS Y CUIDADO", sizesTitle: "Tu talla y el cuidado del cuero",
    sizesIntro: "Equivalencias de tallas mexicanas a US. Ante la duda, consulta la guía completa.",
    sizesMx: "MX", sizesUsMen: "US Hombre", sizesUsWomen: "US Mujer", careTitle: "Cuidado",
    careTips: [
      "Limpia con paño seco; evita agua directa en pieles exóticas.",
      "Nutre el cuero con crema o grasa neutra.",
      "Guárdalas con hormas para conservar la forma.",
      "Rota su uso; deja descansar el cuero entre puestas.",
    ],
    sizesLink: "Guía completa: botasleon.com/guia-tallas · Cuidado: botasleon.com/accesorios/cuidado-del-cuero",
    accEyebrow: "ACCESORIOS", accTitle: "Completa tu look", accCopy: "Cinturones, sombreros, carteras y productos para el cuidado del cuero — piezas seleccionadas para acompañar tus botas.", accCta: "Ver accesorios en botasleon.com/accesorios",
    closingTitle: "Hecho en León, para ti", closingText: "Gracias por elegir tradición.",
  },
  en: {
    coverEyebrow: "CATALOG", coverTitle: "Boots handcrafted in León, Mexico", men: "MEN", women: "WOMEN", tapToSee: "TAP TO VIEW", buy: "Shop →", shopOnline: "Shop online · Shipped across the USA", madeIn: "Proudly made in Mexico", docTitle: "BotasLeón Catalog", pageAlt: "Page", downloadPdf: "Download PDF", backToStore: "Go to store", langHref: "/catalogo-es.html", langLabel: "ES", htmlLang: "en",
    editionWord: "EDITION", collectionLabel: "COLLECTION",
    historyEyebrow: "OUR STORY", historyTitle: "380 years of leather tradition",
    historyParas: [
      "León, Guanajuato is the leather capital of the world. Here the craft has been passed down for nearly four centuries.",
      "We work directly with the workshops — no middlemen — to bring you the right pair: handcrafted, genuine leather, true fit.",
      "Every model passes our quality filter. Exotic skins are offered with CITES certification — a guarantee of legal, responsible origin.",
    ],
    indexEyebrow: "CONTENTS", indexTitle: "Index",
    brandsEyebrow: "OUR WORKSHOPS", brandsTitle: "Brands", modelSingular: "model", modelPlural: "models",
    guideEyebrow: "GUIDE", guideTitle: "Skins & toe shapes", guidePielesLabel: "SKINS", guideHormasLabel: "TOE SHAPES",
    pieles: [
      { name: "Python", desc: "Natural scales, light and flexible." },
      { name: "Caiman", desc: "Bold scales and firm structure; a status symbol." },
      { name: "Stingray", desc: "Pearl texture; one of the toughest skins in the world." },
      { name: "Ostrich", desc: "Signature quill marks; soft and very durable." },
      { name: "Bison", desc: "Robust grain and rugged character; great for daily wear." },
      { name: "Deer", desc: "Soft, light skin; comfort from day one." },
    ],
    hormas: [
      { name: "Dubai", desc: "Modern square toe, sleek cut." },
      { name: "Snip", desc: "Traditional pointed toe; classic western line." },
      { name: "Square", desc: "Wide square toe; comfort and presence." },
      { name: "Roper", desc: "Low round toe; for work and riding." },
    ],
    sizesEyebrow: "SIZING & CARE", sizesTitle: "Your size & leather care",
    sizesIntro: "Mexican-to-US size equivalents. When in doubt, check the full guide.",
    sizesMx: "MX", sizesUsMen: "US Men", sizesUsWomen: "US Women", careTitle: "Care",
    careTips: [
      "Wipe with a dry cloth; avoid direct water on exotic skins.",
      "Nourish the leather with neutral cream or conditioner.",
      "Store with shoe trees to keep their shape.",
      "Rotate wear; let the leather rest between uses.",
    ],
    sizesLink: "Full guide: botasleon.com/en/guia-tallas · Care: botasleon.com/en/accesorios/cuidado-del-cuero",
    accEyebrow: "ACCESSORIES", accTitle: "Complete your look", accCopy: "Belts, hats, wallets and leather-care products — pieces selected to go with your boots.", accCta: "See accessories at botasleon.com/en/accesorios",
    closingTitle: "Made in León, for you", closingText: "Thank you for choosing tradition.",
  },
}

// ── visor HTML (para móvil: SIEMPRE abre, nunca descarga) ─────────────────
// Chrome/Android y los navegadores dentro de IG/FB no tienen visor de PDF y lo
// descargan. Una página HTML con las páginas del PDF como imágenes se abre en
// todos. Necesita `pdftoppm` (poppler) — si no está, se omite (el PDF sigue).
async function hasPdftoppm() {
  try { await execFileP("pdftoppm", ["-v"]); return true } catch { return false }
}

// Renderiza cada página del PDF a WebP (~40KB) en outDir → p-001.webp… Devuelve nº de páginas.
async function pdfToWebp(pdfPath, outDir) {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  await execFileP("pdftoppm", ["-jpeg", "-r", "96", pdfPath, join(outDir, "raw")], { maxBuffer: 1 << 30 })
  const raws = (await readdir(outDir)).filter((f) => f.startsWith("raw") && f.endsWith(".jpg")).sort()
  let n = 0
  for (const f of raws) {
    n++
    const num = String(n).padStart(3, "0")
    const buf = await readFile(join(outDir, f))
    await sharp(buf).webp({ quality: 72 }).toFile(join(outDir, `p-${num}.webp`))
    await rm(join(outDir, f))
  }
  return n
}

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") }

// Página HTML del catálogo (mobile-first, marca BotasLeón).
function viewerHtml({ lang, tr, count, hombreDivider, mujerDivider, pdfHref }) {
  const pages = []
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(3, "0")
    const id = i === hombreDivider ? ' id="hombre"' : i === mujerDivider ? ' id="mujer"' : ""
    pages.push(`<img${id} class="pg" src="/catalogo/${lang}/p-${num}.webp" width="816" height="1056" alt="${esc(tr.pageAlt)} ${i}" loading="lazy" decoding="async">`)
  }
  return `<!doctype html>
<html lang="${tr.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4B2E1F">
<meta name="robots" content="noindex">
<title>${esc(tr.docTitle)}</title>
<style>
  :root { --leather:#4B2E1F; --cream:#FBF8F1; --creamAlt:#F4E9D8; --gold:#B8924A; --text:#1F1814; }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; }
  body { background:var(--creamAlt); color:var(--text); font-family:'Zilla Slab',Georgia,'Times New Roman',serif; -webkit-text-size-adjust:100%; }
  .bar { position:sticky; top:0; z-index:10; background:var(--leather); color:var(--cream);
    display:flex; align-items:center; justify-content:space-between; gap:8px;
    padding:calc(9px + env(safe-area-inset-top)) 12px 9px; box-shadow:0 2px 10px rgba(0,0,0,.25); }
  .bar a { color:var(--cream); text-decoration:none; font-size:13px; }
  .brand { font-weight:700; letter-spacing:.3px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .brand b { color:var(--gold); }
  .actions { display:flex; align-items:center; gap:7px; flex-shrink:0; }
  .chip { border:1px solid rgba(251,248,241,.45); border-radius:999px; padding:6px 11px; font-size:12px; white-space:nowrap; }
  .chip.gold { background:var(--gold); border-color:var(--gold); color:#3a2a12; font-weight:700; }
  .nav { position:sticky; top:0; z-index:9; display:flex; gap:8px; justify-content:center;
    background:var(--leather); padding:0 14px 10px; }
  .nav a { color:var(--cream); border:1px solid rgba(251,248,241,.35); border-radius:999px;
    padding:5px 16px; font-size:13px; letter-spacing:1px; text-decoration:none; }
  main { max-width:820px; margin:0 auto; padding:14px 12px 40px; }
  .pg { display:block; width:100%; height:auto; margin:0 auto 12px; border-radius:6px;
    box-shadow:0 4px 16px rgba(31,24,20,.14); background:#fff; }
  footer { text-align:center; color:#6E6250; font-size:13px; padding:8px 14px 34px; }
  footer a { color:var(--leather); font-weight:700; text-decoration:none; }
</style>
</head>
<body>
<div class="bar">
  <a class="brand" href="/">← BOTAS<b>LEÓN</b></a>
  <div class="actions">
    <a class="chip" href="${tr.langHref}">${tr.langLabel}</a>
    <a class="chip gold" href="${pdfHref}" download title="${esc(tr.downloadPdf)}" aria-label="${esc(tr.downloadPdf)}">&#8595;&nbsp;PDF</a>
  </div>
</div>
<div class="nav">
  <a href="#hombre">${esc(tr.men)}</a>
  <a href="#mujer">${esc(tr.women)}</a>
</div>
<main>
${pages.join("\n")}
</main>
<footer>${esc(tr.shopOnline)} · <a href="/">botasleon.com</a></footer>
</body>
</html>
`
}

// ── clasificación editorial + flatplan (paso 1) ───────────────────────────
// Capítulos = colecciones de la web = metafield boot-style (canonicalizado igual
// que src/lib/shopify/taxonomy.ts) + productType como respaldo + keyword exótica.
const BOOT_STYLE_LABELS = {
  vaquera: "Vaqueras", vaquero: "Vaqueras", vaqueras: "Vaqueras",
  botines: "Botines", botin: "Botines", "botín": "Botines",
  exoticas: "Exóticas", exotica: "Exóticas",
  clasico: "Clásicas", clasica: "Clásicas", clasicas: "Clásicas",
  largas: "Largas", rancho: "Rancho",
}
const CHAPTER_NAMES = ["Exóticas", "Vaqueras", "Clásicas", "Rancho", "Largas", "Botines"]
// Orden por género = también PRIORIDAD (bota multi-estilo → primer capítulo que matchea).
const CHAPTER_ORDER = {
  hombre: ["Exóticas", "Vaqueras", "Clásicas", "Rancho", "Botines"],
  mujer: ["Largas", "Vaqueras", "Exóticas", "Clásicas", "Botines"],
}
const EXOTIC_KW = /pit[oó]n|python|caim[aá]n|cocodrilo|crocod|avestruz|ostrich|mantarraya|stingray|bisonte|bison|v[ií]bora|serpiente|lagarto|tigre|teju|iguana|pelo de vaca/i

// Héroes por nombre (sin marca). El primero abre el catálogo.
const HEROES = [
  "Bota Piel de Caimán Negra Imperial",
  "Bota Pitón Miel Manchas Tigre",
  "Bota Mantarraya Negra Perla Negra",
  "Bota Piel de Caimán Miel Dorado",
  "Bota Corazones Rojo y Blanco Corazón",
  "Bota Extra Alta Pelo de Vaca Leona",
  "Bota Alta Negra con Brillantes Diamante",
]
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()
const HEROES_NORM = HEROES.map(norm)
const WARN = []

const priceNum = (p) => (p.price ? parseFloat(p.price.amount) : 0)
const titleName = (p) => (p.title || "").split(/\s+[—–-]\s+/)[0].trim() // "Nombre — Marca" → Nombre
// Título "Nombre — Marca". Si el título de la web no trae la marca, se completa
// con el campo `vendor` de Shopify (dato real, no inventado) → el QA pasa.
const fullTitle = (p) =>
  /\s[—–-]\s/.test(p.title || "") ? p.title : p.vendor ? `${p.title} — ${p.vendor}` : p.title
const isBlack = (p) => /\bnegr[ao]s?\b|\bblack\b/i.test(p.title || "")
const isOutlet = (p) => (p.collections || []).some((c) => /outlet/i.test(c.handle) || /outlet/i.test(c.title))

function chapterLabels(p) {
  const set = new Set()
  for (const it of p.styleItems || []) {
    const lbl = BOOT_STYLE_LABELS[(it.handle || "").toLowerCase()] || BOOT_STYLE_LABELS[(it.label || "").toLowerCase()]
    if (lbl) set.add(lbl)
  }
  if (set.size === 0 && CHAPTER_NAMES.includes(p.productType)) set.add(p.productType)
  if (set.size === 0 && EXOTIC_KW.test(`${p.title} ${(p.material || []).join(" ")}`)) set.add("Exóticas")
  return set
}
function classify(products, genderKey) {
  const order = CHAPTER_ORDER[genderKey]
  const chapters = new Map(order.map((c) => [c, []]))
  const unclassified = []
  for (const p of products) {
    const labels = chapterLabels(p)
    const chosen = order.find((c) => labels.has(c))
    if (chosen) chapters.get(chosen).push(p)
    else unclassified.push(p)
  }
  return { chapters, order, unclassified }
}
function pickHero(items) {
  for (const hn of HEROES_NORM) {
    const f = items.find((p) => norm(titleName(p)) === hn)
    if (f) return f
  }
  return items.slice().sort((a, b) => priceNum(b) - priceNum(a))[0] // fallback: el más caro
}
// Orden del capítulo: héroe primero, luego precio DESC, negras primero a igual precio.
function orderChapter(items, heroHandle) {
  const hero = items.find((p) => p.handle === heroHandle)
  const rest = items.filter((p) => p.handle !== heroHandle).sort((a, b) => {
    const d = priceNum(b) - priceNum(a)
    return d !== 0 ? d : Number(isBlack(b)) - Number(isBlack(a))
  })
  return hero ? [hero, ...rest] : rest
}
function commonPrefixRatio(a, b) {
  const wa = norm(a).split(" "), wb = norm(b).split(" ")
  let i = 0
  while (i < wa.length && i < wb.length && wa[i] === wb[i]) i++
  return i / Math.max(wa.length, wb.length, 1)
}
// Rest (sin héroe) → grupos: estándar (1) primero, compactas (pares de variantes) al final.
function groupRest(rest) {
  const used = new Set(), singles = [], pairs = []
  for (let i = 0; i < rest.length; i++) {
    if (used.has(i)) continue
    const a = rest[i]
    let m = -1
    for (let j = i + 1; j < rest.length; j++) {
      if (used.has(j)) continue
      const b = rest[j]
      if (a.vendor === b.vendor && priceNum(a) === priceNum(b) && commonPrefixRatio(titleName(a), titleName(b)) >= 0.6) { m = j; break }
    }
    if (m >= 0) { used.add(i); used.add(m); pairs.push([a, rest[m]]) }
    else { used.add(i); singles.push([a]) }
  }
  return [...singles, ...pairs]
}
function priceRangeStr(items, currency, locale) {
  const nums = items.map(priceNum).filter((x) => x > 0)
  if (!nums.length) return ""
  const lo = Math.min(...nums), hi = Math.max(...nums)
  const f = (n) => money(String(n), currency, locale)
  return lo === hi ? f(lo) : `${f(lo)} – ${f(hi)}`
}
function edicion(locale) {
  const d = new Date()
  const s = d.toLocaleDateString(locale, { month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" de ", " ")
}
function brandsSummary(products) {
  const count = new Map()
  for (const p of products) {
    if (!p.vendor) continue
    count.set(p.vendor, (count.get(p.vendor) || 0) + 1)
  }
  return [...count.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
}
function sizesSummary(products) {
  const set = new Set()
  for (const p of products) for (const s of p.sizes || []) set.add(s)
  return [...set].sort((a, b) => parseFloat(a) - parseFloat(b))
}

// Construye el flatplan (lista página → contenido → plantilla) SIN renderizar.
// Construye la lista ORDENADA de páginas (type + datos) — misma fuente para el
// flatplan y para el render, así el índice NUNCA se desincroniza de la paginación.
function buildPageList({ hombre, mujer, covers = {}, storePhotos = [], tr, currency, locale }) {
  const pages = []
  const push = (type, o = {}) => { pages.push({ n: pages.length + 1, type, template: o.template || "—", title: o.title || "", detail: o.detail || "", data: o.data || {} }); return pages.length }
  let pagesSinceHero = 99, prevWasHero = false
  const chapterIndex = []
  const edition = `${tr.editionWord} ${edicion(locale)}`

  push("cover", { title: "Portada", detail: edition, data: { covers, edition } })
  push("historia", { title: "Historia", detail: tr.historyTitle, data: { photo: storePhotos[0] } })
  push("indice", { title: "Índice", data: { chapterIndex } }) // chapterIndex se llena por referencia

  function emitGender(genderKey, label, products, coverPhoto, dest) {
    push("separator", { title: `Apertura ${label}`, detail: "duotono café", data: { photo: coverPhoto, genderKey, dest } })
    const { chapters, order, unclassified } = classify(products, genderKey)
    if (unclassified.length) WARN.push(`${label}: ${unclassified.length} sin capítulo → ${unclassified.map((p) => p.handle).slice(0, 8).join(", ")}`)
    for (const cname of order) {
      const items = chapters.get(cname) || []
      if (items.length === 0) { WARN.push(`Capítulo VACÍO: ${label} · ${cname}`); continue }
      const hero = pickHero(items)
      const ordered = orderChapter(items, hero.handle)
      const range = priceRangeStr(items, currency, locale)
      chapterIndex.push({ name: `${label} · ${chapterName(cname, locale)}`, genderKey, chapter: cname, page: pages.length + 1, count: items.length })
      push("portadilla", { title: `${label} · ${cname}`, detail: `${items.length} modelos · ${range}`, data: { genderKey, chapter: cname, items } })
      const rest = ordered.slice(1)
      const groups = groupRest(rest)
      const heroAllowed = pagesSinceHero >= 6 && !prevWasHero
      const inHeroes = HEROES_NORM.includes(norm(titleName(hero)))
      if (heroAllowed) {
        push("hero", { template: "HÉROE", title: fullTitle(hero), detail: `$${Math.round(priceNum(hero))}${inHeroes ? " · héroe fijo" : " · héroe=más caro"}`, data: { p: hero, chapter: cname, genderKey } })
        pagesSinceHero = 0; prevWasHero = true
      } else {
        push("standard", { template: "ESTÁNDAR", title: fullTitle(hero), detail: `$${Math.round(priceNum(hero))} · héroe demotado`, data: { p: hero, chapter: cname, genderKey } })
        pagesSinceHero++; prevWasHero = false
      }
      for (const g of groups) {
        if (g.length === 2) push("compact", { template: "COMPACTA", title: `${titleName(g[0])} + ${titleName(g[1])} — ${g[0].vendor}`, detail: `$${Math.round(priceNum(g[0]))}`, data: { pair: g, chapter: cname, genderKey } })
        else push("standard", { template: "ESTÁNDAR", title: fullTitle(g[0]), detail: `$${Math.round(priceNum(g[0]))}`, data: { p: g[0], chapter: cname, genderKey } })
        pagesSinceHero++; prevWasHero = false
      }
    }
  }

  emitGender("hombre", tr.men, hombre, covers.hombre, "sec-hombre")
  emitGender("mujer", tr.women, mujer, covers.mujer, "sec-mujer")

  const brands = brandsSummary([...hombre, ...mujer])
  push("marcas", { title: "Marcas", detail: `${brands.length} talleres`, data: { photo: storePhotos[1], brands } })
  push("guia", { title: "Guía de pieles y hormas", data: {} })
  push("tallas", { title: "Tallas y cuidado", data: { sizes: sizesSummary([...hombre, ...mujer]) } })
  push("accesorios", { title: "Accesorios", data: {} })
  push("cierre", { title: "Cierre", detail: "duotono café", data: { photo: storePhotos[2] } })
  push("contra", { title: "Contraportada", data: {} })

  return { pages, chapterIndex, counts: { hombre: hombre.length, mujer: mujer.length, total: hombre.length + mujer.length }, brands }
}
// Wrapper para --flatplan (solo productos, sin imágenes).
function buildFlatplan(esData, currency = "MXN", locale = "es-MX") {
  const all = (esData?.products?.edges ?? []).map((e) => mapProduct(e.node))
  return buildPageList({
    hombre: all.filter((p) => p.genders.includes("masculino")),
    mujer: all.filter((p) => p.genders.includes("femenino")),
    tr: STR.es, currency, locale,
  })
}

const TYPE_LABEL = { cover: "Portada", historia: "Historia", indice: "Índice", separator: "Separador", portadilla: "Portadilla", marcas: "Marcas", guia: "Guía", tallas: "Tallas", accesorios: "Accesorios", cierre: "Cierre", contra: "Contra" }
function printFlatplan(fp) {
  const line = (n, tpl, title, detail) =>
    `  ${String(n).padStart(3)}  ${tpl.padEnd(9)}  ${title}${detail ? `  ·  ${detail}` : ""}`
  console.log("\n════════════════════ FLATPLAN ════════════════════\n")
  for (const p of fp.pages) console.log(line(p.n, p.template === "—" ? (TYPE_LABEL[p.type] || p.type) : p.template, p.title, p.detail))
  console.log("\n──────────────── ÍNDICE (capítulo → página) ────────────────")
  for (const c of fp.chapterIndex) console.log(`  p.${String(c.page).padStart(3)}  ${c.name}  (${c.count})`)
  console.log(`\n  Total páginas: ${fp.pages.length}  ·  Hombre: ${fp.counts.hombre}  ·  Mujer: ${fp.counts.mujer}  ·  Productos: ${fp.counts.total}`)
  const heroes = fp.pages.filter((p) => p.template === "HÉROE")
  const compactas = fp.pages.filter((p) => p.template === "COMPACTA")
  console.log(`  Héroes: ${heroes.length} (p. ${heroes.map((h) => h.n).join(", ")})  ·  Compactas: ${compactas.length}`)
  if (WARN.length) {
    console.log("\n──────────────── ⚠ AVISOS QA ────────────────")
    for (const w of WARN) console.log(`  ⚠ ${w}`)
  }
  console.log("\n════════════════════════════════════════════════════════════\n")
}

// ── paso 2: plantillas editoriales + reglas de contenido ──────────────────
const EDITION_YEAR = new Date().getFullYear()

// Copy de cada colección (tal cual la web: ESTILO_META de hombre/mujer [estilo]).
const CHAPTER_COPY = {
  "hombre-Exóticas": "Botas exóticas para hombre — avestruz, cocodrilo, pitón. Piezas de colección con CITES certificado.",
  "hombre-Vaqueras": "Botas vaqueras para hombre — caña alta, silueta tradicional. Cuero auténtico hecho en León.",
  "hombre-Clásicas": "Botas clásicas para hombre — caña media, lisas, sin grabado. Versatilidad para diario y oficina.",
  "hombre-Rancho": "Botas de rancho para hombre — diseñadas para faena, campo y trabajo rudo. Resistencia y confort.",
  "hombre-Botines": "Botines vaqueros para hombre — caña corta tobillera, versatilidad para diario y casual. Cuero hecho en León.",
  "mujer-Vaqueras": "Botas vaqueras para mujer — caña alta, silueta tradicional. Cuero auténtico hecho en León.",
  "mujer-Largas": "Botas largas para mujer — sobre la rodilla, silueta fashion. Cuero auténtico con corte contemporáneo.",
  "mujer-Exóticas": "Botas exóticas para mujer — avestruz, cocodrilo, pitón. Piezas de colección con CITES certificado.",
  "mujer-Clásicas": "Botas clásicas para mujer — caña media, lisas, sin grabado. Versatilidad para diario, oficina y casual.",
  "mujer-Botines": "Botines vaqueros para mujer — caña corta tobillera, fashion y casual. Cuero hecho en León.",
}
const chapterCopy = (gender, chapter) => CHAPTER_COPY[`${gender}-${chapter}`] || ""

// MSI: "Desde $X al mes (3 MSI)".
function msiLabel(p, currency, locale) {
  if (!p.price) return ""
  const monthly = money(String(Math.round(priceNum(p) / 3)), p.price.currencyCode || currency, locale)
  return locale?.startsWith("en") ? `From ${monthly}/mo (3 MSI)` : `Desde ${monthly} al mes (3 MSI)`
}

// Descripción: corta en fin de ORACIÓN ≤280; nunca a media palabra.
function truncateSentence(s, max = 280) {
  s = (s || "").trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const sent = cut.match(/^[\s\S]*[.!?…]/)
  if (sent && sent[0].trim().length >= 60) return sent[0].trim()
  const sp = cut.lastIndexOf(" ")
  return (sp > 0 ? cut.slice(0, sp) : cut).trim() + "…"
}
// ¿la descripción quedó cortada a media palabra? (QA)
function endsMidWord(orig, out) {
  if (out === orig) return false
  if (/[.!?…]$/.test(out)) return false
  if (out.endsWith("…")) {
    // el char antes de … debe ser fin de palabra (había un espacio donde cortamos)
    const stem = out.slice(0, -1)
    return orig.startsWith(stem) && /\S/.test(orig.charAt(stem.length))
  }
  return true
}

// Diccionario de fixes ortográficos + normalización de espacios.
const FIXES = { quienla: "quien la", laque: "la que", deel: "de el", tambien: "también", mantaraya: "Mantarraya", avetruz: "Avestruz", cocdrilo: "Cocodrilo" }
function fixText(s) {
  let out = (s || "").replace(/\s+/g, " ").trim()
  for (const [bad, good] of Object.entries(FIXES)) out = out.replace(new RegExp(`\\b${bad}\\b`, "gi"), good)
  return out
}

// Tags: máx 3, prioridad piel > horma > estilo; sin "Cuero"; Vaquero/a por género.
function tagsFor(p, gender) {
  const noCuero = (arr) => (arr || []).filter((t) => t && !/^cuero$/i.test(t.trim()))
  const unify = (t) => (/vaquer[oa]s?/i.test(t) ? (gender === "mujer" ? "Vaquera" : "Vaquero") : t)
  const ordered = [...noCuero(p.material), ...noCuero(p.horma), ...noCuero((p.styles || []).map(unify))]
  const out = []
  for (const raw of ordered) {
    if (out.length >= 3) break
    const t = fixText(raw) // corrige typos de datos (Mantaraya→Mantarraya, etc.)
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  return out
}

function sizesLabel(p, locale) {
  const T = locale?.startsWith("en") ? "Sizes" : "Tallas"
  const nums = (p.sizes || []).map((s) => parseFloat(s)).filter((n) => Number.isFinite(n) && n >= 20 && n <= 35)
  if (!nums.length) return `${T} 25–30 MX`
  const gender = (p.genders || []).includes("femenino") ? "femenino" : (p.genders || []).includes("masculino") ? "masculino" : null
  const lo = Math.min(...nums), hi = Math.max(...nums)
  const usLo = usFor(lo, gender), usHi = usFor(hi, gender)
  return `${T} ${lo}–${hi} MX${usLo && usHi ? ` · US ${usLo}–${usHi}` : ""}`
}
function qrCampaignUrl(handle, lang = "es") {
  return `${SITE}/${lang}/products/${handle}?utm_source=catalogo&utm_medium=qr&utm_campaign=catalogo-${EDITION_YEAR}`
}

// 4ª imagen: crop de textura (punta/empeine, ~40% inferior-central de la lateral).
const toeCache = new Map()
async function cropToeDetail(url, w = 480) {
  const key = `${url}|toe|${w}`
  if (toeCache.has(key)) return toeCache.get(key)
  let out = null
  try {
    const res = await fetch(sizedUrl(url, 900), { signal: AbortSignal.timeout(20000) })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      const m = await sharp(buf).metadata()
      const W0 = m.width || 900, H0 = m.height || 900
      const cw = Math.round(W0 * 0.64), top = Math.round(H0 * 0.54)
      const ch = Math.min(Math.round(H0 * 0.40), H0 - top)
      const left = Math.round((W0 - cw) / 2)
      const jpg = await sharp(buf).extract({ left, top, width: cw, height: ch })
        .resize(w).flatten({ background: "#ffffff" }).jpeg({ quality: 78 }).toBuffer()
      out = "data:image/jpeg;base64," + jpg.toString("base64")
    }
  } catch { out = null }
  toeCache.set(key, out)
  return out
}
const toeImg = (url, w = 480) => (url ? toeCache.get(`${url}|toe|${w}`) ?? null : null)
function needsToeCrop(chapter, p) {
  if (chapter === "Rancho") return false
  if (chapter === "Exóticas" || chapter === "Largas") return true
  return /pelo de vaca/i.test(p.title || "")
}

// ── plantillas ──
function ChapterTitlePage({ genderLabel, chapter, copy, range }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, padding: 60, justifyContent: "center", fontFamily: "Zilla" } },
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 18 } }, genderLabel.toUpperCase()),
    h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 44, lineHeight: 1.1, marginBottom: 22 } }, chapter),
    h(View, { style: { width: 64, height: 3, backgroundColor: C.gold, marginBottom: 24 } }),
    copy ? h(Text, { style: { color: C.cream, fontSize: 14, lineHeight: 1.55, maxWidth: 420, marginBottom: 30 } }, copy) : null,
    range ? h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 1 } }, range) : null)
}

function HeroPage({ p, currency, locale, brandLogos, qrMap }) {
  const lateral = img(p.images[0], W.cover) || img(p.images[0], W.photo)
  const detail = toeImg(p.images[0])
  const logo = img(brandLogos.get((p.vendor || "").trim().toLowerCase()), W.logo)
  const price = p.price ? money(p.price.amount, p.price.currencyCode || currency, locale) : ""
  return h(Page, { size: "LETTER", style: { backgroundColor: C.creamSoft, fontFamily: "Zilla" } },
    h(View, { style: { position: "absolute", top: 0, left: 0, right: 0, height: 792, backgroundColor: C.creamSoft } },
      lateral ? h(Image, { src: lateral, style: { width: "100%", height: "100%", objectFit: "cover" } }) : null),
    detail ? h(View, { style: { position: "absolute", top: 40, right: 40, width: 150, height: 112, borderWidth: 3, borderColor: C.cream } },
      h(Image, { src: detail, style: { width: "100%", height: "100%", objectFit: "cover" } })) : null,
    h(View, { style: { position: "absolute", left: 40, right: 40, bottom: 44, backgroundColor: "rgba(75,46,31,0.92)", padding: 24 } },
      logo ? h(Image, { src: logo, style: { height: 30, width: 130, objectFit: "contain", marginBottom: 10 } })
           : h(Text, { style: { color: C.gold, fontFamily: "Bevan", fontSize: 12, letterSpacing: 2, marginBottom: 10 } }, (p.vendor || "").toUpperCase()),
      h(Text, { style: { color: C.cream, fontFamily: "Zilla", fontWeight: 700, fontSize: 24, lineHeight: 1.1, marginBottom: 12 } }, titleName(p)),
      h(View, { style: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" } },
        h(View, {},
          price ? h(Text, { style: { color: C.cream, fontFamily: "Zilla", fontWeight: 700, fontSize: 26 } }, price) : null,
          h(Text, { style: { color: C.gold, fontSize: 11, marginTop: 3 } }, msiLabel(p, currency, locale))),
        qrMap.get(p.handle) ? h(Image, { src: qrMap.get(p.handle), style: { width: 54, height: 54 } }) : null)))
}

// Media ficha para COMPACTA (lateral + par + datos).
function compactHalf(p, currency, locale, brandLogos, qrMap) {
  const lateral = img(p.images[0], W.photo)
  const par = img(p.images[2] || p.images[1], W.photo)
  const logo = img(brandLogos.get((p.vendor || "").trim().toLowerCase()), W.logo)
  const price = p.price ? money(p.price.amount, p.price.currencyCode || currency, locale) : ""
  return h(View, { style: { height: 388, flexDirection: "row", padding: 26 } },
    h(View, { style: { width: "52%", flexDirection: "row", gap: 8 } },
      photoTile(lateral, { width: "48%", height: "100%" }),
      photoTile(par, { width: "48%", height: "100%" })),
    h(View, { style: { width: "48%", paddingLeft: 18, justifyContent: "center" } },
      logo ? h(Image, { src: logo, style: { height: 26, width: 110, objectFit: "contain", marginBottom: 8, alignSelf: "flex-start" } })
           : h(Text, { style: { color: C.brown, fontFamily: "Bevan", fontSize: 10, letterSpacing: 2, marginBottom: 8 } }, (p.vendor || "").toUpperCase()),
      h(Text, { style: { color: C.text, fontFamily: "Zilla", fontWeight: 700, fontSize: 16, lineHeight: 1.15, marginBottom: 8 } }, titleName(p)),
      price ? h(Text, { style: { color: C.leather, fontFamily: "Zilla", fontWeight: 700, fontSize: 18 } }, price) : null,
      h(Text, { style: { color: C.brown, fontSize: 9.5, marginTop: 2 } }, msiLabel(p, currency, locale)),
      h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 } },
        h(Text, { style: { color: C.subtle, fontSize: 8.5, maxWidth: 130 } }, sizesLabel(p, locale)),
        qrMap.get(p.handle) ? h(Image, { src: qrMap.get(p.handle), style: { width: 46, height: 46 } }) : null)))
}
function CompactPage({ pair, currency, locale, brandLogos, qrMap }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.white, fontFamily: "Zilla" } },
    compactHalf(pair[0], currency, locale, brandLogos, qrMap),
    h(View, { style: { height: 1, backgroundColor: C.border, marginHorizontal: 26 } }),
    compactHalf(pair[1], currency, locale, brandLogos, qrMap))
}

// ESTÁNDAR — 2×2 con las reglas nuevas (4ª imagen, MSI, tachado solo Outlet, QR UTM, tags, truncado).
function StandardPage({ p, chapter, gender, currency, locale, brandLogos, qrMap }) {
  const logo = img(brandLogos.get((p.vendor || "").trim().toLowerCase()), W.logo)
  const price = p.price ? money(p.price.amount, p.price.currencyCode || currency, locale) : ""
  const outlet = isOutlet(p)
  const compareAt = outlet && p.compareAt ? money(p.compareAt.amount, p.compareAt.currencyCode || currency, locale) : ""
  const tags = tagsFor(p, gender)
  const desc = fixText(truncateSentence(fixText(p.description), 280))
  // 4 imágenes: lateral, 3/4, par, (suela | crop de textura).
  const cuarta = needsToeCrop(chapter, p) ? toeImg(p.images[0]) : img(p.images[3], W.photo)
  const four = [img(p.images[0], W.photo), img(p.images[1], W.photo), img(p.images[2], W.photo), cuarta].filter(Boolean).slice(0, 4)
  return h(Page, { size: "LETTER", style: { padding: 30, backgroundColor: C.white, flexDirection: "column", fontFamily: "Zilla" } },
    h(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
      h(View, { style: { flex: 1, paddingRight: 12 } },
        logo ? h(View, { style: { alignItems: "flex-start", marginBottom: 10 } }, h(Image, { src: logo, style: { height: 42, width: 170, objectFit: "contain" } }))
             : h(Text, { style: { color: C.brown, fontSize: 12, letterSpacing: 2, marginBottom: 8, fontFamily: "Bevan" } }, (p.vendor || "").toUpperCase()),
        h(Text, { style: { color: C.text, fontSize: 19, fontFamily: "Zilla", fontWeight: 700, lineHeight: 1.15 } }, titleName(p))),
      h(View, { style: { alignItems: "flex-end" } },
        price ? h(Text, { style: { color: C.leather, fontSize: 20, fontFamily: "Zilla", fontWeight: 700 } }, price) : null,
        compareAt ? h(Text, { style: { color: C.terracotta, fontSize: 10, textDecoration: "line-through", marginTop: 2 } }, compareAt) : null,
        h(Text, { style: { color: C.brown, fontSize: 9.5, marginTop: 3, textAlign: "right", maxWidth: 150 } }, msiLabel(p, currency, locale)))),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 8, height: 452, alignContent: "flex-start", marginBottom: 10 } },
      ...four.map((ph, i) => photoTile(ph, { width: "48.5%", height: 222 }))),
    tags.length ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 } }, ...tags.map((s) => Chip(s))) : null,
    desc ? h(Text, { style: { color: C.muted, fontSize: 10, lineHeight: 1.5 } }, desc) : null,
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: `1px solid ${C.border}`, paddingTop: 10 } },
      h(Text, { style: { color: C.subtle, fontSize: 9 } }, sizesLabel(p, locale)),
      qrMap.get(p.handle) ? h(Image, { src: qrMap.get(p.handle), style: { width: 54, height: 54 } }) : null))
}

// Renderiza UN capítulo de muestra (portadilla + héroe + estándar + compactas).
async function renderSampleChapter(esData, gender, chapterName) {
  const all = (esData?.products?.edges ?? []).map((e) => mapProduct(e.node))
  const genderKey = gender === "mujer" ? "femenino" : "masculino"
  const prods = all.filter((p) => p.genders.includes(genderKey))
  const { chapters } = classify(prods, gender)
  const items = chapters.get(chapterName) || []
  if (!items.length) { console.error(`[sample] capítulo vacío: ${gender} ${chapterName}`); return }
  const hero = pickHero(items)
  const ordered = orderChapter(items, hero.handle)
  const rest = ordered.slice(1)
  const groups = groupRest(rest)
  const singles = groups.filter((g) => g.length === 1).map((g) => g[0])
  const pairs = groups.filter((g) => g.length === 2)

  // Imágenes: lateral+3/4+par+suela (W.photo) por producto; héroe lateral a W.cover; crops de textura.
  LOGO_WHITE = await loadWhiteLogo()
  const [brandLogos] = await Promise.all([getBrandLogos()])
  const jobs = []
  for (const p of items) for (const u of p.images.slice(0, 4)) jobs.push({ url: u, w: W.photo })
  jobs.push({ url: hero.images[0], w: W.cover })
  for (const logo of brandLogos.values()) jobs.push({ url: logo, w: W.logo })
  await prepareImages(jobs)
  // crops de textura (4ª imagen) para los que aplican + detalle del héroe.
  await Promise.all(items.filter((p) => needsToeCrop(chapterName, p)).map((p) => cropToeDetail(p.images[0])))
  await cropToeDetail(hero.images[0])

  const currency = "MXN", locale = "es-MX"
  const qrMap = new Map()
  await Promise.all(items.map(async (p) => qrMap.set(p.handle, await qr(qrCampaignUrl(p.handle)))))

  const range = priceRangeStr(items, currency, locale)
  const doc = h(Document, { title: `Muestra ${chapterName}`, author: "BotasLeón" },
    h(ChapterTitlePage, { key: "t", genderLabel: gender, chapter: chapterName, copy: chapterCopy(gender, chapterName), range }),
    h(HeroPage, { key: "h", p: hero, currency, locale, brandLogos, qrMap }),
    ...singles.map((p, i) => h(StandardPage, { key: "s" + i, p, chapter: chapterName, gender, currency, locale, brandLogos, qrMap })),
    ...pairs.map((pr, i) => h(CompactPage, { key: "c" + i, pair: pr, currency, locale, brandLogos, qrMap })))

  await mkdir(join(ROOT, "public"), { recursive: true })
  await pdfPkg.renderToFile(doc, join(ROOT, "public", "catalogo-sample.pdf"))
  console.log(`[sample] ${gender} · ${chapterName}: portadilla + héroe(${titleName(hero)}) + ${singles.length} estándar + ${pairs.length} compactas → public/catalogo-sample.pdf`)

  // QA del capítulo de muestra
  for (const p of items) {
    const d = fixText(truncateSentence(fixText(p.description), 280))
    if (endsMidWord(fixText(p.description), d)) console.warn(`  ⚠ QA descripción a media palabra: ${p.handle}`)
    if (!/\s[—–-]\s/.test(fullTitle(p))) console.warn(`  ⚠ QA título sin "— Marca": ${p.handle}`)
    if (tagsFor(p, gender).length > 3) console.warn(`  ⚠ QA >3 tags: ${p.handle}`)
    // Tachado SOLO en Outlet: el render muestra compareAt solo si isOutlet, así
    // que esto solo dispararía ante un bug. (compareAt fuera de Outlet NO se pinta.)
    const showsStrike = isOutlet(p) && !!p.compareAt
    if (showsStrike && !isOutlet(p)) console.warn(`  ⚠ QA tachado fuera de Outlet: ${p.handle}`)
  }
}

// ── paso 3: fuentes extra, duotono, y páginas nuevas ──────────────────────
// Fotos del interior de la tienda (metaobjeto store_photo) → separadores.
async function getStorePhotos() {
  const data = await shopify(`{ metaobjects(type:"store_photo", first:20){ edges{ node{ handle fields{ key value reference{ ... on MediaImage { image { url } } } references(first:20){ edges{ node{ ... on MediaImage { image { url } } } } } } } } } }`, {})
  const out = []
  for (const e of data?.metaobjects?.edges ?? []) {
    for (const f of e.node.fields || []) {
      const single = f.reference?.image?.url
      if (single) out.push(single)
      for (const re of f.references?.edges ?? []) if (re.node?.image?.url) out.push(re.node.image.url)
    }
  }
  return [...new Set(out)]
}

// Duotono café para separadores (foto → monocromo cuero).
const duoCache = new Map()
async function prepDuotone(url, w = W.cover) {
  if (!url) return
  const key = `${url}|duo|${w}`
  if (duoCache.has(key)) return
  let out = null
  try {
    const res = await fetch(sizedUrl(url, w), { signal: AbortSignal.timeout(20000) })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      const jpg = await sharp(buf).greyscale().linear(0.82, 6).tint({ r: 0x7A, g: 0x50, b: 0x3A }).jpeg({ quality: 74 }).toBuffer()
      out = "data:image/jpeg;base64," + jpg.toString("base64")
    }
  } catch { out = null }
  duoCache.set(key, out)
}
const duoImg = (url, w = W.cover) => (url ? duoCache.get(`${url}|duo|${w}`) ?? null : null)

// Capítulos en inglés (nombre + copy). El sitio ES es la fuente; aquí traducimos.
const CHAPTER_NAME_EN = { "Exóticas": "Exotic", "Vaqueras": "Western", "Clásicas": "Classic", "Rancho": "Ranch", "Botines": "Booties", "Largas": "Tall" }
const CHAPTER_COPY_EN = {
  "hombre-Exóticas": "Exotic boots for men — ostrich, caiman, python. Collector pieces with CITES certification.",
  "hombre-Vaqueras": "Western boots for men — tall shaft, traditional silhouette. Genuine leather made in León.",
  "hombre-Clásicas": "Classic boots for men — mid shaft, smooth, no engraving. Versatile for everyday and the office.",
  "hombre-Rancho": "Ranch boots for men — built for work and the field. Toughness and comfort.",
  "hombre-Botines": "Ankle boots for men — short shaft, versatile for everyday and casual. Leather made in León.",
  "mujer-Vaqueras": "Western boots for women — tall shaft, traditional silhouette. Genuine leather made in León.",
  "mujer-Largas": "Tall boots for women — over the knee, fashion silhouette. Genuine leather, contemporary cut.",
  "mujer-Exóticas": "Exotic boots for women — ostrich, caiman, python. Collector pieces with CITES certification.",
  "mujer-Clásicas": "Classic boots for women — mid shaft, smooth. Versatile for everyday, office and casual.",
  "mujer-Botines": "Ankle boots for women — short shaft, fashion and casual. Leather made in León.",
}
const chapterName = (chapter, locale) => (locale?.startsWith("en") ? CHAPTER_NAME_EN[chapter] || chapter : chapter)
const chapterCopyL = (gender, chapter, locale) =>
  locale?.startsWith("en") ? (CHAPTER_COPY_EN[`${gender}-${chapter}`] || "") : chapterCopy(gender, chapter)

// Equivalencia de tallas MX → US (aprox. mexicano estándar).
// Talla US por sexo (fabricantes BotasLeón): hombre US = MX − 19, mujer US = MX − 17.
const usFor = (mx, gender) => {
  const n = parseFloat(mx)
  if (!Number.isFinite(n)) return null
  const off = gender === "femenino" || gender === "mujer" ? 17 : gender === "masculino" || gender === "hombre" ? 19 : null
  if (off == null) return null
  const us = n - off
  return us < 1 ? null : Number.isInteger(us) ? String(us) : us.toFixed(1)
}

// ── páginas nuevas ──
function InfoBg({ photo }) {
  const bg = duoImg(photo)
  return [
    bg ? h(Image, { key: "bg", src: bg, style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null,
    h(View, { key: "ov", style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(40,25,18,0.72)" } }),
  ]
}
function HistoriaPage({ tr, photo }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, fontFamily: "Zilla" } },
    ...InfoBg({ photo }),
    h(View, { style: { position: "absolute", top: 76, left: 60, right: 60, bottom: 76, justifyContent: "center" } },
      h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 16 } }, tr.historyEyebrow),
      h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 32, lineHeight: 1.18, marginBottom: 24, maxWidth: 440 } }, tr.historyTitle),
      ...tr.historyParas.map((p, i) => h(Text, { key: i, style: { color: C.cream, fontSize: 12.5, lineHeight: 1.7, marginBottom: 13, maxWidth: 450 } }, p))))
}
function IndexPage({ tr, locale, chapterIndex }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.creamSoft, padding: 60, fontFamily: "Zilla" } },
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 12 } }, tr.indexEyebrow),
    // Zilla Bold (no Bevan): en el doc completo Bevan descarta la "I" pelona de
    // "Index" (bug de subsetting; la "Í" de "Índice" sí sale). Zilla la renderiza.
    h(Text, { style: { color: C.text, fontFamily: "Zilla", fontWeight: 700, fontSize: 34, marginBottom: 30 } }, tr.indexTitle),
    ...chapterIndex.map((c, i) => h(View, { key: i, style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid ${C.border}`, paddingVertical: 10 } },
      h(Text, { style: { color: C.text, fontSize: 13 } }, `${c.genderKey === "mujer" ? tr.women : tr.men} · ${chapterName(c.chapter, locale)}`),
      h(Text, { style: { color: C.brown, fontSize: 13, fontFamily: "Zilla", fontWeight: 700 } }, String(c.page)))))
}

// Reusa la estructura ES para EN: mismos productos/orden/páginas, texto EN por handle.
function relocalizeForEn(plEs, enProducts) {
  const byHandle = new Map(enProducts.map((p) => [p.handle, p]))
  const swap = (p) => byHandle.get(p.handle) || p
  const pages = plEs.pages.map((pg) => {
    const d = { ...pg.data }
    if (d.p) d.p = swap(d.p)
    if (d.pair) d.pair = d.pair.map(swap)
    if (d.items) d.items = d.items.map(swap)
    if (d.chapterIndex) d.chapterIndex = plEs.chapterIndex // el índice se localiza en IndexPage
    return { ...pg, data: d }
  })
  return { pages, chapterIndex: plEs.chapterIndex, counts: plEs.counts }
}
function GenderOpener({ tr, photo, label, dest }) {
  const bg = duoImg(photo)
  return h(Page, { size: "LETTER", wrap: false, style: { backgroundColor: C.leather }, bookmark: { title: label } },
    h(View, { id: dest, style: { width: "100%", height: 792, position: "relative" } },
      bg ? h(Image, { src: bg, style: { width: "100%", height: "100%", objectFit: "cover" } }) : null,
      h(View, { style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(40,25,18,0.42)" } }),
      h(View, { style: { position: "absolute", bottom: 120, left: 0, right: 0, alignItems: "center" } },
        h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 6, marginBottom: 12, fontFamily: "Zilla" } }, tr.collectionLabel),
        h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 52, letterSpacing: 2 } }, label))))
}
function MarcasPage({ tr, photo, brands }) {
  const bg = duoImg(photo)
  return h(Page, { size: "LETTER", style: { backgroundColor: C.creamSoft, fontFamily: "Zilla" } },
    h(View, { style: { height: 210, position: "relative" } },
      bg ? h(Image, { src: bg, style: { width: "100%", height: "100%", objectFit: "cover" } }) : null,
      h(View, { style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(40,25,18,0.55)", justifyContent: "center", paddingLeft: 50 } },
        h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 4, marginBottom: 8 } }, tr.brandsEyebrow),
        h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 34 } }, tr.brandsTitle))),
    h(View, { style: { padding: 46, flexDirection: "row", flexWrap: "wrap" } },
      ...brands.map(([name, n], i) => h(View, { key: i, style: { width: "33.33%", marginBottom: 22, paddingRight: 14 } },
        h(Text, { style: { color: C.text, fontFamily: "Zilla", fontWeight: 700, fontSize: 15 } }, name),
        h(Text, { style: { color: C.brown, fontSize: 10, marginTop: 2 } }, `${n} ${n === 1 ? tr.modelSingular : tr.modelPlural}`)))))
}
function GuiaPage({ tr }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, padding: 60, fontFamily: "Zilla" } },
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 12 } }, tr.guideEyebrow),
    h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 30, marginBottom: 26 } }, tr.guideTitle),
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 3, marginBottom: 12 } }, tr.guidePielesLabel),
    ...tr.pieles.map((x, i) => h(View, { key: "p" + i, style: { marginBottom: 9, maxWidth: 470 } },
      h(Text, { style: { color: C.cream, fontFamily: "Zilla", fontWeight: 700, fontSize: 13 } }, x.name),
      h(Text, { style: { color: C.cream, fontSize: 11, lineHeight: 1.45, opacity: 0.85 } }, x.desc))),
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 3, marginTop: 22, marginBottom: 12 } }, tr.guideHormasLabel),
    ...tr.hormas.map((x, i) => h(View, { key: "h" + i, style: { marginBottom: 7, flexDirection: "row", maxWidth: 470 } },
      h(Text, { style: { color: C.cream, fontFamily: "Zilla", fontWeight: 700, fontSize: 12, width: 90 } }, x.name),
      h(Text, { style: { color: C.cream, fontSize: 11, opacity: 0.85, flex: 1 } }, x.desc))))
}
function TallasPage({ tr, sizes }) {
  // Solo tallas ENTERAS en la guía (las medias son interpolación obvia) → cabe en 1 página.
  const nums = (sizes || []).map(Number).filter((n) => Number.isInteger(n) && n >= 20 && n <= 35).sort((a, b) => a - b)
  const rows = nums.length ? nums : [25, 26, 27, 28, 29, 30]
  const th = (label, w) => h(Text, { style: { width: w, color: C.leather, fontWeight: 700, fontFamily: "Zilla", fontSize: 12 } }, label)
  const td = (label, w) => h(Text, { style: { width: w, color: C.text, fontSize: 12 } }, label)
  return h(Page, { size: "LETTER", style: { backgroundColor: C.creamSoft, padding: 60, fontFamily: "Zilla" } },
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 12 } }, tr.sizesEyebrow),
    h(Text, { style: { color: C.text, fontFamily: "Bevan", fontSize: 28, marginBottom: 16 } }, tr.sizesTitle),
    h(Text, { style: { color: C.muted, fontSize: 11.5, lineHeight: 1.6, marginBottom: 22, maxWidth: 440 } }, tr.sizesIntro),
    h(View, { style: { flexDirection: "row", borderBottom: `2px solid ${C.leather}`, paddingBottom: 6, marginBottom: 4 } },
      th(tr.sizesMx, 110), th(tr.sizesUsMen, 150), th(tr.sizesUsWomen, 150)),
    ...rows.map((n, i) => h(View, { key: i, style: { flexDirection: "row", borderBottom: `1px solid ${C.border}`, paddingVertical: 6 } },
      td(String(n), 110), td(usFor(n, "masculino") ?? "—", 150), td(usFor(n, "femenino") ?? "—", 150))),
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 3, marginTop: 28, marginBottom: 10 } }, tr.careTitle),
    ...tr.careTips.map((t, i) => h(Text, { key: "c" + i, style: { color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 5 } }, `· ${t}`)),
    h(Text, { style: { color: C.subtle, fontSize: 9, marginTop: 20 } }, tr.sizesLink))
}
function AccesoriosPage({ tr, qr }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, padding: 60, justifyContent: "center", fontFamily: "Zilla" } },
    h(Text, { style: { color: C.gold, fontSize: 12, letterSpacing: 5, marginBottom: 14 } }, tr.accEyebrow),
    h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 34, marginBottom: 20 } }, tr.accTitle),
    h(Text, { style: { color: C.cream, fontSize: 13, lineHeight: 1.6, maxWidth: 420, marginBottom: 30 } }, tr.accCopy),
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: 16 } },
      qr ? h(Image, { src: qr, style: { width: 84, height: 84 } }) : null,
      h(Text, { style: { color: C.gold, fontSize: 12, maxWidth: 300 } }, tr.accCta)))
}
function CierrePage({ tr, photo }) {
  return h(Page, { size: "LETTER", style: { backgroundColor: C.leather, fontFamily: "Zilla" } },
    ...InfoBg({ photo }),
    h(View, { style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 60 } },
      h(Logo, { w: 220 }),
      h(Text, { style: { color: C.cream, fontFamily: "Bevan", fontSize: 30, marginTop: 26, textAlign: "center" } }, tr.closingTitle),
      h(Text, { style: { color: C.gold, fontSize: 13, marginTop: 14, textAlign: "center" } }, tr.closingText)))
}

// Mapea la lista de páginas a elementos react-pdf.
function renderPageList(pages, ctx) {
  const { tr, locale, currency, brandLogos, qrMap } = ctx
  return pages.map((pg, i) => {
    const k = "p" + i
    const d = pg.data || {}
    switch (pg.type) {
      case "cover": return h(CoverMenu, { key: k, tr, covers: d.covers || {}, edition: `${tr.editionWord} ${edicion(locale)}` })
      case "historia": return h(HistoriaPage, { key: k, tr, photo: d.photo })
      case "indice": return h(IndexPage, { key: k, tr, locale, chapterIndex: d.chapterIndex || [] })
      case "separator": return h(GenderOpener, { key: k, tr, photo: d.photo, label: d.genderKey === "mujer" ? tr.women : tr.men, dest: d.dest })
      case "portadilla": return h(ChapterTitlePage, { key: k, genderLabel: d.genderKey === "mujer" ? tr.women : tr.men, chapter: chapterName(d.chapter, locale), copy: chapterCopyL(d.genderKey, d.chapter, locale), range: priceRangeStr(d.items || [], currency, locale) })
      case "hero": return h(HeroPage, { key: k, p: d.p, currency, locale, brandLogos, qrMap })
      case "standard": return h(StandardPage, { key: k, p: d.p, chapter: d.chapter, gender: d.genderKey, currency, locale, brandLogos, qrMap })
      case "compact": return h(CompactPage, { key: k, pair: d.pair, currency, locale, brandLogos, qrMap })
      case "marcas": return h(MarcasPage, { key: k, tr, photo: d.photo, brands: d.brands || [] })
      case "guia": return h(GuiaPage, { key: k, tr })
      case "tallas": return h(TallasPage, { key: k, tr, sizes: d.sizes })
      case "accesorios": return h(AccesoriosPage, { key: k, tr, qr: d.qr })
      case "cierre": return h(CierrePage, { key: k, tr, photo: d.photo })
      case "contra": return h(BackCover, { key: k, tr })
      default: return null
    }
  }).filter(Boolean)
}

// QA del build: condiciones que FALLAN o AVISAN.
function runQa(pl, label, sitemapHandles) {
  const fails = []
  const prodPages = pl.pages.flatMap((pg) =>
    pg.type === "hero" || pg.type === "standard" ? [{ p: pg.data.p, gender: pg.data.genderKey }]
    : pg.type === "compact" ? pg.data.pair.map((x) => ({ p: x, gender: pg.data.genderKey })) : [])
  for (const { p, gender } of prodPages) {
    const d = fixText(truncateSentence(fixText(p.description), 280))
    if (endsMidWord(fixText(p.description), d)) fails.push(`descripción a media palabra: ${p.handle}`)
    if (!/\s[—–-]\s/.test(fullTitle(p))) fails.push(`título sin "— Marca": ${p.handle}`)
    if (tagsFor(p, gender).length > 3) fails.push(`>3 tags: ${p.handle}`)
    // tachado fuera de Outlet: el render solo pinta compareAt si isOutlet → estructural.
  }
  const heroPages = pl.pages.filter((pg) => pg.type === "hero").map((pg) => pg.n)
  for (let i = 1; i < heroPages.length; i++) if (heroPages[i] - heroPages[i - 1] < 6) fails.push(`dos héroes a <6 págs: p.${heroPages[i - 1]} y p.${heroPages[i]}`)
  for (const c of pl.chapterIndex) { const pg = pl.pages[c.page - 1]; if (!pg || pg.type !== "portadilla") fails.push(`índice desincronizado: ${c.name} → p.${c.page}`) }
  // producto en PDF que no está en el sitemap (o viceversa) → AVISA.
  if (sitemapHandles && sitemapHandles.size) {
    const inPdf = new Set(prodPages.map((x) => x.p.handle))
    for (const h of inPdf) if (!sitemapHandles.has(h)) WARN.push(`en PDF pero no en sitemap: ${h}`)
    for (const h of sitemapHandles) if (!inPdf.has(h)) WARN.push(`en sitemap pero no en PDF: ${h}`)
  }
  if (fails.length) { console.warn(`[catalog] ❌ QA ${label} FALLÓ (${fails.length}):`); for (const f of fails) console.warn(`   ❌ ${f}`) }
  else console.log(`[catalog] ✅ QA ${label} OK`)
  return fails
}

// ── main ─────────────────────────────────────────────────────────────────
async function main() {
  // Modo muestra: renderiza un capítulo con las 3 plantillas y sale.
  //   node scripts/generate-catalog.mjs --sample [mujer] [Vaqueras]
  if (process.argv.includes("--sample")) {
    const gi = process.argv.indexOf("--sample")
    const gender = process.argv[gi + 1] && !process.argv[gi + 1].startsWith("--") ? process.argv[gi + 1] : "hombre"
    const chapter = process.argv[gi + 2] && !process.argv[gi + 2].startsWith("--") ? process.argv[gi + 2] : "Exóticas"
    const esData = await shopify(PRODUCTS_QUERY, { first: 250, country: "MX", language: "ES" })
    if (!esData?.products?.edges?.length) { console.error("[sample] sin productos"); return }
    await renderSampleChapter(esData, gender, chapter)
    return
  }
  // Modo flatplan: clasifica + ordena + planea, IMPRIME el flatplan y sale
  // (no renderiza). node scripts/generate-catalog.mjs --flatplan
  if (process.argv.includes("--flatplan")) {
    const esData = await shopify(PRODUCTS_QUERY, { first: 250, country: "MX", language: "ES" })
    if (!esData?.products?.edges?.length) { console.error("[flatplan] sin productos"); return }
    printFlatplan(buildFlatplan(esData))
    // Diagnóstico: ¿por qué se vacían capítulos? distribución de datos reales.
    const all = (esData.products.edges).map((e) => mapProduct(e.node))
    for (const [g, key] of [["HOMBRE", "masculino"], ["MUJER", "femenino"]]) {
      const prods = all.filter((p) => p.genders.includes(key))
      const byType = {}, byStyle = {}, noMarca = []
      for (const p of prods) {
        byType[p.productType || "(vacío)"] = (byType[p.productType || "(vacío)"] || 0) + 1
        const labels = [...chapterLabels(p)]
        const kk = labels.length ? labels.join("+") : "(sin estilo)"
        byStyle[kk] = (byStyle[kk] || 0) + 1
        if (!/\s[—–-]\s/.test(p.title)) noMarca.push(p.title)
        // muestra los handles crudos de boot-style de los primeros
      }
      console.log(`\n[${g}] productType:`, JSON.stringify(byType))
      console.log(`[${g}] estilo canónico (chapterLabels):`, JSON.stringify(byStyle))
      console.log(`[${g}] boot-style handles crudos (muestra):`, prods.slice(0, 6).map((p) => `${titleName(p).slice(0, 18)}=[${(p.styleItems || []).map((s) => s.handle).join(",")}]`).join(" | "))
      console.log(`[${g}] SIN "— Marca" (${noMarca.length}):`, noMarca.slice(0, 12).join(" | "))
    }
    return
  }
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
  const [brandLogos, covers, storePhotos] = await Promise.all([getBrandLogos(), getCovers(), getStorePhotos()])
  LOGO_WHITE = await loadWhiteLogo()
  console.log(`[catalog] logo blanco: ${LOGO_WHITE ? "OK" : "no"} · fotos tienda: ${storePhotos.length}`)

  const src = es || en
  // Page list ES define la estructura (héroes, capítulos) — misma para EN.
  const plEs = buildPageList({ hombre: src.hombre, mujer: src.mujer, covers, storePhotos, tr: STR.es, currency: "MXN", locale: "es-MX" })
  const heroHandles = new Set(plEs.pages.filter((pg) => pg.type === "hero").map((pg) => pg.data.p.handle))

  // Imágenes: 4 por producto + héroe lateral a W.cover + logos de marca.
  const jobs = []
  for (const p of [...src.hombre, ...src.mujer]) {
    for (const u of p.images.slice(0, 4)) jobs.push({ url: u, w: W.photo })
    if (heroHandles.has(p.handle)) jobs.push({ url: p.images[0], w: W.cover })
  }
  for (const logo of brandLogos.values()) jobs.push({ url: logo, w: W.logo })
  jobs.push({ url: covers.hombre, w: W.cover }, { url: covers.mujer, w: W.cover }) // mosaicos de portada
  await prepareImages(jobs)
  // Duotono de portadas de género + 3 fotos de tienda (separadores).
  await Promise.all([covers.hombre, covers.mujer, ...storePhotos.slice(0, 3)].map((u) => prepDuotone(u)))
  // Crops de textura (4ª imagen) + detalle de héroes.
  const cropUrls = new Set()
  for (const pg of plEs.pages) {
    if (pg.type === "standard" && needsToeCrop(pg.data.chapter, pg.data.p)) cropUrls.add(pg.data.p.images[0])
    if (pg.type === "hero") cropUrls.add(pg.data.p.images[0])
  }
  await Promise.all([...cropUrls].map((u) => cropToeDetail(u)))

  // QR por idioma (UTM) + QR de accesorios.
  const qrEs = new Map(), qrEn = new Map()
  await Promise.all([...src.hombre, ...src.mujer].flatMap((p) => [
    qr(qrCampaignUrl(p.handle, "es")).then((v) => qrEs.set(p.handle, v)),
    qr(qrCampaignUrl(p.handle, "en")).then((v) => qrEn.set(p.handle, v)),
  ]))
  const accQr = { es: await qr(`${SITE}/es/accesorios?utm_source=catalogo&utm_medium=qr&utm_campaign=catalogo-${EDITION_YEAR}`), en: await qr(`${SITE}/en/accesorios?utm_source=catalogo&utm_medium=qr&utm_campaign=catalogo-${EDITION_YEAR}`) }
  const sitemapHandles = new Set([...src.hombre, ...src.mujer].map((p) => p.handle))

  await mkdir(join(ROOT, "public"), { recursive: true })
  const injectAcc = (pl, q) => { const a = pl.pages.find((pg) => pg.type === "accesorios"); if (a) a.data.qr = q; return pl }
  if (es) {
    injectAcc(plEs, accQr.es)
    const doc = h(Document, { title: STR.es.docTitle, author: "BotasLeón" }, ...renderPageList(plEs.pages, { tr: STR.es, locale: "es-MX", currency: "MXN", brandLogos, qrMap: qrEs }))
    await pdfPkg.renderToFile(doc, join(ROOT, "public", "catalogo-es.pdf"))
    console.log(`[catalog] catalogo-es.pdf: ${plEs.pages.length} páginas`)
    runQa(plEs, "ES", sitemapHandles)
  }
  if (en) {
    // MISMA estructura que ES (mismos productos/orden/páginas); solo cambia el texto.
    const plEn = injectAcc(relocalizeForEn(plEs, [...en.hombre, ...en.mujer]), accQr.en)
    const doc = h(Document, { title: STR.en.docTitle, author: "BotasLeón" }, ...renderPageList(plEn.pages, { tr: STR.en, locale: "en-US", currency: "USD", brandLogos, qrMap: qrEn }))
    await pdfPkg.renderToFile(doc, join(ROOT, "public", "catalogo-en.pdf"))
    console.log(`[catalog] catalogo-en.pdf: ${plEn.pages.length} páginas`)
  }
  if (WARN.length) { console.log(`[catalog] ⚠ avisos (${WARN.length}):`); for (const w of WARN) console.log(`   ⚠ ${w}`) }

  // Visor HTML (móvil): páginas del PDF como imágenes → abre en TODOS los navegadores.
  if (await hasPdftoppm()) {
    for (const [lang, data] of [["es", es], ["en", en]]) {
      if (!data) continue
      const count = await pdfToWebp(join(ROOT, "public", `catalogo-${lang}.pdf`), join(ROOT, "public", "catalogo", lang))
      const html = viewerHtml({
        lang, tr: STR[lang], count,
        hombreDivider: 2, mujerDivider: 2 + data.hombre.length + 1,
        pdfHref: `/catalogo-${lang}.pdf`,
      })
      await writeFile(join(ROOT, "public", `catalogo-${lang}.html`), html)
      console.log(`[catalog] catalogo-${lang}.html: ${count} páginas`)
    }
  } else {
    console.warn("[catalog] pdftoppm (poppler) no encontrado → omito el visor HTML (instala con `brew install poppler`)")
  }

  console.log(`[catalog] listo en ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error("[catalog] error no fatal, el build continúa:", err?.message || err)
  process.exit(0)
})
