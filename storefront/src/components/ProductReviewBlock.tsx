import type { Product } from "@/lib/shopify/types"
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
 */
export function ProductReviewBlock({ product }: { product: Product }) {
  const rating = product.judgemeRating ?? null
  const count = product.judgemeReviewCount ?? null
  const hasReviews = rating !== null && rating > 0
  const productId = product.id.split("/").pop() ?? product.id

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-12 pt-8 border-t border-border"
    >
      <h2 id="reviews-heading" className="eyebrow text-leather mb-4">
        Reseñas
      </h2>

      {hasReviews ? (
        <div className="mb-6">
          <JudgemeStars rating={rating} count={count} size="lg" />
        </div>
      ) : (
        <p className="mb-4 text-sm text-text-muted">
          Aún no hay reseñas de esta bota. ¡Sé el primero en dejar la tuya!
        </p>
      )}

      <ProductReviews handle={product.handle} />

      <ReviewForm productId={productId} productTitle={product.title} />
    </section>
  )
}
