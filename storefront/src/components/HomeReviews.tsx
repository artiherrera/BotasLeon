"use client"

import { useEffect, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useLocale, useT } from "@/lib/i18n/context"
import {
  fetchAllReviews,
  formatReviewDate,
  type JudgemeReview,
} from "@/lib/judgeme/reviews"

/**
 * HomeReviews — prueba social de la portada: tres reseñas reales de la tienda
 * (Judge.me), no de un producto.
 *
 * Solo entran las de CINCO estrellas. Las de cuatro no desaparecen: siguen en
 * la ficha del producto, donde el visitante ve la bota, el precio y el resto de
 * opiniones, y el matiz se entiende. En la portada, fuera de contexto, una de
 * cuatro solo resta.
 *
 * Ya no es carrusel: tres tarjetas fijas. Con ocho reseñas en toda la tienda,
 * un riel con flechas prometía un fondo que no existe.
 *
 * Client component: fetch + DOMParser en cliente, así el home sigue siendo
 * estático — la sección se rellena tras hidratar y, si no hay reseñas, no se
 * pinta nada.
 */
const MAX_CARDS = 3

/**
 * Nombre legible del modelo a partir del handle de Shopify
 * ("bota-lucy-floter-miel" → "Bota Lucy Floter Miel"). El parser de Judge.me
 * guarda solo el handle del producto; el título real vendría del texto del
 * enlace de la reseña, que hoy se descarta en lib/judgeme/reviews.ts.
 */
function nombreDeModelo(handle: string): string {
  return handle
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function HomeReviews() {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "es-MX"
  const [reviews, setReviews] = useState<JudgemeReview[] | null>(null)
  const [total, setTotal] = useState(0)
  const [avg, setAvg] = useState(0)

  useEffect(() => {
    let active = true
    fetchAllReviews()
      .then((all) => {
        if (!active) return
        setTotal(all.length)
        if (all.length) {
          setAvg(all.reduce((s, r) => s + r.rating, 0) / all.length)
        }
        // Cinco estrellas y con texto. Las que traen título se pintan primero:
        // la tarjeta lo pone en display y sin él se ve coja.
        const best = all
          .filter((r) => r.rating === 5 && r.body.trim().length > 3)
          .sort((a, b) => Number(!!b.title) - Number(!!a.title))
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

  if (!reviews || reviews.length === 0) return null

  return (
    <section aria-label={t("reviews.aria")} className="contenedor seccion">
      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-text-muted mb-2">{t("reviews.eyebrow")}</p>
          <h2 className="display-m">{t("reviews.title")}</h2>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <Stars n={Math.round(avg)} />
            <span className="nota">
              {avg.toFixed(1)} · {t("reviews.count").replace("{n}", String(total))}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {reviews.map((r) => (
          <article key={r.id} className="flex flex-col bg-plate p-6">
            <Stars n={r.rating} />
            {r.title && <p className="display-s mt-3">{r.title}</p>}
            <p className="cuerpo medida-lectura mt-2 text-text-muted">{r.body}</p>
            {r.photos.length > 0 && (
              <div className="mt-4 flex gap-2">
                {r.photos.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- imagen de Judge.me
                  <img
                    key={i}
                    src={src}
                    alt={t("review.photoAlt")}
                    className="h-14 w-14 object-cover"
                  />
                ))}
              </div>
            )}
            <div className="mt-auto pt-6">
              <p className="cuerpo font-medium">
                {r.author || t("review.anonymous")}
                {r.date && (
                  <span className="nota"> · {formatReviewDate(r.date, dateLocale)}</span>
                )}
              </p>
              {r.handle && (
                <Link
                  href={`/products/${r.handle}`}
                  className="cuerpo -mb-3 inline-block py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
                >
                  {t("review.onModel").replace("{modelo}", nombreDeModelo(r.handle))}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Stars({ n }: { n: number }) {
  const t = useT()
  return (
    <span
      className="text-leather text-sm leading-none"
      aria-label={t("review.starsAria").replace("{n}", String(n))}
    >
      {"★★★★★".slice(0, n)}
      <span className="text-border">{"★★★★★".slice(n)}</span>
    </span>
  )
}
