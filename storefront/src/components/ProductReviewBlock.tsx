import type { Product } from "@/lib/shopify/types"
import { JudgemeWidget } from "./JudgemeWidget"

/**
 * ProductReviewBlock — sección de reseñas del PDP.
 *
 * Embebe el widget oficial de Judge.me (ver JudgemeWidget): muestra las reseñas
 * con fotos + galería + resumen de estrellas + formulario nativo para escribir
 * (con subida de fotos incluida). Las estrellas compactas de las TARJETAS del
 * grid siguen saliendo del metacampo reviews.rating (JudgemeStars en ProductCard),
 * independientes de este widget.
 */
export function ProductReviewBlock({ product }: { product: Product }) {
  // ID externo (numérico) para el widget: "gid://shopify/Product/123" → "123".
  const productId = product.id.split("/").pop() ?? product.id

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-12 pt-8 border-t border-border"
    >
      <h2 id="reviews-heading" className="eyebrow text-leather mb-4">
        Reseñas
      </h2>
      <JudgemeWidget productId={productId} productTitle={product.title} />
    </section>
  )
}
