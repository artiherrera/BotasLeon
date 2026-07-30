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
        priceRange { minVariantPrice { amount currencyCode } }
        compareAtPriceRange { minVariantPrice { amount currencyCode } }
        gender: metafield(namespace: "shopify", key: "target-gender") {
          references(first: 5) { edges { node { ... on Metaobject { handle } } } }
        }
        material: metafield(namespace: "shopify", key: "footwear-material") {
          references(first: 5) { edges { node { ... on Metaobject { fields { key value } } } } }
        }
        toe: metafield(namespace: "shopify", key: "toe-style") {
          references(first: 5) { edges { node { ... on Metaobject { fields { key value } } } } }
        }
        style: metafield(namespace: "shopify", key: "boot-style") {
          references(first: 5) { edges { node { ... on Metaobject { fields { key value } } } } }
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
function mapProduct(node) {
  const imgs = []
  if (node.featuredImage?.url) imgs.push(node.featuredImage.url)
  for (const e of node.images?.edges ?? []) if (e.node?.url && !imgs.includes(e.node.url)) imgs.push(e.node.url)
  const price = node.priceRange?.minVariantPrice ?? null
  const ca = node.compareAtPriceRange?.minVariantPrice
  const compareAt = ca && parseFloat(ca.amount) > parseFloat(price?.amount ?? "0") ? ca : null
  return {
    handle: node.handle, title: node.title, vendor: node.vendor || "",
    description: stripHtml(node.description).slice(0, 480),
    images: imgs.slice(0, 6),
    price, compareAt,
    material: refLabels(node.material),
    horma: refLabels(node.toe),
    styles: refLabels(node.style),
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
function CoverMenu({ tr, covers }) {
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
      h(Text, { style: { color: C.cream, fontSize: 13, marginTop: 6 } }, tr.coverTitle)),
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
  es: { coverEyebrow: "CATÁLOGO", coverTitle: "Botas hechas en León, Guanajuato", men: "HOMBRE", women: "MUJER", tapToSee: "TOCA PARA VER", buy: "Comprar →", shopOnline: "Compra en línea · Envío a todo México", madeIn: "Hecho con orgullo en México", docTitle: "Catálogo BotasLeón", pageAlt: "Página", downloadPdf: "Descargar PDF", backToStore: "Ir a la tienda", langHref: "/catalogo-en.html", langLabel: "EN", htmlLang: "es" },
  en: { coverEyebrow: "CATALOG", coverTitle: "Boots handcrafted in León, Mexico", men: "MEN", women: "WOMEN", tapToSee: "TAP TO VIEW", buy: "Shop →", shopOnline: "Shop online · Shipped across the USA", madeIn: "Proudly made in Mexico", docTitle: "BotasLeón Catalog", pageAlt: "Page", downloadPdf: "Download PDF", backToStore: "Go to store", langHref: "/catalogo-es.html", langLabel: "ES", htmlLang: "en" },
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
  LOGO_WHITE = await loadWhiteLogo()
  console.log(`[catalog] logo BotasLeón (blanco): ${LOGO_WHITE ? "OK" : "no encontrado → wordmark"}`)

  // Reunir TODAS las imágenes (compartidas entre ES/EN) y procesarlas 1 vez.
  const src = es || en
  const jobs = []
  for (const p of [...src.hombre, ...src.mujer]) {
    for (const u of p.images) jobs.push({ url: u, w: W.photo })
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
