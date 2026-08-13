/**
 * Búsqueda de productos del lado del cliente.
 *
 * Corre en el navegador (igual que cart). Usa NEXT_PUBLIC_* env vars.
 *
 * NO usamos la búsqueda nativa de Shopify (products query:) porque es SENSIBLE
 * A ACENTOS ("clásica" ≠ "clasica"). En su lugar traemos el catálogo una vez
 * (memoizado) y filtramos localmente plegando acentos + minúsculas. Ver
 * searchProducts abajo. Todo client-side también evita volver /search dinámica
 * → Amplify Hosting da 500 en rutas dinámicas. Ver [memory: amplify-hosting-quirks]
 */

import type { Product, PageInfo } from "@/lib/shopify/types"

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

// Catálogo completo para BÚSQUEDA LOCAL. La búsqueda nativa de Shopify
// (products query:) es SENSIBLE A ACENTOS ("clásica" ≠ "clasica") y no siempre
// pega en la descripción. Con un catálogo chico traemos todo UNA vez (memoizado)
// y filtramos en el navegador plegando acentos + minúsculas, sobre título,
// marca, tipo, tags y descripción. Da control total y búsqueda acento-insensible.
const CATALOG_FIELDS = /* GraphQL */ `
  id
  handle
  title
  description
  vendor
  productType
  tags
  availableForSale
  createdAt
  featuredImage { url altText width height }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  options { id name values }
`

// Con `lang` fija el idioma vía @inContext (p.ej. el cotizador siempre en ES,
// sin importar el idioma del navegador). Sin `lang`, Shopify usa el
// Accept-Language del navegador (comportamiento de la búsqueda del sitio).
const catalogQuery = (lang?: "ES" | "EN") => /* GraphQL */ `
  query SearchCatalog($first: Int!) @inContext(country: US${lang ? `, language: ${lang}` : ""}) {
    products(first: $first) {
      edges { node { ${CATALOG_FIELDS} } }
      pageInfo { hasNextPage }
    }
  }
`

/** Quita acentos/diacríticos y pasa a minúsculas — "Clásica" → "clasica". */
function fold(s: string): string {
  return (s || "")
    .normalize("NFD") // separa base + diacrítico (á → a + ́)
    .replace(/[\u0300-\u036f]/g, "") // borra los diacríticos combinantes
    .toLowerCase()
}

// Memoiza el catálogo por sesión de página. Se resetea si la carga falla, para
// permitir reintento en la siguiente búsqueda. 250 es el máximo por página de la
// Storefront API; el catálogo actual (~72) cabe de sobra.
// Caché por idioma ("" = idioma del navegador; "ES"/"EN" = forzado).
const catalogCache = new Map<string, Promise<Product[]>>()

async function fetchCatalog(lang?: "ES" | "EN"): Promise<Product[]> {
  if (!DOMAIN || !TOKEN) {
    throw new Error("Faltan NEXT_PUBLIC_SHOPIFY env vars")
  }
  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query: catalogQuery(lang), variables: { first: 250 } }),
  })
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }
  if (json.data.products.pageInfo?.hasNextPage) {
    console.warn("[search] catálogo >250: la búsqueda local solo cubre los primeros 250")
  }
  return json.data.products.edges.map((e: { node: Product }) => e.node)
}

function getSearchCatalog(lang?: "ES" | "EN"): Promise<Product[]> {
  const key = lang ?? ""
  let p = catalogCache.get(key)
  if (!p) {
    p = fetchCatalog(lang).catch((e) => {
      catalogCache.delete(key) // permite reintentar
      throw e
    })
    catalogCache.set(key, p)
  }
  return p
}

/**
 * Búsqueda local acento-insensible. Filtra productos donde TODAS las palabras
 * del término aparecen (plegadas) en título/marca/tipo/tags/descripción, y
 * rankea priorizando coincidencias en título y marca.
 */
export async function searchProducts(
  query: string,
  first = 24,
  lang?: "ES" | "EN"
): Promise<Product[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const catalog = await getSearchCatalog(lang)
  const qFull = fold(trimmed).replace(/\s+/g, " ").trim()
  const words = qFull.split(" ").filter(Boolean)
  if (words.length === 0) return []

  const scored: Array<{ p: Product; score: number }> = []
  for (const p of catalog) {
    const titleF = fold(p.title)
    const vendorF = fold(p.vendor)
    const typeF = fold(p.productType)
    const tagsF = fold((p.tags || []).join(" "))
    const descF = fold(p.description || "")
    const hay = `${titleF} ${vendorF} ${typeF} ${tagsF} ${descF}`

    // AND: todas las palabras deben aparecer en algún campo.
    if (!words.every((w) => hay.includes(w))) continue

    let score = 0
    if (titleF.includes(qFull)) score += 1000 // frase completa en el título
    if (titleF.startsWith(words[0])) score += 200
    for (const w of words) {
      if (titleF.includes(w)) score += 40
      else if (vendorF.includes(w)) score += 25
      else if (typeF.includes(w)) score += 15
      else if (tagsF.includes(w)) score += 8
      else score += 2 // solo en descripción
    }
    scored.push({ p, score })
  }

  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : (b.p.createdAt || "").localeCompare(a.p.createdAt || "")
  )

  return scored.slice(0, first).map((s) => s.p)
}

// === Cursor pagination — usado por /products "Cargar más" ===
//
// Mismo patrón que searchProducts: fetch directo a Shopify desde el browser
// para evitar volver dinámica la ruta (Amplify Hosting → 500 en rutas
// dinámicas). El primer batch viene SSG; este pide el siguiente con cursor.
//
// Mantenemos el mismo fragment del CARD que usa el listing principal para
// que las cards renderizadas client-side luzcan idénticas a las SSG.
const LOAD_MORE_QUERY = /* GraphQL */ `
  query LoadMoreProducts(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
  ) @inContext(country: US) {
    products(first: $first, after: $after, sortKey: $sortKey) {
      edges {
        node {
          id
          handle
          title
          vendor
          productType
          tags
          availableForSale
          createdAt
          featuredImage { url altText width height }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          options { id name values }
          color: metafield(namespace: "shopify", key: "color-pattern") {
            references(first: 5) {
              edges { node { ... on Metaobject { handle fields { key value } } } }
            }
          }
          material: metafield(namespace: "shopify", key: "footwear-material") {
            references(first: 5) {
              edges { node { ... on Metaobject { handle fields { key value } } } }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export async function loadMoreProducts({
  after,
  first = 24,
  sortKey = "BEST_SELLING",
}: {
  after: string | null
  first?: number
  sortKey?: string
}): Promise<{ products: Product[]; pageInfo: PageInfo }> {
  if (!DOMAIN || !TOKEN) {
    throw new Error("Faltan NEXT_PUBLIC_SHOPIFY env vars")
  }

  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: LOAD_MORE_QUERY,
      variables: { first, after, sortKey },
    }),
  })

  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }

  return {
    products: json.data.products.edges.map((e: { node: Product }) => e.node),
    pageInfo: json.data.products.pageInfo as PageInfo,
  }
}
