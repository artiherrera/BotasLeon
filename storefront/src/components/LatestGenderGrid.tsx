import Link from "next/link"
import { ProductCard } from "./ProductCard"
import { EmptyProductsState } from "./EmptyState"
import type { Product } from "@/lib/shopify/types"

/**
 * LatestGenderGrid — contenido (server-rendered) de un tab de "Lo más nuevo".
 *
 * Se renderiza en el server y se pasa como prop `ReactNode` a
 * LatestByGenderTabs (client). Así los ProductCard + JudgemeStars quedan en
 * el RSC payload y NO entran al bundle JS del home — el cliente solo alterna
 * la visibilidad del grid activo.
 */
export function LatestGenderGrid({
  products,
  href,
  label,
  emptyHint,
}: {
  products: Product[]
  href: string
  label: string
  emptyHint: string
}) {
  if (products.length === 0) {
    return <EmptyProductsState title="Próximamente" description={emptyHint} />
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="text-center mt-10">
        <Link
          href={href}
          className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
        >
          Ver todo {label} →
        </Link>
      </div>
    </>
  )
}
