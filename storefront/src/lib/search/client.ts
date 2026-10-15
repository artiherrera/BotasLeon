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

import { inContext } from "@/lib/market"
import {
  GET_PRODUCTS_DETAIL_BY_QUERY,
  GET_PRODUCTS_QUERY,
  IMAGE_FRAGMENT,
  MONEY_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
} from "@/lib/shopify/queries"

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
  variants(first: 1) { edges { node { id availableForSale } } }
`

/**
 * Shopify devuelve `variants` como CONEXIÓN (`{ edges: [{ node }] }`), pero el
 * tipo Product la declara como arreglo plano y de ahí saca ProductCard el
 * variantId para el botón de agregar. Sin aplanar, `product.variants[0]` salía
 * undefined y el buscador pintaba 24 tarjetas SIN botón — el mismo tropiezo que
 * ya se había corregido del lado servidor en lib/shopify/index.ts.
 */
type NodoCrudo = Omit<Product, "variants"> & {
  variants?: { edges: Array<{ node: Product["variants"][number] }> }
}

function aplanarVariantes(node: NodoCrudo): Product {
  const { variants, ...resto } = node
  return {
    ...resto,
    variants: Array.isArray(variants)
      ? variants
      : variants?.edges?.map((e) => e.node) ?? [],
  } as Product
}

// Con `lang` fija el idioma vía @inContext (p.ej. el cotizador siempre en ES,
// sin importar el idioma del navegador). Sin `lang`, Shopify usa el
// Accept-Language del navegador (comportamiento de la búsqueda del sitio).
const catalogQuery = (lang?: "ES" | "EN") => /* GraphQL */ `
  query SearchCatalog($first: Int!) ${inContext(lang)} {
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
  return json.data.products.edges.map((e: { node: NodoCrudo }) =>
    aplanarVariantes(e.node)
  )
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
    $reverse: Boolean
  ) ${inContext()} {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
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
          variants(first: 1) { edges { node { id availableForSale } } }
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

/**
 * Los productos de una consulta de Shopify, con todas sus variantes.
 *
 * Recibe la consulta tal cual de Shopify ("product_type:Cinturones",
 * "tag:promo-cinto"). Ojo: `handle:` NO existe como filtro —para eso están los
 * alias de loadProductsByHandles—, pero `tag:` y `product_type:` sí.
 *
 * Se guarda en memoria: el cajón del carrito se abre muchas veces por visita y
 * los cinco cintos no cambian entre una apertura y otra.
 *
 * CON TODAS LAS VARIANTES, no con la consulta de tarjeta. El fragmento de
 * tarjeta trae `variants(first: 1)` —a las tarjetas les basta, porque 101 de
 * 103 botas son de variante única— pero un cinto tiene siete medidas en siete
 * variantes. Con una sola, elegir la 36 no encontraba su variante y el botón
 * de agregar no hacía NADA, en silencio. Medido en el navegador antes de
 * publicarlo. Son cinco productos: el peso extra no se nota.
 */
const porEtiqueta = new Map<string, Promise<Product[]>>()

export function loadProductsByQuery(consulta: string, first = 12): Promise<Product[]> {
  const enMemoria = porEtiqueta.get(consulta)
  if (enMemoria) return enMemoria
  const promesa = (async () => {
    if (!DOMAIN || !TOKEN) return []
    const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: GET_PRODUCTS_DETAIL_BY_QUERY,
        variables: { first, query: consulta },
      }),
    })
    if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)
    const json = await res.json()
    if (json.errors?.length) {
      throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
    }
    return (json.data.products.edges as Array<{ node: NodoCrudo }>).map((e) =>
      aplanarTarjeta(e.node)
    )
  })().catch(() => {
    // Que un fallo no deje la memoria envenenada para toda la sesión.
    porEtiqueta.delete(consulta)
    return [] as Product[]
  })
  porEtiqueta.set(consulta, promesa)
  return promesa
}

/**
 * Los productos de una lista de handles, con TODO lo que pinta una tarjeta:
 * marca, fotos, precio, precio de comparación, insignias, reseñas y sexo.
 *
 * Lo pide "Sigue donde te quedaste", que solo guarda handles en el navegador.
 * Se consulta a Shopify EN VIVO en vez de guardar el precio en localStorage:
 * un precio guardado se queda viejo, y enseñar un precio que no es sale mucho
 * más caro que una petición. Si una bota se borró de la tienda, no vuelve en
 * la respuesta y deja de aparecer en la tira, que es lo correcto.
 *
 * SE PIDE UNO POR UNO, CON ALIAS, no con `query: "handle:a OR handle:b"`. Ese
 * filtro NO existe en la Storefront API: lo acepta sin protestar y devuelve el
 * catálogo entero, así que la tira habría enseñado botas al azar en vez de las
 * que la persona vio. Medido contra la API el 2026-10-13 — devolvió cinco
 * botas, ninguna de las dos pedidas. Con alias cada bota es exacta y el orden
 * lo ponemos nosotros.
 */
export async function loadProductsByHandles(handles: string[]): Promise<Product[]> {
  // Vienen de localStorage, que cualquiera puede editar: solo minúsculas,
  // números y guiones, y un tope sano. Van como VARIABLES de GraphQL, no
  // interpoladas en el texto de la consulta.
  const limpios = handles
    .filter((h) => /^[a-z0-9-]{1,120}$/.test(h))
    .slice(0, 12)
  if (!DOMAIN || !TOKEN || limpios.length === 0) return []

  const firma = limpios.map((_, i) => `$h${i}: String!`).join(", ")
  const cuerpo = limpios
    .map((_, i) => `p${i}: product(handle: $h${i}) { ...ProductCardFields }`)
    .join("\n    ")
  const query = /* GraphQL */ `
    query PorHandles(${firma}) ${inContext("ES")} {
      ${cuerpo}
    }
    ${IMAGE_FRAGMENT}
    ${MONEY_FRAGMENT}
    ${PRODUCT_CARD_FRAGMENT}
  `
  const variables = Object.fromEntries(limpios.map((h, i) => [`h${i}`, h]))

  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }

  // En el orden en que se pidieron, y sin los nulos (botas borradas).
  return limpios
    .map((_, i) => json.data?.[`p${i}`] as NodoCrudo | null)
    .filter((n): n is NodoCrudo => !!n)
    .map(aplanarTarjeta)
}

/** Como aplanarVariantes, pero también con las fotos de la galería. */
function aplanarTarjeta(node: NodoCrudo): Product {
  const plano = aplanarVariantes(node)
  const crudas = (node as unknown as { images?: { edges?: Array<{ node: unknown }> } }).images
  return {
    ...plano,
    images: Array.isArray(crudas) ? crudas : (crudas?.edges?.map((e) => e.node) ?? []),
  } as Product
}

export async function loadMoreProducts({
  after,
  first = 24,
  sortKey = "BEST_SELLING",
  reverse = false,
}: {
  after: string | null
  first?: number
  sortKey?: string
  /** CREATED_AT sin esto devuelve las botas MÁS VIEJAS primero. */
  reverse?: boolean
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
      variables: { first, after, sortKey, reverse },
    }),
  })

  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }

  return {
    products: json.data.products.edges.map((e: { node: NodoCrudo }) =>
      aplanarVariantes(e.node)
    ),
    pageInfo: json.data.products.pageInfo as PageInfo,
  }
}
