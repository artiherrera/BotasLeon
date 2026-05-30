/**
 * Fragmentos GraphQL reutilizables + queries específicas.
 *
 * Decisión: definir fragments para Product/Variant/Image para que cuando
 * el schema crezca solo toquemos un lugar. Las queries combinan fragments
 * con root operations.
 */

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`

export const VARIANT_FRAGMENT = /* GraphQL */ `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    sku
    price { ...MoneyFields }
    compareAtPrice { ...MoneyFields }
    selectedOptions { name value }
    image { ...ImageFields }
  }
`

export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    featuredImage { ...ImageFields }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
  }
`

export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  fragment ProductDetailFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    featuredImage { ...ImageFields }
    images(first: 20) {
      edges { node { ...ImageFields } }
    }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    options { id name values }
    variants(first: 100) {
      edges { node { ...VariantFields } }
    }
  }
`

// ───── Queries ─────

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts($first: Int!, $query: String, $sortKey: ProductSortKeys) {
    products(first: $first, query: $query, sortKey: $sortKey) {
      edges {
        node { ...ProductCardFields }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
`

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductDetailFields
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${VARIANT_FRAGMENT}
  ${PRODUCT_DETAIL_FRAGMENT}
`

export const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { ...ImageFields }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`

// Hero slides — Metaobjects de tipo "hero_slide" definidos en
// Shopify admin (Settings → Custom data → Metaobjects). Cada slide
// tiene fields: image (File), eyebrow, title, link_url, sort_order,
// is_active. El frontend los renderiza ordenados por sort_order.
//
// Setup admin requerido (una vez): crear la definition + entries.
// Documentación: docs.shopify.com/api/admin/migrate/new-product-model/metaobjects
export const GET_HERO_SLIDES_QUERY = /* GraphQL */ `
  query GetHeroSlides {
    metaobjects(type: "hero_slide", first: 10) {
      edges {
        node {
          id
          handle
          fields {
            key
            value
            reference {
              ... on MediaImage {
                image { ...ImageFields }
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`

// ───── Cart ─────
//
// Shopify Cart API es stateless desde el cliente: cada cart vive con un ID
// que persistimos en cookie. Mutaciones devuelven el cart actualizado.
// checkoutUrl es la URL alojada en Shopify donde el cliente paga —
// nosotros no manejamos el flujo de pago.

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { ...MoneyFields }
      totalAmount    { ...MoneyFields }
      totalTaxAmount { ...MoneyFields }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { ...MoneyFields } }
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              price { ...MoneyFields }
              image { ...ImageFields }
              selectedOptions { name value }
              product { handle title }
            }
          }
        }
      }
    }
  }
`

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`

export const GET_CART_QUERY = /* GraphQL */ `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`

// Health check — no requiere datos reales, sirve para verificar
// que el token funciona al conectar por primera vez.
export const SHOP_INFO_QUERY = /* GraphQL */ `
  query ShopInfo {
    shop {
      name
      primaryDomain { url }
      paymentSettings {
        currencyCode
        supportedDigitalWallets
      }
    }
  }
`
