"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import type { Product } from "@/lib/shopify/types"
import { loadProductTranslation } from "./LocalizedProductContent"
import type { SeleccionItem } from "@/lib/seleccion/pdf"

/**
 * Botón "Descargar PDF" — genera un PDF de marca con la selección actual
 * (resultado de la búsqueda o de los filtros): foto + nombre + marca + precio
 * de cada bota. El precio se resuelve por idioma (MXN en español, USD en inglés
 * vía la traducción del producto) para coincidir con lo que muestra el sitio.
 */
export function PrintSelectionButton({
  products,
  contexto,
}: {
  products: Product[]
  contexto: string
}) {
  const { locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const en = locale === "en"

  const handleDownload = async () => {
    if (loading || products.length === 0) return
    setLoading(true)
    try {
      const items: SeleccionItem[] = await Promise.all(
        products.map(async (p) => {
          let title = p.title
          let amount = p.priceRange.minVariantPrice.amount
          let currency = p.priceRange.minVariantPrice.currencyCode
          let compareAt = p.compareAtPriceRange?.minVariantPrice?.amount ?? null

          // En inglés, el sitio muestra el precio USD (traducción del producto).
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

      const fecha = new Date().toLocaleDateString(en ? "en-US" : "es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const { generateSeleccionPdf } = await import("@/lib/seleccion/pdf")
      const blob = await generateSeleccionPdf(items, { contexto, fecha, locale: en ? "en" : "es" })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BotasLeon-seleccion.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("[seleccion-pdf]", err)
      alert(en ? "Could not generate the PDF. Please try again." : "No se pudo generar el PDF. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading || products.length === 0}
      aria-label={en ? "Download selection as PDF" : "Descargar selección en PDF"}
      className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-text-muted hover:border-leather hover:text-leather transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {loading ? (en ? "Generating…" : "Generando…") : "PDF"}
    </button>
  )
}
