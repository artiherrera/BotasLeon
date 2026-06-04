import type { Product } from "@/lib/shopify/types"
import { JudgemeStars } from "./JudgemeStars"

/**
 * ProductReviewBlock — bloque de reseñas para PDP (server component).
 *
 * Estados:
 *   - rating > 0  → estrellas grandes + count + CTA "Ver todas las reseñas"
 *   - sin rating  → "Sé el primero en dejar una reseña" + CTA al mismo URL
 *
 * El CTA apunta al perfil público de Judge.me (`judge.me/shops/{shop}/...`)
 * que ya viene incluido en plan free, sin necesidad de embed JS pesado.
 * El dominio sale de NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN para que funcione
 * tanto en build (env Amplify) como en preview/local.
 *
 * Fallback graceful: si por alguna razón el dominio no está disponible,
 * el link se omite y solo se muestra el texto — nunca se rompe la PDP.
 */

function getJudgemeShopUrl(): string | null {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  if (!domain) return null
  // Judge.me usa el shop_subdomain (parte ANTES del .myshopify.com) en su
  // URL pública de reseñas: https://judge.me/reviews/{shop_subdomain}
  // NO es /shops/{full_domain} (eso da 404).
  const subdomain = domain.replace(/\.myshopify\.com$/i, "")
  return `https://judge.me/reviews/${subdomain}`
}

export function ProductReviewBlock({ product }: { product: Product }) {
  const rating = product.judgemeRating ?? null
  const count = product.judgemeReviewCount ?? null
  const hasReviews = rating !== null && rating > 0

  // shopUrl ya termina en /reviews/{subdomain} — agregar /reviews otra vez
  // genera 404 (lo que vimos). Tampoco existe filtro ?product= público en
  // Judge.me — el usuario aterriza en la lista completa de reseñas de la
  // tienda y filtra desde ahí con el UI nativo de Judge.me.
  const reviewsUrl = getJudgemeShopUrl()

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-12 pt-8 border-t border-border"
    >
      <h2 id="reviews-heading" className="eyebrow text-leather mb-4">
        Reseñas
      </h2>

      {hasReviews ? (
        <div className="flex flex-col gap-3">
          <JudgemeStars rating={rating} count={count} size="lg" />
          {count !== null && count > 0 && (
            <p className="text-text-muted text-sm">
              Basado en {count} reseña{count === 1 ? "" : "s"} verificada{count === 1 ? "" : "s"}.
            </p>
          )}
          {reviewsUrl && (
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 mt-2 text-sm font-medium text-leather hover:text-leather-dark underline underline-offset-4"
            >
              Ver todas las reseñas
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-text font-medium">
            ¿Ya la tienes? Comparte tu experiencia
          </p>
          <p className="text-text-muted text-sm">
            Tu reseña ayuda a otros clientes a decidir con confianza.
          </p>
          {reviewsUrl && (
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 mt-2 text-sm font-medium text-leather hover:text-leather-dark underline underline-offset-4"
            >
              Ir a reseñas
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          )}
        </div>
      )}
    </section>
  )
}
