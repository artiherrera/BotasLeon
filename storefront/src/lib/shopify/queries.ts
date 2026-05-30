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
