"use client"

import { useMemo, useState } from "react"
import { ProductCard } from "./ProductCard"
import { EmptyProductsState } from "./EmptyState"
import type { Product } from "@/lib/shopify/types"

/**
 * ProductsListing — grid de productos con filtro client-side por talla.
 *
 * Server pasa todos los productos como prop. Client extrae el set único
 * de tallas presentes (de las variantes) y permite al usuario filtrar.
 * Cuando llegue Sprint C agregamos más filtros (precio, material, marca)
 * con el mismo patrón.
 *
 * Decisión: client filter en lugar de URL params + dynamic route, porque
 * Amplify Hosting no maneja bien rutas Next 16 dinámicas. El trade-off
 * es que la URL no preserva el filtro (no compartible). Aceptable para MVP.
 */

type Props = {
  products: Product[]
}

const SIZE_OPTION_NAMES = ["Talla", "Talla del calzado", "Size"]

export function ProductsListing({ products }: Props) {
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())

  // Set único de tallas a partir de las options del producto.
  // `options` viene del fragment PRODUCT_CARD_FRAGMENT y es ligero
  // (no requiere fetch de variantes individuales). Filtramos por
  // presencia de la talla, no por stock — un producto agotado en una
  // talla aún se considera "ofrece esa talla".
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    for (const p of products) {
      const sizeOpt = (p.options ?? []).find((o) =>
        SIZE_OPTION_NAMES.includes(o.name)
      )
      if (!sizeOpt) continue
      for (const v of sizeOpt.values) sizes.add(v)
    }
    // Ordenamiento numérico (24, 25, 26... no alfabético).
    return Array.from(sizes).sort((a, b) => {
      const na = parseFloat(a)
      const nb = parseFloat(b)
      if (isNaN(na) || isNaN(nb)) return a.localeCompare(b)
      return na - nb
    })
  }, [products])

  const filtered = useMemo(() => {
    if (selectedSizes.size === 0) return products
    return products.filter((p) => {
      const sizeOpt = (p.options ?? []).find((o) =>
        SIZE_OPTION_NAMES.includes(o.name)
      )
      if (!sizeOpt) return false
      return sizeOpt.values.some((v) => selectedSizes.has(v))
    })
  }, [products, selectedSizes])

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(size)) next.delete(size)
      else next.add(size)
      return next
    })
  }

  const clearFilters = () => setSelectedSizes(new Set())

  return (
    <>
      {/* Toolbar: count + filtros */}
      <div className="mb-8 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-muted">
            {filtered.length} producto{filtered.length === 1 ? "" : "s"}
            {selectedSizes.size > 0 && ` (filtrado de ${products.length})`}
          </p>
          {selectedSizes.size > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs uppercase tracking-wider text-leather hover:text-terracotta"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {availableSizes.length > 0 && (
          <div>
            <p className="eyebrow text-text-muted text-xs mb-2">Talla</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const active = selectedSizes.has(size)
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    aria-pressed={active}
                    className={`min-w-[2.5rem] px-3 py-1.5 text-sm border transition-colors ${
                      active
                        ? "border-leather bg-leather text-bg"
                        : "border-border text-text hover:border-leather"
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid o empty state */}
      {filtered.length === 0 ? (
        selectedSizes.size > 0 ? (
          <div className="border border-border bg-bg-alt p-10 text-center">
            <p className="font-heading text-xl text-text mb-2">
              Sin resultados
            </p>
            <p className="text-text-muted mb-6">
              No hay productos en stock con esas tallas.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <EmptyProductsState
            title="Catálogo en construcción"
            description="Estamos cargando las primeras botas de los talleres de León. Vuelve pronto."
          />
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  )
}
