/**
 * Capa de acceso a datos sobre Shopify Storefront API.
 *
 * Estas funciones son las que llaman los componentes/server actions.
 * Encapsulan: query GraphQL + extracción del shape relevante (los
 * conectores de GraphQL devuelven todo en `.edges[].node` que es ruido).
 */

import { shopifyFetch } from "./client"
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_PRODUCTS_WITH_TAXONOMY_QUERY,
  GET_HERO_SLIDES_QUERY,
  GET_BRANDS_QUERY,
  SHOP_INFO_QUERY,
} from "./queries"
import type { Product, Collection, HeroSlide, Image, Brand, PageInfo } from "./types"

type Edge<T> = { edges: Array<{ node: T }> }
type Connection<T> = Edge<T> & { pageInfo: PageInfo }

export type ProductSortKey =
  | "TITLE"
  | "PRICE"
  | "BEST_SELLING"
  | "CREATED_AT"
  | "UPDATED_AT"
  | "RELEVANCE"

// === Productos ===

// Cursor pagination — devuelve el batch + pageInfo para que el caller
// pueda hacer "Cargar más" pasando endCursor como `after`. Los callers
// que solo necesitan el array destructuran `{ products }`.
export async function getProducts(opts?: {
  first?: number
  after?: string | null
  query?: string
  sortKey?: ProductSortKey
}): Promise<{ products: Product[]; pageInfo: PageInfo }> {
  type Resp = { products: Connection<Product> }
  const data = await shopifyFetch<Resp>(
    GET_PRODUCTS_QUERY,
    {
      first: opts?.first ?? 24,
      after: opts?.after ?? null,
      query: opts?.query,
      sortKey: opts?.sortKey ?? "BEST_SELLING",
    },
    { tags: ["products"] }
  )
  return {
    products: data.products.edges.map((e) => e.node),
    pageInfo: data.products.pageInfo,
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  type Resp = {
    product:
      | (Omit<Product, "images" | "variants"> & {
          images: Edge<Product["images"][number]>
          variants: Edge<Product["variants"][number]>
        })
      | null
  }
  const data = await shopifyFetch<Resp>(
    GET_PRODUCT_BY_HANDLE_QUERY,
    { handle },
    { tags: [`product-${handle}`] }
  )
  if (!data.product) return null
  const p = data.product
  return {
    ...p,
    images: p.images.edges.map((e) => e.node),
    variants: p.variants.edges.map((e) => e.node),
  }
}

// === Collections ===

export async function getCollections(first = 20): Promise<Collection[]> {
  type Resp = { collections: Edge<Collection> }
  const data = await shopifyFetch<Resp>(
    GET_COLLECTIONS_QUERY,
    { first },
    { tags: ["collections"] }
  )
  return data.collections.edges.map((e) => e.node)
}

export type CollectionWithProducts = Collection & {
  products: Product[]
}

// Devuelve la colección con sus productos, o null si la colección no
// existe en Shopify. El caller decide qué mostrar (lista de productos
// si hay, empty state con instrucciones si no).
export async function getCollectionByHandle(
  handle: string,
  first = 48
): Promise<CollectionWithProducts | null> {
  type Resp = {
    collection: (Omit<Collection, never> & {
      products: Edge<Product>
    }) | null
  }
  try {
    const data = await shopifyFetch<Resp>(
      GET_COLLECTION_BY_HANDLE_QUERY,
      { handle, first },
      { tags: [`collection-${handle}`] }
    )
    if (!data.collection) return null
    return {
      ...data.collection,
      products: data.collection.products.edges.map((e) => e.node),
    }
  } catch (e) {
    console.error(`[getCollectionByHandle] handle=${handle}:`, e instanceof Error ? e.message : e)
    return null
  }
}

// === Brands (Metaobjects) ===

export async function getBrands(): Promise<Brand[]> {
  type RawNode = {
    id: string
    handle: string
    fields: Array<{
      key: string
      value: string | null
      reference: { image: Image | null } | null
    }>
  }
  type Resp = { metaobjects: Edge<RawNode> | null }
  let data: Resp
  try {
    data = await shopifyFetch<Resp>(
      GET_BRANDS_QUERY,
      undefined,
      { revalidate: 60 }
    )
  } catch (e) {
    console.error("[getBrands] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const nodes = data.metaobjects?.edges?.map((e) => e.node) ?? []
  console.log(`[getBrands] nodes recibidos: ${nodes.length}`)

  const brands = nodes.map((node, idx) => {
    const fieldMap = new Map(node.fields.map((f) => [f.key, f] as const))
    const get = (key: string) => fieldMap.get(key)?.value ?? ""
    const logo = fieldMap.get("logo")?.reference?.image ?? null

    const brand: Brand = {
      id: node.id,
      handle: node.handle,
      name: get("name"),
      tagline: get("tagline"),
      logo,
    }
    return { brand, sortOrder: Number(get("sort_order")) || idx, active: get("is_active") !== "false" }
  })

  return brands
    .filter((b) => b.active && b.brand.name)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => b.brand)
}

// Productos de una marca específica — filtramos por vendor.
// Vendor con espacios o caracteres especiales necesita escape;
// quoting siempre es seguro.
export async function getProductsByVendor(
  vendor: string,
  first = 48
): Promise<Product[]> {
  const escaped = vendor.replace(/"/g, '\\"')
  const { products } = await getProducts({ first, query: `vendor:"${escaped}"` })
  return products
}

// === Products por taxonomy (gender, age-group) ===
//
// Filtra productos por el handle del metaobject referenciado en los
// metafields shopify.target-gender y shopify.age-group. Esto evita
// que el admin tenga que crear colecciones manuales para cada categoría.
//
// Handles esperados (Shopify localiza al idioma de la tienda):
//   target-gender: "femenino", "masculino", "unisex"
//   age-group: "adultos", "ninos" (o "kids" según idioma)

type TaxonomyKey = "gender" | "age"

export async function getProductsByTaxonomy(
  key: TaxonomyKey,
  handle: string,
  first = 48
): Promise<Product[]> {
  type ProductWithTaxonomy = Product & {
    gender?: { references?: { edges: Array<{ node: { handle: string } }> } } | null
    age?: { references?: { edges: Array<{ node: { handle: string } }> } } | null
  }
  type Resp = { products: Edge<ProductWithTaxonomy> }

  let data: Resp
  try {
    data = await shopifyFetch<Resp>(
      GET_PRODUCTS_WITH_TAXONOMY_QUERY,
      { first },
      { tags: ["products"] }
    )
  } catch (e) {
    console.error("[getProductsByTaxonomy] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const all = data.products.edges.map((e) => e.node)
  return all.filter((p) => {
    const refs = p[key]?.references?.edges ?? []
    return refs.some((r) => r.node.handle === handle)
  })
}

// === Hero slides (Metaobjects) ===

// Lista cíclica de gradients de fallback — se asigna por índice cuando
// el slide no trae imagen, para que la home no quede en blanco mientras
// el admin sube los assets.
const HERO_FALLBACK_GRADIENTS = [
  "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  "bg-gradient-to-br from-cognac via-gold to-leather-light",
]

// Convierte el valor del field "link_url" en un href usable por Next <Link>.
// Shopify maneja dos tipos:
//   - "Enlace" (Link): guarda como JSON `{"text":"...","url":"..."}` con URL absoluta
//   - "URL" o "Single line text": string plano
// Además, si la URL es absoluta apuntando a nuestro dominio, extraemos solo
// el pathname — así cuando movamos a custom domain las entries no se rompen.
function parseHrefFromLinkField(value: string): string {
  if (!value) return ""
  let urlString = value
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed.url === "string") urlString = parsed.url
  } catch {
    // value es string plano, no JSON
  }
  try {
    const u = new URL(urlString)
    return u.pathname + u.search + u.hash
  } catch {
    // urlString ya es path relativo (sin protocolo)
    return urlString
  }
}

type MetaobjectField = {
  key: string
  value: string | null
  reference: { image: Image | null } | null
}

type MetaobjectNode = {
  id: string
  handle: string
  fields: MetaobjectField[]
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  type Resp = { metaobjects: Edge<MetaobjectNode> | null }
  // Revalida cada 60s — suficiente para que cambios en admin lleguen
  // pronto sin tirar full no-store (que vuelve la home dinámica).
  let data: Resp
  try {
    data = await shopifyFetch<Resp>(
      GET_HERO_SLIDES_QUERY,
      undefined,
      { revalidate: 60 }
    )
  } catch (e) {
    // Logging visible en Amplify build logs para diagnóstico.
    console.error("[getHeroSlides] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const nodes = data.metaobjects?.edges?.map((e) => e.node) ?? []
  console.log(`[getHeroSlides] nodes recibidos: ${nodes.length}`)

  const slides = nodes.map((node, idx) => {
    const fieldMap = new Map(node.fields.map((f) => [f.key, f] as const))
    const get = (key: string) => fieldMap.get(key)?.value ?? ""
    const image = fieldMap.get("image")?.reference?.image ?? null

    const slide: HeroSlide = {
      id: node.id,
      handle: node.handle,
      eyebrow: get("eyebrow"),
      title: get("title"),
      href: parseHrefFromLinkField(get("link_url")) || "/products",
      image,
      bgClass: HERO_FALLBACK_GRADIENTS[idx % HERO_FALLBACK_GRADIENTS.length],
    }

    return { slide, sortOrder: Number(get("sort_order")) || idx, active: get("is_active") !== "false" }
  })

  return slides
    .filter((s) => s.active && s.slide.title) // saltar slides incompletos o desactivados
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.slide)
}

// === Health check ===

export async function getShopInfo() {
  type Resp = {
    shop: {
      name: string
      primaryDomain: { url: string }
      paymentSettings: {
        currencyCode: string
        supportedDigitalWallets: string[]
      }
    }
  }
  const data = await shopifyFetch<Resp>(SHOP_INFO_QUERY, undefined, {
    cache: "no-store",
  })
  return data.shop
}
