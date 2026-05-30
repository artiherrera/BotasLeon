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
