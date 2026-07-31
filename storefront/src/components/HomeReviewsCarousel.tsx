"use client"

import { useEffect, useRef, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useLocale, useT } from "@/lib/i18n/context"
import {
  fetchAllReviews,
  formatReviewDate,
  type JudgemeReview,
} from "@/lib/judgeme/reviews"

/**
 * HomeReviewsCarousel — prueba social GENERAL del home: carrusel con las mejores
 * reseñas reales de toda la tienda (Judge.me, todas las botas), no las de un
 * producto. Va después de "Hecho en León".
 *
 * Trae todas las reseñas (lib/judgeme/reviews), se queda con las de 4-5★ con
 * texto, y las rota en un carrusel de marca. Si no hay reseñas, no renderiza nada
 * (la sección desaparece sola). Client component: fetch + DOMParser en cliente,
 * así el home sigue siendo estático (SSG) — se rellena tras hidratar.
 */
const MAX_CARDS = 14

export function HomeReviewsCarousel() {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "es-MX"
  const [reviews, setReviews] = useState<JudgemeReview[] | null>(null)
  const [total, setTotal] = useState(0)
  const [avg, setAvg] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetchAllReviews()
      .then((all) => {
        if (!active) return
        setTotal(all.length)
        if (all.length) {
          setAvg(all.reduce((s, r) => s + r.rating, 0) / all.length)
        }
        // Solo testimonios positivos con texto (4-5★). Verificadas primero.
        const best = all
          .filter((r) => r.rating >= 4 && r.body.trim().length > 3)
          .sort((a, b) => Number(b.verified) - Number(a.verified))
          .slice(0, MAX_CARDS)
        setReviews(best)
      })
      .catch(() => {
        if (active) setReviews([])
      })
    return () => {
      active = false
    }
  }, [])

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" })
  }

  if (!reviews || reviews.length === 0) return null

  return (
    <section
      aria-label={t("reviews.aria")}
      className="bg-bg-alt/60 border-y border-border/50 py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-leather mb-2">{t("reviews.eyebrow")}</p>
            <h2 className="font-display text-3xl md:text-4xl text-text">
              {t("reviews.title")}
            </h2>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 text-text-muted">
              <Stars n={Math.round(avg)} />
              <span className="text-sm">
                <span className="font-semibold text-text">{avg.toFixed(1)}</span> ·{" "}
                {t("reviews.count").replace("{n}", String(total))}
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          {/* Track con scroll-snap (swipe en móvil, flechas en desktop) */}
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((r) => (
              <article
                key={r.id}
                className="flex w-[280px] shrink-0 snap-start flex-col rounded-lg border border-border bg-bg p-5 sm:w-[320px]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Stars n={r.rating} />
                  {r.verified && (
                    <span className="text-[10px] uppercase tracking-wider text-leather">
                      {t("review.verified")}
                    </span>
                  )}
                </div>
                {r.title && (
                  <p className="font-heading text-text mb-1 line-clamp-1">{r.title}</p>
                )}
                <p className="text-sm leading-relaxed text-text-muted line-clamp-5">
                  {r.body}
                </p>
                {r.photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.photos.slice(0, 3).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element -- imagen de Judge.me
                      <img
                        key={i}
                        src={src}
                        alt={t("review.photoAlt")}
                        className="h-14 w-14 rounded-sm border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <p className="text-sm font-medium text-text">
                    {r.author || t("review.anonymous")}
                    {r.date && (
                      <span className="font-normal text-text-subtle">
                        {" "}
                        · {formatReviewDate(r.date, dateLocale)}
                      </span>
                    )}
                  </p>
                  {r.handle && (
                    <Link
                      href={`/products/${r.handle}`}
                      className="mt-1 inline-block text-xs uppercase tracking-wider text-leather hover:text-leather-light transition-colors"
                    >
                      {t("reviews.seeBoot")}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Flechas (desktop) */}
          {reviews.length > 3 && (
            <div className="mt-5 hidden justify-end gap-2 md:flex">
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label={t("reviews.prev")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-leather text-leather transition-colors hover:bg-leather hover:text-bg"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label={t("reviews.next")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-leather text-leather transition-colors hover:bg-leather hover:text-bg"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Stars({ n }: { n: number }) {
  const t = useT()
  return (
    <span
      className="text-gold text-sm leading-none"
      aria-label={t("review.starsAria").replace("{n}", String(n))}
    >
      {"★★★★★".slice(0, n)}
      <span className="text-border">{"★★★★★".slice(n)}</span>
    </span>
  )
}
