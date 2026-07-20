/**
 * Capa de acceso a datos sobre Shopify Storefront API.
 *
 * Estas funciones son las que llaman los componentes/server actions.
 * Encapsulan: query GraphQL + extracción del shape relevante (los
 * conectores de GraphQL devuelven todo en `.edges[].node` que es ruido).
 */

import { cache } from "react"
import { shopifyFetch } from "./client"
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_PRODUCTS_WITH_TAXONOMY_QUERY,
  GET_HERO_SLIDES_QUERY,
  GET_BRANDS_QUERY,
  GET_CATEGORY_CARDS_QUERY,
  GET_STORE_PHOTOS_QUERY,
  SHOP_INFO_QUERY,
} from "./queries"
import {
  ACCESSORY_PRODUCT_TYPES,
  BOOT_PRODUCT_TYPES,
  isAccessory,
  isBoot,
} from "./taxonomy"
import type { Product, Collection, HeroSlide, Image, Brand, CategoryCard, PageInfo } from "./types"

// Logs de diagnóstico solo en dev. En producción (Amplify) ensucian los
// logs de build/runtime y computan trabajo inútil (ej. el droppedReport de
// getProductsByTaxonomy) que nadie lee. Los console.error de los catch sí
// se mantienen — esos importan en producción.
const DEBUG = process.env.NODE_ENV !== "production"

type Edge<T> = { edges: Array<{ node: T }> }
type Connection<T> = Edge<T> & { pageInfo: PageInfo }

// Versiones cacheadas por-request (React.cache): deduplican cuando la misma
// función se llama varias veces en un mismo render — PDP: page +
// generateMetadata; /marcas/[handle]: generateStaticParams + page +
// generateMetadata. Shopify usa POST, que Next NO memoiza, así que este cache
// es el que colapsa esas llamadas repetidas. (Las funciones *Impl están más
// abajo; los `function` se hoistean, así que referenciarlas aquí es válido.)
export const getProductByHandle = cache(getProductByHandleImpl)
export const getCollectionByHandle = cache(getCollectionByHandleImpl)
export const getBrands = cache(getBrandsImpl)

// === Judge.me parsing ===
//
// Shopify devuelve los metafields de Judge.me con shape `{ type, value }`.
// El tipo más común para `reviews.rating` es `rating` (Shopify nativo),
// cuyo `value` es JSON serializado: `{"value":"4.3","scale_min":"1.0","scale_max":"5.0"}`.
// `reviews.rating_count` es `number_integer` y `value` es string "125".
//
// La función parsea de forma defensiva — si el JSON no se puede parsear
// (porque Judge.me cambió el formato, o el metafield no existe), regresa
// null y el frontend muestra "Sin reseñas aún".
type RawMetafield = { type: string | null; value: string | null } | null

type JudgemeMetafields = {
  reviewsRating?: RawMetafield
  reviewsRatingCount?: RawMetafield
}

function parseJudgemeRating(mf: RawMetafield): number | null {
  if (!mf?.value) return null
  try {
    // type "rating" → JSON con { value, scale_min, scale_max }
    if (mf.type === "rating") {
      const parsed = JSON.parse(mf.value) as { value?: string | number }
      const n = typeof parsed.value === "string" ? parseFloat(parsed.value) : Number(parsed.value)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    // Fallback: string plano "4.5"
    const n = parseFloat(mf.value)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function parseJudgemeCount(mf: RawMetafield): number | null {
  if (!mf?.value) return null
  try {
    const n = parseInt(mf.value, 10)
    return Number.isFinite(n) && n >= 0 ? n : null
  } catch {
    return null
  }
}

function applyJudgeme<T extends JudgemeMetafields>(node: T): T & { judgemeRating: number | null; judgemeReviewCount: number | null } {
  return {
    ...node,
    judgemeRating: parseJudgemeRating(node.reviewsRating ?? null),
    judgemeReviewCount: parseJudgemeCount(node.reviewsRatingCount ?? null),
  }
}

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
  reverse?: boolean
}): Promise<{ products: Product[]; pageInfo: PageInfo }> {
  type Resp = { products: Connection<Product & JudgemeMetafields> }
  const data = await shopifyFetch<Resp>(
    GET_PRODUCTS_QUERY,
    {
      first: opts?.first ?? 24,
      after: opts?.after ?? null,
      query: opts?.query,
      sortKey: opts?.sortKey ?? "BEST_SELLING",
      reverse: opts?.reverse ?? false,
    },
    { tags: ["products"] }
  )
  return {
    products: data.products.edges.map((e) => applyJudgeme(e.node)),
    pageInfo: data.products.pageInfo,
  }
}

async function getProductByHandleImpl(handle: string): Promise<Product | null> {
  type Resp = {
    product:
      | (Omit<Product, "images" | "variants"> & {
          images: Edge<Product["images"][number]>
          variants: Edge<Product["variants"][number]>
        } & JudgemeMetafields)
      | null
  }
  try {
    const data = await shopifyFetch<Resp>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle },
      { tags: [`product-${handle}`] }
    )
    if (!data.product) return null
    const p = data.product
    return applyJudgeme({
      ...p,
      images: p.images.edges.map((e) => e.node),
      variants: p.variants.edges.map((e) => e.node),
    })
  } catch (e) {
    // Igual que getCollectionByHandle: un fallo transitorio de Shopify
    // devuelve null (→ el PDP dispara notFound()) en vez de tirar la página.
    console.error(`[getProductByHandle] handle=${handle}:`, e instanceof Error ? e.message : e)
    return null
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
async function getCollectionByHandleImpl(
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
      products: data.collection.products.edges.map((e) => applyJudgeme(e.node as Product & JudgemeMetafields)),
    }
  } catch (e) {
    console.error(`[getCollectionByHandle] handle=${handle}:`, e instanceof Error ? e.message : e)
    return null
  }
}

// === Brands (Metaobjects) ===

async function getBrandsImpl(): Promise<Brand[]> {
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
  if (DEBUG) console.log(`[getBrands] nodes recibidos: ${nodes.length}`)

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
  // CREATED_AT + reverse = más nuevos primero. Evitamos el default BEST_SELLING,
  // que en una tienda sin ventas ordena mal (u omite del batch) los productos
  // recién subidos — el mismo problema que el home ya resolvió.
  const { products } = await getProducts({
    first,
    query: `vendor:"${escaped}"`,
    sortKey: "CREATED_AT",
    reverse: true,
  })
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
//
// Bota vs accesorio: por default `onlyBoots: true`. Las rutas de género
// (/hombre, /mujer, /nino) son catálogos de botas — un cinturón con
// "Sexo objetivo: Masculino" NO debe contaminar /hombre. Para incluir
// accesorios (ej. página /outlet futura que mezcle todo), pasar
// onlyBoots: false.

type TaxonomyKey = "gender" | "age"

export async function getProductsByTaxonomy(
  key: TaxonomyKey,
  handle: string,
  // Bajamos y LUEGO filtramos por género en JS, así que este `first` debe
  // cubrir TODO el catálogo o se pierden productos que quedan al fondo del
  // orden (ej. marcas nuevas con pocas ventas en sortKey BEST_SELLING). 250
  // es el máximo por página de la Storefront API. Si el catálogo supera 250,
  // hay que paginar (como generateStaticParams).
  first = 250,
  options?: { onlyBoots?: boolean; sortKey?: ProductSortKey }
): Promise<Product[]> {
  const onlyBoots = options?.onlyBoots ?? true
  // Default BEST_SELLING para mantener compatibilidad con /hombre y /mujer
  // (catálogo general — donde tiene sentido lo más vendido). Home pasa
  // CREATED_AT explícitamente para sus tabs "Lo más nuevo".
  const sortKey = options?.sortKey ?? "BEST_SELLING"
  // Solo invertir cuando es CREATED_AT/UPDATED_AT — para que "más nuevos
  // primero" funcione. BEST_SELLING ya viene rankeado más-a-menos por API.
  const reverse = sortKey === "CREATED_AT" || sortKey === "UPDATED_AT"

  type ProductWithTaxonomy = Product & JudgemeMetafields & {
    gender?: { references?: { edges: Array<{ node: { handle: string } }> } } | null
    age?: { references?: { edges: Array<{ node: { handle: string } }> } } | null
  }
  type Resp = { products: Edge<ProductWithTaxonomy> }

  let data: Resp
  try {
    data = await shopifyFetch<Resp>(
      GET_PRODUCTS_WITH_TAXONOMY_QUERY,
      { first, sortKey, reverse },
      { tags: ["products"] }
    )
  } catch (e) {
    console.error("[getProductsByTaxonomy] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const all = data.products.edges.map((e) => applyJudgeme(e.node))

  // Log de auditoría para ver qué productos perdemos por filtros — útil
  // para debuguear "¿por qué no aparece mi bota en /mujer?" desde Amplify
  // build logs.
  const filtered = all.filter((p) => {
    const refs = p[key]?.references?.edges ?? []
    const matchesTaxonomy = refs.some((r) => r.node.handle === handle)
    if (!matchesTaxonomy) return false
    if (onlyBoots && !isBoot(p)) return false
    return true
  })

  if (DEBUG && all.length > 0 && filtered.length < all.length) {
    const dropped = all.filter((p) => !filtered.includes(p))
    const droppedReport = dropped.map((p) => {
      const refs = p[key]?.references?.edges ?? []
      const taxonomyHandles = refs.map((r) => r.node.handle).join(",") || "(empty)"
      return `${p.handle} [type=${p.productType || "(empty)"}, ${key}=${taxonomyHandles}]`
    })
    console.log(
      `[getProductsByTaxonomy] key=${key}/${handle} onlyBoots=${onlyBoots} kept=${filtered.length} dropped=${dropped.length}`
    )
    if (dropped.length > 0) {
      console.log("[getProductsByTaxonomy] dropped:", droppedReport.join(" | "))
    }
  }

  return filtered
}

// === Accesorios ===
//
// Devuelve productos cuyo `productType` está en ACCESSORY_PRODUCT_TYPES.
// Si se pasa `productType`, filtra a esa sub-categoría exacta (Cinturones,
// Sombreros, etc.). Sin productType regresa todos los accesorios — usado
// por /accesorios (listing general) y AccessoriesShowcase (home).
//
// Implementación: el query de Shopify Storefront acepta `product_type:X`
// pero requiere el valor EXACTO incluyendo acentos. Para evitar problemas
// con tilde de "Clásicas" en otros contextos, hacemos un fetch ancho y
// filtramos en JS — más simple y consistente con getProductsByTaxonomy.
export async function getAccessories(
  productType?: string,
  first = 100
): Promise<Product[]> {
  const { products: all } = await getProducts({ first, sortKey: "BEST_SELLING" })
  return all.filter((p) => {
    if (productType) return p.productType === productType
    return isAccessory(p)
  })
}

// Re-export para callers que solo necesitan las constantes (ej. rutas).
export { ACCESSORY_PRODUCT_TYPES, BOOT_PRODUCT_TYPES, isAccessory, isBoot }

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
  // Campos de LISTA (ej. lista de imágenes en store_photo). Opcional: las
  // queries que no lo piden lo dejan undefined.
  references?: { edges: Array<{ node: { image: Image | null } | null }> } | null
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
  if (DEBUG) console.log(`[getHeroSlides] nodes recibidos: ${nodes.length}`)

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

// === Category cards (Metaobjects) ===

// Cards del home (Hombre/Mujer/Niños). Si Shopify no devuelve nada o
// falla, el componente cae al hardcode con gradients — el home nunca
// se rompe mientras el admin configura el metaobject.
export async function getCategoryCards(): Promise<CategoryCard[]> {
  type Resp = { metaobjects: Edge<MetaobjectNode> | null }
  let data: Resp
  try {
    data = await shopifyFetch<Resp>(
      GET_CATEGORY_CARDS_QUERY,
      undefined,
      { revalidate: 60 }
    )
  } catch (e) {
    console.error("[getCategoryCards] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const nodes = data.metaobjects?.edges?.map((e) => e.node) ?? []
  if (DEBUG) console.log(`[getCategoryCards] nodes recibidos: ${nodes.length}`)

  const cards = nodes.map((node, idx) => {
    const fieldMap = new Map(node.fields.map((f) => [f.key, f] as const))
    const get = (key: string) => fieldMap.get(key)?.value ?? ""
    const rawImage = fieldMap.get("image")?.reference?.image ?? null

    // Coerción: Image.width/height son nullable en el schema general;
    // para next/image necesitamos números. Si Shopify reporta null
    // (raro pero posible para SVG sin dimensions), usamos un fallback
    // proporcional al aspect-[4/5] del card (800×1000).
    const image: CategoryCard["image"] = rawImage
      ? {
          url: rawImage.url,
          altText: rawImage.altText,
          width: rawImage.width ?? 800,
          height: rawImage.height ?? 1000,
        }
      : null

    const card: CategoryCard = {
      handle: node.handle,
      image,
      eyebrow: get("eyebrow"),
      title: get("title"),
      description: get("description"),
      href: parseHrefFromLinkField(get("link_url")) || "#",
      sortOrder: Number(get("sort_order")) || idx,
      isActive: get("is_active") !== "false",
    }
    return card
  })

  return cards
    .filter((c) => c.isActive && c.title)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// Fotos de la tienda física (metaobjeto "store_photo"). Toma la primera imagen
// de cada entrada — robusto al nombre del campo que use el admin — y ordena por
// sort_order si existe. Vacío si no hay entradas → la galería se auto-oculta.
export type StorePhoto = { handle: string; image: Image; sortOrder: number }

export async function getStorePhotos(): Promise<StorePhoto[]> {
  type Resp = { metaobjects: Edge<MetaobjectNode> | null }
  let data: Resp
  try {
    data = await shopifyFetch<Resp>(GET_STORE_PHOTOS_QUERY, undefined, {
      revalidate: 60,
    })
  } catch (e) {
    console.error("[getStorePhotos] fetch error:", e instanceof Error ? e.message : e)
    return []
  }

  const nodes = data.metaobjects?.edges?.map((e) => e.node) ?? []

  // Aplana TODAS las imágenes: soporta campo LISTA (varias imágenes en una
  // entrada, vía `references`) y campo single (una imagen, vía `reference`),
  // así como varias entradas. Cada imagen es una foto de la galería.
  const photos: StorePhoto[] = []
  nodes.forEach((node, entryIdx) => {
    const fieldMap = new Map(node.fields.map((f) => [f.key, f] as const))
    const base = Number(fieldMap.get("sort_order")?.value) || entryIdx

    const imgs: Image[] = []
    for (const f of node.fields) {
      if (f.reference?.image) imgs.push(f.reference.image)
      for (const edge of f.references?.edges ?? []) {
        if (edge.node?.image) imgs.push(edge.node.image)
      }
    }

    imgs.forEach((raw, i) => {
      photos.push({
        handle: `${node.handle}-${i}`,
        image: {
          url: raw.url,
          altText: raw.altText,
          width: raw.width ?? 1200,
          height: raw.height ?? 900,
        },
        // base*100 mantiene el orden entre entradas y, dentro de una lista,
        // respeta el orden en que se subieron las imágenes.
        sortOrder: base * 100 + i,
      })
    })
  })

  return photos.sort((a, b) => a.sortOrder - b.sortOrder)
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
