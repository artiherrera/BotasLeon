/**
 * Reseñas de Judge.me para la tienda (headless).
 *
 * El widget por-producto de Judge.me no cachea para tiendas headless (devuelve
 * vacío), pero el widget "all_reviews_page" SÍ trae TODAS las reseñas publicadas
 * (con producto, autor y fotos) usando el token PÚBLICO de solo lectura. Traemos
 * ese HTML y lo parseamos con DOMParser → objetos Review.
 *
 * Lo usan: ProductReviews (filtra por handle en la PDP) y HomeReviewsCarousel
 * (todas, para la prueba social del home). Corre SOLO en cliente (DOMParser).
 */
const PUBLIC_TOKEN = "iIcQclYkCEcfwi_C0LCAJNDDxqU"
const SHOP = "na4ngw-dn.myshopify.com"

export type JudgemeReview = {
  id: string
  rating: number
  author: string
  date: string
  title: string
  body: string
  photos: string[]
  verified: boolean
  /** Handle del producto reseñado (para filtrar/enlazar). "" si no se pudo leer. */
  handle: string
}

/** Trae y parsea TODAS las reseñas publicadas de la tienda. Solo en cliente. */
export async function fetchAllReviews(): Promise<JudgemeReview[]> {
  const res = await fetch(
    `https://judge.me/api/v1/widgets/all_reviews_page?api_token=${PUBLIC_TOKEN}&shop_domain=${SHOP}&platform=shopify`
  )
  const data = (await res.json()) as { all_reviews?: string }
  const doc = new DOMParser().parseFromString(data.all_reviews ?? "", "text/html")
  const out: JudgemeReview[] = []
  doc.querySelectorAll(".jdgm-rev").forEach((el) => {
    const href = el.querySelector(".jdgm-rev__prod-link")?.getAttribute("href") ?? ""
    const m = href.match(/\/products\/([^#?/]+)/)
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
      rating:
        parseInt(
          el.querySelector(".jdgm-rev__rating")?.getAttribute("data-score") ?? "0",
          10
        ) || 0,
      author: el.querySelector(".jdgm-rev__author")?.textContent?.trim() || "",
      date: el.querySelector(".jdgm-rev__timestamp")?.getAttribute("data-content") ?? "",
      title: el.querySelector(".jdgm-rev__title")?.textContent?.trim() ?? "",
      body: el.querySelector(".jdgm-rev__body")?.textContent?.trim() ?? "",
      verified: el.getAttribute("data-verified-buyer") === "true",
      photos,
      handle: m ? m[1] : "",
    })
  })
  return out
}

/** Formatea la fecha de una reseña al locale dado. */
export function formatReviewDate(s: string, dateLocale: string): string {
  const d = new Date(s.replace(" UTC", "").replace(" ", "T") + "Z")
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })
}
