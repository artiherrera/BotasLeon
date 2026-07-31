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
            {r.verified && (
              <span className="text-[10px] uppercase tracking-wider text-leather">
                {t("review.verified")}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-text">
            {r.author || t("review.anonymous")}
            {r.date && (
              <span className="font-normal text-text-subtle"> · {fmtDate(r.date, dateLocale)}</span>
            )}
          </p>
          {r.title && <p className="font-heading text-text mt-1">{r.title}</p>}
          {r.body && (
            <p className="mt-1 text-sm leading-relaxed text-text-muted">{r.body}</p>
          )}
          {r.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.photos.map((src, i) => (
                <a
                  key={i}
                  href={src.replace(/([?&])width=\d+/, "$1width=1200")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-sm border border-border transition-opacity hover:opacity-80"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida por Judge.me */}
                  <img src={src} alt={t("review.photoAlt")} className="h-full w-full object-cover" />
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
