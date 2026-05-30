/**
 * Client-side product search vía Shopify Storefront API.
 *
 * Corre en el navegador (igual que cart). Usa NEXT_PUBLIC_* env vars.
 * Storefront API soporta `query:` con sintaxis Lucene-like: por default
 * busca en title, body (description), tags, vendor y product_type.
 *
 * No usamos server fetch + searchParams porque eso volvería /search
 * dinámica → Amplify Hosting da 500. Ver [memory: amplify-hosting-quirks]
 */

import type { Product } from "@/lib/shopify/types"

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

const SEARCH_QUERY = /* GraphQL */ `
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query, sortKey: RELEVANCE) {
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
        }
      }
    }
  }
`

export async function searchProducts(
  query: string,
  first = 24
): Promise<Product[]> {
  if (!DOMAIN || !TOKEN) {
    throw new Error("Faltan NEXT_PUBLIC_SHOPIFY env vars")
  }
  const trimmed = query.trim()
  if (!trimmed) return []

  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { query: trimmed, first },
    }),
  })

  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`)

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "))
  }
  return json.data.products.edges.map((e: { node: Product }) => e.node)
}
