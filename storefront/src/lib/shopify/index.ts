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
  SHOP_INFO_QUERY,
} from "./queries"
import type { Product, Collection } from "./types"

type Edge<T> = { edges: Array<{ node: T }> }

// === Productos ===

export async function getProducts(opts?: {
  first?: number
  query?: string
  sortKey?: "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT" | "UPDATED_AT" | "RELEVANCE"
}): Promise<Product[]> {
  type Resp = { products: Edge<Product> }
  const data = await shopifyFetch<Resp>(
    GET_PRODUCTS_QUERY,
    {
      first: opts?.first ?? 24,
      query: opts?.query,
      sortKey: opts?.sortKey ?? "BEST_SELLING",
    },
    { tags: ["products"] }
  )
  return data.products.edges.map((e) => e.node)
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
