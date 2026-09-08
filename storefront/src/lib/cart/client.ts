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

import { inContext } from "@/lib/market"
import { DEFAULT_LOCALE } from "@/lib/i18n/config"
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
    attributes { key value }
    discountCodes { code applicable }
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
          attributes { key value }
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              price { amount currencyCode }
              image { url altText width height }
              selectedOptions { name value }
              product {
                handle
                title
                # Decide si la talla se convierte a escala americana: solo el
                # calzado. Un cinturón va en pulgadas. Ver lib/sizes.ts.
                productType
                # Para el selector de talla DENTRO del carrito: la lista de
                # tallas del producto y el sexo (que decide la conversión
                # MX→US: hombre −19, mujer −17).
                targetGender: metafield(namespace: "shopify", key: "target-gender") {
                  references(first: 1) {
                    edges { node { ... on Metaobject { handle } } }
                  }
                }
                shoeSizes: metafield(namespace: "shopify", key: "shoe-size") {
                  references(first: 30) {
                    edges { node { ... on Metaobject { handle fields { key value } } } }
                  }
                }
              }
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

/**
 * IDIOMA DEL CARRITO — y por lo tanto del CHECKOUT.
 *
 * El `checkoutUrl` que devuelve Shopify viene localizado según el idioma que
 * lleve `@inContext` al pedirlo: con EN sale .../en/cart/c/..., sin idioma sale
 * en el idioma por defecto de la TIENDA.
 *
 * Aquí no había `@inContext` en ninguna operación, solo `buyerIdentity` con el
 * país. Resultado: un comprador en Austin veía el sitio en inglés y llegaba a
 * una pantalla de pago EN ESPAÑOL, porque la tienda es mexicana y ese es su
 * idioma por defecto.
 *
 * Se guarda a nivel de módulo en vez de pasarlo por parámetro porque las ocho
 * operaciones se llaman desde un único sitio (CartProvider), y enhebrarlo por
 * todas ensuciaría las firmas sin ganar nada.
 */
let idiomaCarrito: "ES" | "EN" = DEFAULT_LOCALE === "en" ? "EN" : "ES"

export function fijarIdiomaCarrito(locale: string): void {
  idiomaCarrito = locale === "en" ? "EN" : "ES"
}

/** Directiva ya armada, con el país del mercado y el idioma en curso. */
const ctx = (): string => inContext(idiomaCarrito)

export async function clientGetCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyClientFetch<{ cart: RawCart | null }>(
    /* GraphQL */ `
      query ($id: ID!) ${ctx()} {
        cart(id: $id) { ...CartFields }
      }
      ${CART_FRAGMENT}
    `,
    { id: cartId }
  )
  return flatten(data.cart)
}

export async function clientCreateCart(
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>,
  // countryCode define el MERCADO del carrito → moneda + checkout. "US" cobra en
  // USD (mercado Estados Unidos), "MX" en MXN (default). Sin él, Shopify usa el
  // mercado por defecto (México/MXN).
  countryCode?: string
): Promise<Cart> {
  const input: Record<string, unknown> = { lines }
  if (countryCode) input.buyerIdentity = { countryCode }
  const data = await shopifyClientFetch<Mutation<"cartCreate">>(
    /* GraphQL */ `
      mutation ($input: CartInput!) ${ctx()} {
        cartCreate(input: $input) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { input }
  )
  return unwrap(data, "cartCreate")
}

/**
 * Cambia el país (mercado) de un carrito existente → cambia moneda y el checkout.
 * Se usa al cambiar de idioma (EN→US/USD, ES→MX/MXN) con un carrito ya creado.
 */
export async function clientUpdateBuyerIdentity(
  cartId: string,
  countryCode: string
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartBuyerIdentityUpdate">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) ${ctx()} {
        cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, buyerIdentity: { countryCode } }
  )
  return unwrap(data, "cartBuyerIdentityUpdate")
}

export async function clientAddLines(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartLinesAdd">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $lines: [CartLineInput!]!) ${ctx()} {
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
  // `attributes` reemplaza el set completo de atributos de la línea — así se
  // fija/cambia la talla desde el carrito sin borrar y volver a agregar.
  lines: Array<{
    id: string
    quantity?: number
    attributes?: Array<{ key: string; value: string }>
  }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartLinesUpdate">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $lines: [CartLineUpdateInput!]!) ${ctx()} {
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
      mutation ($cartId: ID!, $lineIds: [ID!]!) ${ctx()} {
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

/**
 * Reemplaza el set completo de atributos a nivel carrito. Shopify sustituye
 * TODO el arreglo, así que el caller debe pasar los atributos que quiera
 * conservar (para quitar uno, omítelo del arreglo). `value` es obligatorio
 * en AttributeInput, por eso no se pasan nulos.
 */
export async function clientUpdateAttributes(
  cartId: string,
  attributes: Array<{ key: string; value: string }>
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartAttributesUpdate">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $attributes: [AttributeInput!]!) ${ctx()} {
        cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, attributes }
  )
  return unwrap(data, "cartAttributesUpdate")
}

/**
 * Reemplaza los códigos de descuento del carrito (Shopify sustituye todo el
 * arreglo). Pasa [] para quitar todos. El cart devuelto trae discountCodes con
 * `applicable` — si un código no es válido/no aplica, Shopify lo deja con
 * applicable:false y NO afecta el total. El descuento válido ya se refleja en
 * cost + discountAllocations, y viaja al checkout hospedado automáticamente.
 */
export async function clientUpdateDiscountCodes(
  cartId: string,
  discountCodes: string[]
): Promise<Cart> {
  const data = await shopifyClientFetch<Mutation<"cartDiscountCodesUpdate">>(
    /* GraphQL */ `
      mutation ($cartId: ID!, $discountCodes: [String!]) ${ctx()} {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
          cart { ...CartFields }
          userErrors { message field }
        }
      }
      ${CART_FRAGMENT}
    `,
    { cartId, discountCodes }
  )
  return unwrap(data, "cartDiscountCodesUpdate")
}
