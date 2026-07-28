"use client"

import { useEffect, useState } from "react"
import { useLocale, useT } from "@/lib/i18n/context"

/**
 * ProductReviews — muestra las reseñas (con fotos) de UNA bota, nativas en el
 * sitio (headless).
 *
 * El widget por-producto de Judge.me no genera caché para tiendas headless
 * (devuelve vacío). En cambio el widget "all_reviews_page" SÍ trae todas las
 * reseñas publicadas con su producto y fotos. Traemos ese HTML con el token
 * PÚBLICO (solo lectura), lo parseamos con DOMParser, filtramos por el handle
 * de esta bota y lo renderizamos con el diseño de la marca.
 *
 * Nota: trae la primera página de reseñas de la tienda; con catálogos de muchas
 * reseñas habrá que paginar. Para el volumen actual es de sobra.
 */
const PUBLIC_TOKEN = "iIcQclYkCEcfwi_C0LCAJNDDxqU"
const SHOP = "na4ngw-dn.myshopify.com"

type Review = {
  id: string
  rating: number
  author: string
  date: string
  title: string
  body: string
  photos: string[]
  verified: boolean
}

function fmtDate(s: string, dateLocale: string): string {
  const d = new Date(s.replace(" UTC", "").replace(" ", "T") + "Z")
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })
}

export function ProductReviews({ handle }: { handle: string }) {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "es-MX"
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    let active = true
    fetch(
      `https://judge.me/api/v1/widgets/all_reviews_page?api_token=${PUBLIC_TOKEN}&shop_domain=${SHOP}&platform=shopify`
    )
      .then((r) => r.json())
      .then((d: { all_reviews?: string }) => {
        if (!active) return
        const doc = new DOMParser().parseFromString(d.all_reviews ?? "", "text/html")
        const out: Review[] = []
        doc.querySelectorAll(".jdgm-rev").forEach((el) => {
          const href =
            el.querySelector(".jdgm-rev__prod-link")?.getAttribute("href") ?? ""
          const m = href.match(/\/products\/([^#?/]+)/)
          if (!m || m[1] !== handle) return
          const seen = new Set<string>()
          const photos = Array.from(el.querySelectorAll("img"))
            .map((img) => img.getAttribute("data-src") || img.getAttribute("src") || "")
            .filter((s) => s.includes("review-images"))
            .filter((s) => {
              const base = s.split("?")[0]
              if (seen.has(base)) return false
              seen.add(base)
              return true
            })
          out.push({
            id: el.getAttribute("data-review-id") ?? String(out.length),
            rating: parseInt(el.querySelector(".jdgm-rev__rating")?.getAttribute("data-score") ?? "0", 10) || 0,
            author: el.querySelector(".jdgm-rev__author")?.textContent?.trim() || "",
            date: el.querySelector(".jdgm-rev__timestamp")?.getAttribute("data-content") ?? "",
            title: el.querySelector(".jdgm-rev__title")?.textContent?.trim() ?? "",
            body: el.querySelector(".jdgm-rev__body")?.textContent?.trim() ?? "",
            verified: el.getAttribute("data-verified-buyer") === "true",
            photos,
          })
        })
        setReviews(out)
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
