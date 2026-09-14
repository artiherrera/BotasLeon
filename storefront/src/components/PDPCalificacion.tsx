"use client"

import { JudgemeStars } from "./JudgemeStars"
import { useT } from "@/lib/i18n/context"
import type { Product } from "@/lib/shopify/types"

/**
 * La calificación, pegada al precio.
 *
 * Antes solo existía al final de la ficha, debajo de todo. Una calificación
 * sirve para decidir, y se decide arriba: junto al precio es donde el ojo ya
 * está. El bloque completo de reseñas se queda abajo, y esta línea lleva a él.
 *
 * NO SE PINTA SIN RESEÑAS, y eso es casi siempre: de los 106 productos solo 5
 * tienen alguna (medido). Enseñar "★ 0 (0)" en las otras 101 restaría — un cero
 * dice "nadie la ha comprado" aunque solo signifique "nadie ha escrito".
 */
export function PDPCalificacion({ product }: { product: Product }) {
  const t = useT()
  const rating = product.judgemeRating ?? null
  const count = product.judgemeReviewCount ?? null
  if (rating === null || rating <= 0) return null

  return (
    <a
      href="#reviews-heading"
      className="inline-flex items-center gap-1.5 transition-opacity duration-[180ms] hover:opacity-70"
      aria-label={t("review.heading")}
    >
      <JudgemeStars rating={rating} count={count} size="md" />
    </a>
  )
}
