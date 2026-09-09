"use client"

import { useEffect, useState } from "react"
import { useLocale, useT } from "@/lib/i18n/context"
import {
  fetchAllReviews,
  formatReviewDate as fmtDate,
  type JudgemeReview as Review,
} from "@/lib/judgeme/reviews"

/**
 * ProductReviews — muestra las reseñas (con fotos) de UNA bota, nativas en el
 * sitio (headless). Trae TODAS las reseñas de la tienda (widget all_reviews_page,
 * token público) vía lib/judgeme/reviews y filtra por el handle de esta bota.
 */
export function ProductReviews({ handle }: { handle: string }) {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "es-MX"
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    let active = true
    fetchAllReviews()
      .then((all) => {
        if (active) setReviews(all.filter((r) => r.handle === handle))
      })
      .catch(() => {
        if (active) setReviews([])
      })
    return () => {
      active = false
    }
  }, [handle])

  if (!reviews || reviews.length === 0) return null

  return (
    <div className="mb-8 space-y-6">
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-border/60 pb-6 last:border-0">
          <div className="mb-1 flex items-center gap-2">
            <Stars n={r.rating} />
            {/* Ningún texto por debajo de 12px: el 10px de antes no se leía en
                móvil, que es donde se leen las reseñas. */}
            {r.verified && (
              <span className="eyebrow text-text-muted">
                {t("review.verified")}
              </span>
            )}
          </div>
          <p className="cuerpo font-medium text-text">
            {r.author || t("review.anonymous")}
            {r.date && (
              <span className="font-normal text-text-muted"> · {fmtDate(r.date, dateLocale)}</span>
            )}
          </p>
          {/* El título de reseña es uno de los cinco lugares de la serif. */}
          {r.title && <p className="display-s text-text mt-1">{r.title}</p>}
          {r.body && (
            <p className="cuerpo medida-lectura mt-1 text-text-muted">{r.body}</p>
          )}
          {/* plato-foto y no plato a secas: la foto la tomó el cliente con su
              teléfono, no es una toma de estudio sobre fondo claro, y el
              multiply sobre medios tonos la ensucia. */}
          {r.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.photos.map((src, i) => (
                <a
                  key={i}
                  href={src.replace(/([?&])width=\d+/, "$1width=1200")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plato plato-foto block h-16 w-16 transition-opacity duration-[180ms] hover:opacity-80"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida por Judge.me */}
                  <img src={src} alt={t("review.photoAlt")} />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Stars({ n }: { n: number }) {
  const t = useT()
  return (
    <span className="text-gold" aria-label={t("review.starsAria").replace("{n}", String(n))}>
      {"★★★★★".slice(0, n)}
      <span className="text-border">{"★★★★★".slice(n)}</span>
    </span>
  )
}
