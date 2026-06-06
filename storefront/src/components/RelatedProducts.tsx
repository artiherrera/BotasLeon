import { ProductCard } from "@/components/ProductCard"
import { getProducts } from "@/lib/shopify"
import { isAccessory, isBoot } from "@/lib/shopify/taxonomy"
import type { Product } from "@/lib/shopify/types"

/**
 * RelatedProducts — grid de 4 productos relacionados al final del PDP.
 *
 * Estrategia:
 *  1. Filtrar al mismo "bucket" del producto actual (bota → otras botas,
 *     accesorio → otros accesorios). Evita recomendar un cinturón cuando
 *     el usuario está viendo una bota.
 *  2. Dentro del bucket, preferir mismo vendor (taller) si hay matches.
 *  3. Si no hay 4 del mismo vendor en el bucket, completar con otros
 *     productos del bucket.
 *  4. Si el producto actual no clasifica como bota ni accesorio (caso
 *     edge: productType vacío), caer al comportamiento legacy.
 *
 * Excluímos siempre el producto actual. Server component — fetch en build.
 */

type Props = {
  currentHandle: string
  vendor?: string
  productType?: string
}

function classify(productType?: string): "boot" | "accessory" | "unknown" {
  if (isBoot({ productType })) return "boot"
  if (isAccessory({ productType })) return "accessory"
  return "unknown"
}

export async function RelatedProducts({
  currentHandle,
  vendor,
  productType,
}: Props) {
  const bucket = classify(productType)
  // Fetch ancho — necesitamos universo suficiente para filtrar por bucket
  // sin quedarnos sin candidatos. 50 es razonable para catálogo medio.
  const { products: pool } = await getProducts({ first: 50 })

  const inBucket = pool.filter((p) => {
    if (p.handle === currentHandle) return false
    if (bucket === "boot") return isBoot(p)
    if (bucket === "accessory") return isAccessory(p)
    return true
  })

  let products: Product[] = []

  if (vendor) {
    products = inBucket.filter((p) => p.vendor === vendor).slice(0, 4)
  }

  if (products.length < 4) {
    const seen = new Set(products.map((p) => p.handle))
    const filler = inBucket.filter((p) => !seen.has(p.handle))
    products = [...products, ...filler].slice(0, 4)
  }

  if (products.length < 1) return null

  // Heading se ajusta al bucket — copy honesto evita confusión cuando
  // un PDP de cinturón mostrara "Más botas".
  const heading =
    bucket === "accessory" ? "Más accesorios" : bucket === "boot" ? "Más botas" : "También te puede gustar"

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16 border-t border-border mt-12">
      <p className="eyebrow text-leather mb-2">Te puede interesar</p>
      <h2 className="font-heading text-2xl md:text-3xl text-text mb-8">
        {heading}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
