"use client"

import type { Product } from "@/lib/shopify/types"
import { useT } from "@/lib/i18n/context"
import { JudgemeStars } from "./JudgemeStars"
import { ProductReviews } from "./ProductReviews"
import { ReviewForm } from "./ReviewForm"

/**
 * ProductReviewBlock — sección de reseñas del PDP.
 *
 *  - Resumen de estrellas (JudgemeStars) desde el metacampo reviews.rating.
 *  - Lista de reseñas con fotos (ProductReviews) — parseadas del widget
 *    all_reviews de Judge.me y filtradas por esta bota (el widget por-producto
 *    no funciona en headless).
 *  - Formulario nativo para escribir (ReviewForm) — envía a la API de Judge.me,
 *    con subida de fotos vía Cloudinary.
 *
 * Sin reseñas NO se pinta el encabezado ni el "aún no hay reseñas": eso pasa en
 * 98 de las 103 fichas, y anunciar el vacío en cada una resta en vez de sumar.
 * Lo que SÍ se queda es la puerta para escribir la primera: con ocho reseñas en
 * toda la tienda, ese formulario es la única vía de que el número crezca.
 */
export function ProductReviewBlock({ product }: { product: Product }) {
  const t = useT()
  const rating = product.judgemeRating ?? null
  const count = product.judgemeReviewCount ?? null
  const hasReviews = rating !== null && rating > 0
  const productId = product.id.split("/").pop() ?? product.id

  if (!hasReviews) {
    return (
      <div className="mt-8">
        <ReviewForm
          productId={productId}
          productTitle={product.title}
          triggerKey="review.beFirst"
        />
      </div>
    )
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-12 pt-8 border-t border-border">
      <h2 id="reviews-heading" className="eyebrow text-text-muted mb-4">
        {t("review.heading")}
      </h2>

      <div className="mb-6">
        <JudgemeStars rating={rating} count={count} size="lg" />
      </div>

      <ProductReviews handle={product.handle} />

      <ReviewForm productId={productId} productTitle={product.title} />
    </section>
  )
}
