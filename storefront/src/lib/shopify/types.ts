/**
 * Tipos TypeScript para Shopify Storefront API.
 *
 * Solo los campos que efectivamente usamos en el frontend. No es una
 * imagen completa del schema (eso lo da @shopify/storefront-api-codegen
 * si lo necesitamos en Sprint 2).
 */

export type Money = {
  amount: string // GraphQL Decimal como string — convertir a number con cuidado
  currencyCode: "MXN" | "USD" | string
}

// Cursor pagination — devuelto por queries de listing (products, collections)
// que soportan first/after. `endCursor` es el cursor del último edge en la
// respuesta actual; lo pasamos como `after` en la siguiente request para
// obtener la próxima página. `hasNextPage: false` indica que ya no hay más.
export type PageInfo = {
  hasNextPage: boolean
  endCursor: string | null
}

export type Image = {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export type ProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  quantityAvailable: number | null
  sku: string | null
  price: Money
  compareAtPrice: Money | null
  selectedOptions: Array<{ name: string; value: string }>
  image: Image | null
}

export type ProductOption = {
  id: string
  name: string
  values: string[]
}

// Metafield reference dereferenced — usado para Color, Material, etc.
// que vienen del PRODUCT_CARD_FRAGMENT con references(first: 5).
export type TaxonomyRef = {
  handle: string
  fields: Array<{ key: string; value: string | null }>
}
export type TaxonomyMetafield = {
  references: { edges: Array<{ node: TaxonomyRef }> }
} | null

export type Product = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  createdAt: string  // ISO timestamp — usado para sort "Recientes" en /products
  featuredImage: Image | null
  images: Image[]
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  options: ProductOption[]
  variants: ProductVariant[]
  color?: TaxonomyMetafield
  material?: TaxonomyMetafield
  // Sexo objetivo (Shopify target-gender). Solo el handle del metaobject,
  // sin fields — usamos handle directo para mapear MX→US sizes
  targetGender?: {
    references: { edges: Array<{ node: { handle: string } }> }
  } | null
  // Metadata custom — para nuestro modelo "segmento" / "estilos"
  // (lo seteamos como tags hasta tener metafields)
  // segmento?: 'hombre' | 'mujer' | 'nino' | 'unisex'
  // estilos?: string[]
}

export type Collection = {
  id: string
  handle: string
  title: string
  description: string
  image: Image | null
  productsCount?: number
}

// Hero slide — origen Metaobjects (Settings → Custom data en Shopify admin).
// `image` puede venir null si el field viene vacío o aún sin asset;
// el componente debe seguir renderizando con su gradient de fallback.
export type HeroSlide = {
  id: string
  handle: string
  eyebrow: string
  title: string
  href: string
  image: Image | null
  // El componente usa una clase Tailwind para el gradient cuando no hay
  // imagen. Si en el futuro queremos overridear desde el admin, agregar
  // un field más en el metaobject (ej. `accent_color`).
  bgClass?: string
}

// Brand — viene de Metaobject tipo "brand". El handle es el slug del
// metaobject (autogenerado por Shopify), el name debe coincidir con
// product.vendor para que la página individual pueda filtrar productos.
export type Brand = {
  id: string
  handle: string  // slug, ej. "josepha"
  name: string   // display name, ej. "Josepha"
  tagline: string
  logo: Image | null
}

// Category card — Metaobject tipo "category_card". Maneja las tarjetas
// del home (Hombre/Mujer/Niños) para que el admin pueda cambiar foto/copy
// por temporada sin tocar código. Si no hay entries en Shopify, el
// componente cae al hardcode anterior (gradients).
//
// Fields esperados del metaobject:
//   - image (File reference) — opcional; sin imagen se usa gradient fallback
//   - eyebrow (single line text)
//   - title (single line text)
//   - description (single line text)
//   - link_url (link/URL) — Shopify lo guarda como JSON `{"url":"..."}`
//   - sort_order (integer)
//   - is_active (boolean)
export type CategoryCard = {
  handle: string
  image: {
    url: string
    altText: string | null
    width: number
    height: number
  } | null
  eyebrow: string
  title: string
  description: string
  href: string // pathname ya parseado desde link_url
  sortOrder: number
  isActive: boolean
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: Money
    totalAmount: Money
    totalTaxAmount: Money | null
  }
  lines: Array<{
    id: string
    quantity: number
    merchandise: ProductVariant & { product: Pick<Product, "handle" | "title"> }
    cost: { totalAmount: Money }
  }>
}
