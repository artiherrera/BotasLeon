"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { searchProducts } from "@/lib/search/client"
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
        const products = await searchProducts(query)
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
  }, [query])

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="mb-8 text-center">
            <p className="eyebrow text-leather mb-2">Búsqueda</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              ¿Qué buscas?
            </h1>
            <p className="text-text-muted">
              Busca por nombre, marca, tipo o material.
            </p>
          </div>

          {/* Input grande */}
          <div className="relative max-w-2xl mx-auto mb-12">
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
              className="w-full pl-14 pr-6 py-5 text-lg border-2 border-border focus:border-leather focus:outline-none bg-bg transition-colors"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 text-text-subtle"
              width="22"
              height="22"
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
            {loading && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wider text-text-muted">
                Buscando...
              </span>
            )}
          </div>

          {/* Resultados */}
          {error ? (
            <div className="border border-red-300 bg-red-50 text-red-900 rounded-sm p-6 max-w-2xl mx-auto">
              <p className="font-medium mb-2">Error al buscar</p>
              <p className="text-sm font-mono break-all">{error}</p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="py-12 flex items-center justify-center" aria-live="polite">
              <span className="w-7 h-7 border-2 border-border border-t-leather rounded-full animate-spin" />
            </div>
          ) : !submitted ? (
            // Shortcuts mientras no ha buscado nada
            <div>
              <p className="eyebrow text-text-muted text-xs text-center mb-4">
                Explora por categoría
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {[
                  { label: "Hombre", href: "/hombre" },
                  { label: "Mujer", href: "/mujer" },
                  { label: "Marcas", href: "/marcas" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border border-border py-4 text-center text-sm uppercase tracking-wider hover:border-leather hover:text-leather transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 max-w-2xl mx-auto">
              <p className="font-heading text-xl text-text mb-2">
                Sin resultados para &ldquo;{query}&rdquo;
              </p>
              <p className="text-text-muted mb-6">
                Intenta con menos palabras o palabras más generales (ej. solo
                &ldquo;vaquera&rdquo; en lugar de &ldquo;vaquera café avestruz&rdquo;).
              </p>
              <Link
                href="/products"
                className="inline-flex px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-muted mb-6">
                {results.length} resultado{results.length === 1 ? "" : "s"} para{" "}
                <strong className="text-text">&ldquo;{query}&rdquo;</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
