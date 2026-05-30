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
  featuredImage: Image | null
  images: Image[]
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  options: ProductOption[]
  variants: ProductVariant[]
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
