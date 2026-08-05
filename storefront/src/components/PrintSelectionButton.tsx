"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import type { Product } from "@/lib/shopify/types"
import { loadProductTranslation } from "./LocalizedProductContent"
import type { SeleccionItem } from "@/lib/seleccion/pdf"

/**
 * Botones "PDF" / "PNG" — descargan la selección actual (resultado de la
 * búsqueda o de los filtros) con foto + nombre + marca + precio de cada bota.
 *
 * - PDF: documento de marca (multi-página). Bueno para imprimir / adjuntar.
 * - PNG: una sola imagen. Ideal para compartir por WhatsApp.
 *
 * El precio se resuelve por idioma (MXN en español, USD en inglés vía la
 * traducción del producto) para coincidir con lo que muestra el sitio.
 */

type Format = "pdf" | "png"

export function PrintSelectionButton({
  products,
  contexto,
}: {
  products: Product[]
  contexto: string
}) {
  const { locale } = useLocale()
  const [busy, setBusy] = useState<Format | null>(null)
  const en = locale === "en"

  // Arma los ítems resolviendo título/precio por idioma (compartido por ambos formatos).
  const buildItems = async (): Promise<SeleccionItem[]> =>
    Promise.all(
      products.map(async (p) => {
        let title = p.title
        let amount = p.priceRange.minVariantPrice.amount
        let currency = p.priceRange.minVariantPrice.currencyCode
        let compareAt = p.compareAtPriceRange?.minVariantPrice?.amount ?? null

        if (en) {
          const t = await loadProductTranslation(p.handle)
          if (t) {
            if (t.title) title = t.title
            if (t.price) {
              amount = t.price.amount
              currency = t.price.currencyCode
            }
            compareAt = t.compareAtPrice?.amount ?? null
          }
        }

        return {
          title,
          brand: p.vendor || "",
          imageUrl: p.featuredImage?.url ?? null,
          amount,
          currency,
          compareAt,
        }
      })
    )

  const download = async (format: Format) => {
    if (busy || products.length === 0) return
    setBusy(format)
    try {
      const items = await buildItems()
      const fecha = new Date().toLocaleDateString(en ? "en-US" : "es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const meta = { contexto, fecha, locale: (en ? "en" : "es") as "es" | "en" }

      let blob: Blob
      let ext: string
      if (format === "pdf") {
        const { generateSeleccionPdf } = await import("@/lib/seleccion/pdf")
        blob = await generateSeleccionPdf(items, meta)
        ext = "pdf"
      } else {
        const { generateSeleccionPng } = await import("@/lib/seleccion/png")
        blob = await generateSeleccionPng(items, meta)
        ext = "png"
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BotasLeon-seleccion.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("[seleccion]", err)
      alert(en ? "Could not generate the file. Please try again." : "No se pudo generar el archivo. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  const btnClass =
    "inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-text-muted hover:border-leather hover:text-leather transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  const Spinner = () => (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
  const DownloadIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => download("pdf")}
        disabled={busy !== null || products.length === 0}
        aria-label={en ? "Download selection as PDF" : "Descargar selección en PDF"}
        className={btnClass}
      >
        {busy === "pdf" ? <Spinner /> : <DownloadIcon />}
        {busy === "pdf" ? (en ? "PDF…" : "PDF…") : "PDF"}
      </button>
      <button
        type="button"
        onClick={() => download("png")}
        disabled={busy !== null || products.length === 0}
        aria-label={en ? "Download selection as image (PNG)" : "Descargar selección como imagen (PNG)"}
        className={btnClass}
      >
        {busy === "png" ? <Spinner /> : <DownloadIcon />}
        {busy === "png" ? "PNG…" : "PNG"}
      </button>
    </div>
  )
}
