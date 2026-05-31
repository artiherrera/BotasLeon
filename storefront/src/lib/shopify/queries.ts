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
    createdAt
    featuredImage { ...ImageFields }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
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

// Productos con sus metafields de taxonomía Shopify (gender, age).
// Usado por páginas /hombre, /mujer, /nino que filtran por estos
// metafields en lugar de requerir colecciones manuales.
//
// El field `references(first:5)` resuelve el GID del metaobject a un
// handle como "femenino", "masculino", "adultos", "kids". Filtramos
// en JS por ese handle.
export const GET_PRODUCTS_WITH_TAXONOMY_QUERY = /* GraphQL */ `
  query GetProductsWithTaxonomy($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          ...ProductCardFields
          gender: metafield(namespace: "shopify", key: "target-gender") {
            references(first: 5) {
              edges { node { ... on Metaobject { handle } } }
            }
          }
          age: metafield(namespace: "shopify", key: "age-group") {
            references(first: 5) {
              edges { node { ... on Metaobject { handle } } }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
`

// Brands — Metaobjects tipo "brand" para controlar qué marcas se
// muestran en el home y /marcas, en qué orden, y con qué logo.
// La match con productos se hace por el field `name` que debe coincidir
// EXACTAMENTE con el `vendor` del producto en Shopify.
//
// Fields esperados del metaobject:
//   - logo (File reference, opcional pero recomendado)
//   - name (single line text, debe = product.vendor)
//   - tagline (single line text, opcional)
//   - sort_order (integer)
//   - is_active (boolean)
//
// El handle del metaobject (autogenerado, ej. "josepha") es el slug
// que usamos para /marcas/[handle].
export const GET_BRANDS_QUERY = /* GraphQL */ `
  query GetBrands {
    metaobjects(type: "brand", first: 50) {
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

// Productos por colección — usado por páginas /hombre, /mujer, /nino
// y eventualmente /marcas/[handle]. Las colecciones se manejan en
// Shopify admin (Productos → Colecciones), idealmente automatizadas
// con reglas tipo "metacampo Sexo objetivo = Female".
//
// Si la colección no existe, `collection` devuelve null y la página
// muestra empty state pidiendo al admin crearla.
export const GET_COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetCollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image { ...ImageFields }
      products(first: $first) {
        edges { node { ...ProductCardFields } }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
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
