"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { ProductCard } from "./ProductCard"
import { ProductRail } from "./ProductRail"
import { EmptyProductsState } from "./EmptyState"
import type { Product } from "@/lib/shopify/types"
import { useT } from "@/lib/i18n/context"

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
  const t = useT()
  if (products.length === 0) {
    return <EmptyProductsState title={t("latest.comingSoon")} description={emptyHint} />
  }
  return (
    <>
      {/* Riel deslizable: 4 tarjetas se quedaban cortas para "lo más nuevo".
          Ahora entran las 20 más recientes y se recorren con el dedo o con las
          flechas, sin alargar la página. */}
      <ProductRail label={t("latest.railLabel").replace("{label}", t(`latest.label.${label}`))}>
        {products.slice(0, 20).map((p) => (
          <ProductCard key={p.id} product={p} singleImage />
        ))}
      </ProductRail>
      <div className="text-center mt-10">
        <Link
          href={href}
          className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
        >
          {t("latest.viewAll").replace("{label}", t(`latest.label.${label}`))} →
        </Link>
      </div>
    </>
  )
}
