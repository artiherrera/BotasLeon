"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { PrintSelectionButton } from "@/components/PrintSelectionButton"
import { searchProducts } from "@/lib/search/client"
import { useLocale } from "@/lib/i18n/context"
import type { Product } from "@/lib/shopify/types"

/**
 * /search — búsqueda de productos.
 *
 * Client component (sin server searchParams → la ruta sigue siendo estática en
 * Amplify). El término inicial se lee de ?q= con useSearchParams DENTRO de un
 * Suspense (el patrón soportado por Next para leer query en rutas estáticas;
 * NO la vuelve dinámica en el servidor). Usamos `key={q}` para remontar cuando
 * cambia ?q=, así una nueva búsqueda desde el overlay —estando ya en /search—
 * sí recarga (antes se quedaba con el término viejo). El input filtra con
 * debounce 350ms para no golpear a Shopify en cada tecla.
 */

const DEBOUNCE_MS = 350

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchGate />
    </Suspense>
  )
}

// Lee ?q= y remonta los resultados cuando cambia (key). Así el término inicial
// siempre refleja la URL sin necesidad de sincronizar estado en un effect.
function SearchGate() {
  const q = useSearchParams().get("q") ?? ""
  return <SearchResults key={q} initialQuery={q} />
}

function SearchResults({ initialQuery }: { initialQuery: string }) {
  const { locale } = useLocale()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Product[]>([])
  // Si venimos con un término en la URL, arrancamos en "loading" para no
  // parpadear los shortcuts de categoría antes de que llegue la búsqueda.
  const [loading, setLoading] = useState(Boolean(initialQuery.trim()))
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Debounce: cuando cambia query, esperamos 350ms sin tipear antes de buscar.
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSubmitted(false)
      setError(null)
      return
    }
    // `active` evita una race: si el usuario sigue tecleando, la request en
    // vuelo se ignora al limpiar el effect y no pisa resultados más nuevos.
    let active = true
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const products = await searchProducts(query, 24, locale === "en" ? "EN" : "ES")
        if (!active) return
        setResults(products)
        setSubmitted(true)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error al buscar")
      } finally {
        if (active) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [query, locale])

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          {/* Encabezado de página como el de cualquier listado: a la izquierda.
              El centrado se reserva a la frase de marca. */}
          <div className="mb-8">
            <p className="eyebrow text-xs text-text-muted mb-2">Búsqueda</p>
            <h1 className="display-l text-text mb-3">
              ¿Qué buscas?
            </h1>
            <p className="cuerpo-l medida-lectura text-text-muted">
              Busca por nombre, marca, tipo o material.
            </p>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative max-w-2xl mb-12">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej. vaqueras avestruz, Josepha, botín café..."
              autoFocus
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Buscar productos por nombre, marca, tipo o material"
              className="campo pl-12 pr-28"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 nota">
                Buscando...
              </span>
            )}
          </div>

          {/* Resultados */}
          {error ? (
            <div className="border border-red-300 bg-red-50 text-red-900 p-6 max-w-2xl">
              <p className="cuerpo font-medium mb-2">Error al buscar</p>
              <p className="text-sm font-mono break-all">{error}</p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="py-12 flex items-center justify-center" aria-live="polite">
              <span className="w-7 h-7 border-2 border-border border-t-leather rounded-full animate-spin" />
            </div>
          ) : !submitted ? (
            // Shortcuts mientras no ha buscado nada
            <div>
              <p className="eyebrow text-xs text-text-muted mb-4">
                Explora por categoría
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                {[
                  { label: "Hombre", href: "/hombre" },
                  { label: "Mujer", href: "/mujer" },
                  { label: "Marcas", href: "/marcas" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="btn btn-sec w-full"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 max-w-2xl">
              <p className="display-s text-text mb-2">
                Sin resultados para &ldquo;{query}&rdquo;
              </p>
              <p className="cuerpo medida-lectura text-text-muted mb-6">
                Intenta con menos palabras o palabras más generales (ej. solo
                &ldquo;vaquera&rdquo; en lugar de &ldquo;vaquera café avestruz&rdquo;).
              </p>
              <Link
                href="/products"
                className="btn btn-sec"
              >
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-6 pb-4 border-b border-border">
                <p className="nota">
                  {results.length} resultado{results.length === 1 ? "" : "s"} para{" "}
                  <strong className="text-text">&ldquo;{query}&rdquo;</strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* La descarga de la selección baja del encabezado a debajo del
                  grid, en terciario: mismo sitio y mismo peso que en las
                  páginas de colección. */}
              <div className="mt-10 pt-6 border-t border-border">
                <PrintSelectionButton
                  products={results}
                  contexto={`${locale === "en" ? "Search" : "Búsqueda"}: "${query}"`}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
