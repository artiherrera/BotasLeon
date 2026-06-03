"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "./ProductCard"
import { EmptyProductsState } from "./EmptyState"
import type { Product } from "@/lib/shopify/types"

/**
 * ProductsListing — grid con sidebar de filtros (estilo Amazon).
 *
 * Filtros disponibles ahora (todos client-side a partir del fragment
 * PRODUCT_CARD_FRAGMENT que ya tenemos):
 *  - Marca (vendor)
 *  - Talla (de Product.options "Talla del calzado")
 *  - Estilo (Product.productType: Vaqueras, Clásicas, etc.)
 *  - Disponibilidad (en stock vs. todos)
 *
 * Filtros que faltan y vienen en próximas iteraciones cuando agreguemos
 * los metafields al fragment:
 *  - Color, Material (cuero / avestruz / cocodrilo / etc.)
 *  - Sexo objetivo (mejor manejado vía Collections automatizadas)
 *
 * Mobile: el sidebar se vuelve un botón "Filtros" que abre un drawer.
 */

type Props = {
  products: Product[]
}

const SIZE_OPTION_NAMES = ["Talla", "Talla del calzado", "Size"]

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

type FilterState = {
  vendors: Set<string>
  sizes: Set<string>
  types: Set<string>
  colors: Set<string>
  materials: Set<string>
  onlyAvailable: boolean
}

const EMPTY_FILTERS: FilterState = {
  vendors: new Set(),
  sizes: new Set(),
  types: new Set(),
  colors: new Set(),
  materials: new Set(),
  onlyAvailable: false,
}

// Extrae los handles de un metafield de taxonomía (Color, Material, etc.)
// junto con su label legible (campo "label" del metaobject).
function extractTaxonomyValues(
  metafield?: { references?: { edges: Array<{ node: { handle: string; fields: Array<{ key: string; value: string | null }> } }> } } | null
): Array<{ handle: string; label: string }> {
  const edges = metafield?.references?.edges ?? []
  return edges.map((e) => {
    const labelField = e.node.fields.find((f) => f.key === "label")
    return {
      handle: e.node.handle,
      label: labelField?.value || e.node.handle,
    }
  })
}

type SortKey = "default" | "recientes" | "precio-asc" | "precio-desc" | "titulo"

const SORT_LABELS: Record<SortKey, string> = {
  default: "Más vendidos",
  recientes: "Más recientes",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  titulo: "Nombre: A → Z",
}

export function ProductsListing({ products }: Props) {
  // Lectura del filtro de subcategoría directo desde la URL.
  // useSearchParams se re-evalúa en cada navegación dentro del mismo
  // segmento (ej. /hombre?estilo=vaqueras → /hombre?estilo=clasicas),
  // cosa que un prop server-side no hace porque el client component
  // no se remonta. .get() ya devuelve solo el primer valor → cubre el
  // edge case ?estilo=a&estilo=b. Trim por si llega con espacios.
  const searchParams = useSearchParams()
  const estilo = searchParams.get("estilo")?.trim() ?? ""

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [mobileOpen, setMobileOpen] = useState(false)

  // Sincroniza el filtro types con ?estilo de la URL.
  // - Cuando estilo cambia a un valor no vacío: reseteamos TODOS los filtros
  //   y aplicamos solo el matching productType. Es un cambio de subcategoría
  //   de nav (top-level), no un toggle del sidebar — limpiar es lo correcto.
  // - Cuando estilo está vacío: no tocamos nada, para no pisar filtros que
  //   el usuario haya armado manualmente.
  // - Si no encontramos match para el estilo (productType inexistente),
  //   usamos el valor crudo como sentinela → empty state "Sin resultados".
  useEffect(() => {
    if (!estilo) return
    const target = normalize(estilo)
    const matching = new Set(
      products
        .map((p) => p.productType)
        .filter(Boolean)
        .filter((t) => normalize(t) === target)
    )
    setFilters({
      ...EMPTY_FILTERS,
      types: matching.size > 0 ? matching : new Set([estilo]),
    })
  }, [estilo, products])

  // === Facetas — qué opciones mostrar en sidebar ===

  const facets = useMemo(() => {
    const vendors = new Set<string>()
    const sizes = new Set<string>()
    const types = new Set<string>()
    // Mapas handle → label para mostrar nombres legibles ("Negro" en vez de "negro")
    const colorMap = new Map<string, string>()
    const materialMap = new Map<string, string>()

    for (const p of products) {
      if (p.vendor) vendors.add(p.vendor)
      if (p.productType) types.add(p.productType)
      const sizeOpt = (p.options ?? []).find((o) =>
        SIZE_OPTION_NAMES.includes(o.name)
      )
      if (sizeOpt) for (const v of sizeOpt.values) sizes.add(v)

      for (const c of extractTaxonomyValues(p.color)) {
        colorMap.set(c.handle, c.label)
      }
      for (const m of extractTaxonomyValues(p.material)) {
        materialMap.set(m.handle, m.label)
      }
    }
    const sortNumeric = (a: string, b: string) => {
      const na = parseFloat(a)
      const nb = parseFloat(b)
      if (isNaN(na) || isNaN(nb)) return a.localeCompare(b)
      return na - nb
    }
    return {
      vendors: Array.from(vendors).sort(),
      sizes: Array.from(sizes).sort(sortNumeric),
      types: Array.from(types).sort(),
      colors: Array.from(colorMap.entries())
        .map(([handle, label]) => ({ handle, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      materials: Array.from(materialMap.entries())
        .map(([handle, label]) => ({ handle, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }
  }, [products])

  // === Productos filtrados ===

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.onlyAvailable && !p.availableForSale) return false

      if (filters.vendors.size > 0 && !filters.vendors.has(p.vendor)) return false

      if (filters.types.size > 0 && !filters.types.has(p.productType)) return false

      if (filters.sizes.size > 0) {
        const sizeOpt = (p.options ?? []).find((o) =>
          SIZE_OPTION_NAMES.includes(o.name)
        )
        if (!sizeOpt) return false
        const hasSize = sizeOpt.values.some((v) => filters.sizes.has(v))
        if (!hasSize) return false
      }

      if (filters.colors.size > 0) {
        const colors = extractTaxonomyValues(p.color)
        if (!colors.some((c) => filters.colors.has(c.handle))) return false
      }

      if (filters.materials.size > 0) {
        const materials = extractTaxonomyValues(p.material)
        if (!materials.some((m) => filters.materials.has(m.handle))) return false
      }

      return true
    })
  }, [products, filters])

  // Sort después de filtrar — default conserva el orden del server (BEST_SELLING).
  // Hacemos copia para no mutar el array filtrado.
  const sorted = useMemo(() => {
    if (sortKey === "default") return filtered
    const arr = [...filtered]
    switch (sortKey) {
      case "recientes":
        return arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      case "precio-asc":
        return arr.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount)
        )
      case "precio-desc":
        return arr.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount)
        )
      case "titulo":
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return arr
    }
  }, [filtered, sortKey])

  const activeCount =
    filters.vendors.size +
    filters.sizes.size +
    filters.types.size +
    filters.colors.size +
    filters.materials.size +
    (filters.onlyAvailable ? 1 : 0)

  const clearAll = () => setFilters(EMPTY_FILTERS)

  const toggle = (
    key: "vendors" | "sizes" | "types" | "colors" | "materials",
    value: string
  ) => {
    setFilters((prev) => {
      const next = new Set(prev[key])
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...prev, [key]: next }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8">
      {/* Sidebar desktop / drawer mobile */}
      <aside
        className={`
          ${mobileOpen ? "fixed inset-0 z-50 bg-bg overflow-y-auto" : "hidden"}
          lg:block lg:static lg:bg-transparent lg:overflow-visible lg:z-auto
        `}
      >
        {/* Header drawer mobile */}
        {mobileOpen && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-border lg:hidden sticky top-0 bg-bg">
            <h2 className="font-heading text-xl">Filtros</h2>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar filtros"
              className="p-2 -mr-2 hover:bg-bg-alt rounded"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className={mobileOpen ? "px-6 py-4 space-y-6" : "space-y-6 lg:sticky lg:top-24"}>
          {/* Header sidebar desktop */}
          <div className="hidden lg:flex items-center justify-between pb-3 border-b border-border">
            <h2 className="font-heading text-base text-text">Filtros</h2>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs uppercase tracking-wider text-leather hover:text-terracotta"
              >
                Limpiar ({activeCount})
              </button>
            )}
          </div>

          {/* Disponibilidad */}
          <FilterSection title="Disponibilidad">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, onlyAvailable: e.target.checked }))
                }
                className="rounded border-border accent-leather"
              />
              Solo en stock
            </label>
          </FilterSection>

          {/* Marca */}
          {facets.vendors.length > 0 && (
            <FilterSection title="Marca">
              <div className="space-y-2">
                {facets.vendors.map((vendor) => (
                  <label key={vendor} className="flex items-center gap-2 cursor-pointer text-sm hover:text-leather">
                    <input
                      type="checkbox"
                      checked={filters.vendors.has(vendor)}
                      onChange={() => toggle("vendors", vendor)}
                      className="rounded border-border accent-leather"
                    />
                    <span className="flex-1">{vendor}</span>
                    <span className="text-xs text-text-subtle">
                      {products.filter((p) => p.vendor === vendor).length}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Estilo */}
          {facets.types.length > 0 && (
            <FilterSection title="Estilo">
              <div className="space-y-2">
                {facets.types.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-sm hover:text-leather">
                    <input
                      type="checkbox"
                      checked={filters.types.has(type)}
                      onChange={() => toggle("types", type)}
                      className="rounded border-border accent-leather"
                    />
                    <span className="flex-1">{type}</span>
                    <span className="text-xs text-text-subtle">
                      {products.filter((p) => p.productType === type).length}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Talla */}
          {facets.sizes.length > 0 && (
            <FilterSection title="Talla">
              <div className="flex flex-wrap gap-2">
                {facets.sizes.map((size) => {
                  const active = filters.sizes.has(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggle("sizes", size)}
                      aria-pressed={active}
                      className={`min-w-[2.5rem] px-3 py-1.5 text-xs border transition-colors ${
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
            </FilterSection>
          )}

          {/* Color — datos del metafield shopify.color-pattern */}
          {facets.colors.length > 0 && (
            <FilterSection title="Color">
              <div className="space-y-2">
                {facets.colors.map(({ handle, label }) => (
                  <label
                    key={handle}
                    className="flex items-center gap-2 cursor-pointer text-sm hover:text-leather"
                  >
                    <input
                      type="checkbox"
                      checked={filters.colors.has(handle)}
                      onChange={() => toggle("colors", handle)}
                      className="rounded border-border accent-leather"
                    />
                    <span className="flex-1">{label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Material — datos del metafield shopify.shoe-material */}
          {facets.materials.length > 0 && (
            <FilterSection title="Material">
              <div className="space-y-2">
                {facets.materials.map(({ handle, label }) => (
                  <label
                    key={handle}
                    className="flex items-center gap-2 cursor-pointer text-sm hover:text-leather"
                  >
                    <input
                      type="checkbox"
                      checked={filters.materials.has(handle)}
                      onChange={() => toggle("materials", handle)}
                      className="rounded border-border accent-leather"
                    />
                    <span className="flex-1">{label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Footer drawer mobile */}
          {mobileOpen && (
            <div className="pt-4 sticky bottom-0 bg-bg border-t border-border -mx-6 px-6 py-4 flex gap-3">
              <button
                onClick={clearAll}
                className="flex-1 py-3 border border-border text-sm uppercase tracking-wider hover:border-leather"
              >
                Limpiar
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text"
              >
                Ver {filtered.length}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main: toolbar + grid */}
      <div>
        {/* Toolbar — count, sort, filtros button (mobile) */}
        <div className="mb-6 pb-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">
            {sorted.length} producto{sorted.length === 1 ? "" : "s"}
            {activeCount > 0 && (
              <span className="text-text-subtle"> de {products.length}</span>
            )}
          </p>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <label className="text-xs text-text-muted hidden sm:inline">
              Ordenar
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Ordenar productos por"
              className="text-sm bg-bg border border-border px-3 py-1.5 hover:border-leather focus:outline-none focus:border-leather cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>

            {/* Mobile: abre drawer de filtros */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-1.5 border border-border text-xs uppercase tracking-wider hover:border-leather"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              Filtros
              {activeCount > 0 && (
                <span className="bg-leather text-bg w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Grid o empty state */}
        {sorted.length === 0 ? (
          activeCount > 0 ? (
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">
                Sin resultados
              </p>
              <p className="text-text-muted mb-6">
                Ningún producto coincide con los filtros aplicados.
              </p>
              <button
                onClick={clearAll}
                className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <EmptyProductsState
              title="Catálogo en construcción"
              description="Estamos cargando las primeras botas de los talleres de León."
            />
          )
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="pb-5 border-b border-border last:border-b-0">
      <p className="eyebrow text-text text-xs mb-3">{title}</p>
      {children}
    </div>
  )
}
