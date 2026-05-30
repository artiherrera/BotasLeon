/**
 * Cart client-side: corre EN EL NAVEGADOR.
 *
 * Hace fetch directo a Shopify Storefront API sin pasar por nuestro
 * server. Esto evita server actions + cookies que Amplify no maneja
 * bien en Next 16. Trade-off: el token Storefront va al bundle JS
 * (NEXT_PUBLIC_*) — está bien porque por diseño es público read-only.
 *
 * Requisitos para que funcione:
 *  1. NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN definido en build
 *  2. NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN definido en build
 *  3. El dominio del frontend está en "Allowed domains" de Shopify
 *     Headless (sin esto, browser bloquea por CORS)
 */

import type { Cart } from "@/lib/shopify/types"

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2025-01"

const ENDPOINT = DOMAIN
  ? `https://${DOMAIN}/api/${VERSION}/graphql.json`
  : ""

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount    { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              price { amount currencyCode }
              image { url altText width height }
              selectedOptions { name value }
              product { handle title }
            }
          }
        }
      }
    }
  }
`

type GqlResp<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

async function shopifyClientFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!DOMAIN || !TOKEN) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN o NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN en el build"
    )
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}`)
  }
  const json = (await res.json()) as GqlResp<T>
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "))
  }
  if (!json.data) throw new Error("Shopify devolvió respuesta vacía")
  return json.data
}

// === Cart shape helpers ===

type RawCart = Omit<Cart, "lines"> & {
  lines: { edges: Array<{ node: Cart["lines"][number] }> }
}

function flatten(raw: RawCart | null): Cart | null {
  if (!raw) return null
  return { ...raw, lines: raw.lines.edges.map((e) => e.node) }
}

type Mutation<K extends string> = Record<
  K,
  {
    cart: RawCart | null
    userErrors: Array<{ message: string; field: string[] | null }>
  }
>

function unwrap<K extends string>(resp: Mutation<K>, key: K): Cart {
  const { cart, userErrors } = resp[key]
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).join("; "))
  }
  if (!cart) throw new Error("Shopify devolvió cart vacío")
  return flatten(cart)!
}

// === Mutaciones ===

export async function clientGetCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyClientFetch<{ cart: RawCart | null }>(
    /* GraphQL */ `
      query ($id: ID!) {
        cart(id: $id) { ...CartFields }
      }
      ${CART_FRAGMENT}
    `,
    { id: cartId }
  )
  return flatten(data.cart)
}

export async function clientCreateCart(
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartCreate">>(
    /* GraphQL */ `
      mutation ($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { input: { lines } }
  )
  return unwrap(data, "cartCreate")
}

export async function clientAddLines(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartLinesAdd">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, lines }
  )
  return unwrap(data, "cartLinesAdd")
}

export async function clientUpdateLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartLinesUpdate">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, lines }
  )
  return unwrap(data, "cartLinesUpdate")
}

export async function clientRemoveLines(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartLinesRemove">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, lineIds }
  )
  return unwrap(data, "cartLinesRemove")
}
