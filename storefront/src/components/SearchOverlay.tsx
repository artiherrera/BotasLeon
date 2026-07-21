"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { searchProducts } from "@/lib/search/client"
import { track } from "@/lib/klaviyo/client"
import { formatMoney } from "@/lib/utils"
import type { Product } from "@/lib/shopify/types"

/**
 * SearchOverlay — modal predictivo de búsqueda.
 *
 * Reemplaza la navegación a /search desde la lupa del Header. /search
 * sigue existiendo como fallback para link directo / no-JS / a11y.
 *
 * Pattern:
 *  - createPortal a document.body (después de mounted, evita SSR mismatch)
 *  - Debounce 250ms al input → searchProducts client-side
 *  - Estado vacío → "Búsquedas populares" con chips
 *  - ESC / backdrop click → onClose
 *  - Focus trap simple (Tab loop) + autoFocus al input
 *  - Track Klaviyo en cada búsqueda debounced
 */

type Props = {
  open: boolean
  onClose: () => void
}

const DEBOUNCE_MS = 250

const POPULAR_SEARCHES = [
  { label: "Vaqueras", query: "vaquera" },
  { label: "Clásicas", query: "clasica" },
  { label: "Exóticas", query: "exotica" },
  { label: "Josepha", query: "josepha" },
]

export function SearchOverlay({ open, onClose }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // Enter en el input lleva a /search?q=X (la página de búsqueda real, que sí
  // filtra). Antes iba a /products?query=, pero /products es estática e ignora
  // el parámetro → mostraba TODO el catálogo. Sin esto la tecla "search" del
  // teclado móvil (enterKeyHint="search") es no-op.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    onClose()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  // Mount gate — evita SSR mismatch al usar createPortal.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset state cuando se cierra — la próxima vez que abra arranca limpio.
  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setSubmitted(false)
      setLoading(false)
    }
  }, [open])

  // AutoFocus al input cuando abre (autoFocus prop no siempre funciona
  // si el input se monta dentro de portal después del open=true).
  useEffect(() => {
    if (open && inputRef.current) {
      // Microtask delay para asegurar que el portal está pintado.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  // ESC cierra.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  // Bloquea scroll del body mientras el overlay está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Debounce search → fetch + track Klaviyo.
  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSubmitted(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const handle = window.setTimeout(async () => {
      try {
        const products = await searchProducts(trimmed, 8)
        setResults(products)
        setSubmitted(true)
        // Klaviyo on-site event — útil para flows tipo "Searched but no buy".
        track("Searched Site", { SearchTerm: trimmed })
      } catch (e) {
        // Fallar silenciosamente para no bloquear UX. Logueamos para diagnóstico.
        console.error("[SearchOverlay] search error:", e instanceof Error ? e.message : e)
        setResults([])
        setSubmitted(true)
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, open])

  // Focus trap simple — Tab/Shift+Tab hace loop dentro del modal.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !modalRef.current) return
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  if (!mounted) return null

  const overlay = (
    <div
      // inert no acepta boolean false en React DOM — solo lo pasamos cuando aplica.
      {...(!open ? { inert: "" as unknown as boolean } : {})}
      aria-hidden={!open}
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none opacity-0"}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/60 cursor-default"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        className="relative mx-auto mt-20 w-full max-w-2xl bg-bg rounded-sm shadow-2xl p-6 max-h-[calc(100vh-6rem)] overflow-y-auto"
      >
        {/* Header del modal: input + cerrar */}
        <form
          onSubmit={handleSubmit}
          role="search"
          className="flex items-center gap-3 mb-6"
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar botas, marcas, modelos..."
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Término de búsqueda"
              className="w-full pl-12 pr-4 py-3 text-base border border-border focus:border-leather focus:outline-none bg-bg transition-colors rounded-sm"
            />
            {loading && (
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-leather rounded-full animate-spin"
                aria-label="Buscando"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-bg-alt rounded transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </form>

        {/* Cuerpo: estados */}
        {!query.trim() ? (
          <div>
            <p className="eyebrow text-text-muted text-xs mb-3">Búsquedas populares</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((item) => (
                <Link
                  key={item.query}
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  onClick={onClose}
                  className="px-4 py-2 border border-border text-sm hover:border-leather hover:text-leather transition-colors rounded-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : loading && results.length === 0 ? (
          <div className="py-8 flex items-center justify-center" aria-live="polite">
            <span className="w-6 h-6 border-2 border-border border-t-leather rounded-full animate-spin" />
          </div>
        ) : submitted && results.length === 0 ? (
          <div className="py-8 text-center" aria-live="polite">
            <p className="text-text-muted">
              No encontramos productos para{" "}
              <strong className="text-text">&ldquo;{query}&rdquo;</strong>. Intenta otra búsqueda.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((p) => (
                <SearchResultCard key={p.id} product={p} onSelect={onClose} />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/40 text-center">
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                className="inline-flex text-sm uppercase tracking-wider text-leather hover:underline"
              >
                Ver todos los resultados
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

// Tarjeta compacta para resultados del overlay: thumb + nombre + precio.
// Miniatura vía el redimensionado nativo del CDN de Shopify (?width=), servida
// directo al navegador SIN pasar por el optimizador de Next. En Amplify, esas
// imágenes client-side del overlay se rompían (cuadros grises); el CDN de
// Shopify las entrega ya redimensionadas y ligeras, y evita el optimizador.
function shopifyThumb(url: string, width: number): string {
  return url + (url.includes("?") ? "&" : "?") + `width=${width}`
}

function SearchResultCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: () => void
}) {
  const { handle, title, vendor, featuredImage, priceRange } = product
  const minPrice = priceRange.minVariantPrice

  return (
    <Link
      href={`/products/${handle}`}
      onClick={onSelect}
      className="group flex items-center gap-3 p-2 hover:bg-bg-alt rounded-sm transition-colors"
      aria-label={`Ver ${title}`}
    >
      <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-bg-alt rounded-sm">
        {featuredImage ? (
          <Image
            src={shopifyThumb(featuredImage.url, 128)}
            alt={featuredImage.altText || title}
            width={64}
            height={64}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        {vendor && (
          <p className="eyebrow text-text-subtle text-[10px] mb-0.5 truncate">{vendor}</p>
        )}
        <h4 className="font-heading text-sm text-text leading-tight truncate group-hover:text-leather transition-colors">
          {title}
        </h4>
        <p className="text-text-muted text-xs mt-0.5">
          {formatMoney(minPrice.amount, minPrice.currencyCode)}
        </p>
      </div>
    </Link>
  )
}
