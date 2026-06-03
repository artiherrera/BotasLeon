import { ProductCard } from "@/components/ProductCard"
import { getProducts } from "@/lib/shopify"
import type { Product } from "@/lib/shopify/types"

/**
 * RelatedProducts — grid de 4 productos relacionados al final del PDP.
 *
 * Estrategia: si el producto actual tiene vendor, intentamos mostrar
 * 4 botas del mismo taller. Si no hay suficientes o el producto no
 * trae vendor, caemos a un fetch general best-selling.
 *
 * Excluímos siempre el producto actual para no mostrarlo a sí mismo.
 * Server component — se ejecuta en build y los datos viajan en HTML.
 */

type Props = {
  currentHandle: string
  vendor?: string
}

export async function RelatedProducts({ currentHandle, vendor }: Props) {
  let products: Product[] = []

  if (vendor) {
    const { products: sameVendor } = await getProducts({ first: 8 })
    products = sameVendor
      .filter((p) => p.vendor === vendor && p.handle !== currentHandle)
      .slice(0, 4)
  }

  if (products.length < 1) {
    const { products: fallback } = await getProducts({ first: 4 })
    products = fallback.filter((p) => p.handle !== currentHandle).slice(0, 4)
  }

  if (products.length < 1) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16 border-t border-border mt-12">
      <p className="eyebrow text-leather mb-2">Te puede interesar</p>
      <h2 className="font-heading text-2xl md:text-3xl text-text mb-8">
        Más botas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
