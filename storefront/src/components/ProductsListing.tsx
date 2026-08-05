"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "./ProductCard"
import { PrintSelectionButton } from "./PrintSelectionButton"
import { EmptyProductsState } from "./EmptyState"
import { loadMoreProducts } from "@/lib/search/client"
import type { Product, PageInfo } from "@/lib/shopify/types"
import { useFocusTrap } from "@/lib/useFocusTrap"
import { lookupColor } from "@/lib/pdp/colorLut"
import { bootStyleLabel } from "@/lib/shopify/taxonomy"
import { useT, useLocale } from "@/lib/i18n/context"

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
  // Estilo pre-aplicado vía server-side (sub-rutas /hombre/vaqueras, etc.).
  // Tiene precedencia sobre ?estilo= legacy. Si está ausente, caemos al
  // query-string para no romper bookmarks viejos.
  initialStyle?: string
  // Cursor pagination — solo pasado desde /products. Cuando está presente
  // (y no hay filtros activos), renderizamos botón "Cargar más" que llama
  // a loadMoreProducts. Si las rutas /hombre, /mujer, /nino, /marcas/X
  // adoptan paginación en el futuro, pueden pasarlo también.
  initialPageInfo?: PageInfo
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
  hormas: Set<string>
  onlyAvailable: boolean
}

// Filtro (set) → nombre del parámetro en la URL. Así los filtros son
// compartibles: /mujer?marca=cabrera&horma=cuadrado&color=negro
const PARAM: Record<"vendors" | "sizes" | "types" | "colors" | "materials" | "hormas", string> = {
  vendors: "marca",
  sizes: "talla",
  types: "estilo",
  colors: "color",
  materials: "material",
  hormas: "horma",
}

// Lee un parámetro multi-valor (coma-separado) de la URL como Set.
function paramSet(sp: URLSearchParams | ReturnType<typeof useSearchParams>, key: string): Set<string> {
  const raw = sp.get(key) ?? ""
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
}

// Extrae los handles de un metafield de taxonomía (Color, Material, etc.)
// junto con su label legible (campo "label") y, si existe, su HEX nativo
// (campo "color" de los metaobjetos shopify.color-pattern). Preferir ese HEX
// sobre el LUT hace que CUALQUIER color nuevo cargado en Shopify se pinte
// solo, sin caer a gris ni requerir mantener el LUT a mano.
function extractTaxonomyValues(
  metafield?: { references?: { edges: Array<{ node: { handle: string; fields: Array<{ key: string; value: string | null }> } }> } } | null
): Array<{ handle: string; label: string; hex: string | null }> {
  const edges = metafield?.references?.edges ?? []
  return edges.map((e) => {
    const label = e.node.fields.find((f) => f.key === "label")?.value
    const colorHex = e.node.fields.find((f) => f.key === "color")?.value ?? null
    return {
      handle: e.node.handle,
      label: label || e.node.handle,
      hex: colorHex && /^#[0-9a-fA-F]{3,8}$/.test(colorHex) ? colorHex : null,
    }
  })
}

// Estilos de una bota, como etiquetas canónicas deduplicadas. Lee el metacampo
// MULTI-VALOR shopify.boot-style (no productType), así que una bota puede caer
// en varios estilos a la vez (ej. ["Botines", "Exóticas"]). vaquera/vaquero se
// unifican a "Vaqueras" vía bootStyleLabel.
function styleLabelsOf(p: Product): string[] {
  const slugs = extractTaxonomyValues(p.bootStyle).map((v) => v.handle)
  const labels = slugs
    .map(bootStyleLabel)
    .filter((l): l is string => l !== null)
  return Array.from(new Set(labels))
}

// Luminancia perceptual (BT.601) para decidir el borde del swatch cuando el
// HEX viene directo de Shopify y no traemos el flag isLight del LUT. Los
// colores muy claros necesitan un ring visible sobre el fondo crema.
function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return false
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
}

type SortKey = "default" | "recientes" | "precio-asc" | "precio-desc" | "titulo"

// Valores = LLAVES del diccionario i18n (se traducen con t() al render).
const SORT_LABELS: Record<SortKey, string> = {
  default: "sort.bestselling",
  recientes: "sort.newest",
  "precio-asc": "sort.priceAsc",
  "precio-desc": "sort.priceDesc",
  titulo: "sort.nameAz",
}

export function ProductsListing({ products, initialStyle, initialPageInfo }: Props) {
  const t = useT()
  const { locale } = useLocale()
  // Dos fuentes de "estilo activo":
  //   1. initialStyle (server-driven, vía sub-ruta /hombre/vaqueras).
  //   2. ?estilo= legacy en query string (bookmarks viejos, links externos).
  // Precedencia: initialStyle > ?estilo=. searchParams se mantiene como
  // fallback y para detectar cambios dentro del mismo segmento padre.
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Estado paginación — `allProducts` arranca con el batch SSG y crece
  // cuando el usuario hace "Cargar más". `pageInfo` controla si seguimos
  // mostrando el botón. Solo aplicable cuando viene initialPageInfo
  // (= la ruta /products lo pasa); las páginas que no paginan dejan ambos
  // estáticos.
  const [allProducts, setAllProducts] = useState<Product[]>(products)
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>(initialPageInfo)
  const [loadingMore, setLoadingMore] = useState(false)

  // Si el server re-renderiza con un batch fresco (revalidate 60s o
  // navegación cliente que vuelve a entrar), resetamos.
  useEffect(() => {
    setAllProducts(products)
    setPageInfo(initialPageInfo)
  }, [products, initialPageInfo])

  // Filtros DERIVADOS de la URL — fuente única de verdad, así son compartibles
  // (/mujer?horma=cuadrado&marca=cabrera) y no hay estado que se desincronice.
  // initialStyle (sub-ruta /hombre/vaqueras) fuerza el estilo sobre el query.
  const filters = useMemo<FilterState>(() => {
    let types: Set<string>
    if (initialStyle) {
      const target = normalize(initialStyle)
      const matching = products.flatMap(styleLabelsOf).filter((l) => normalize(l) === target)
      types = matching.length > 0 ? new Set(matching) : new Set([initialStyle])
    } else {
      const raw = paramSet(searchParams, "estilo")
      if (raw.size === 0) {
        types = new Set()
      } else {
        // El query guarda labels ("Vaqueras"); links viejos guardan slug
        // ("vaqueras"). Resolvemos ambos por comparación normalizada.
        const allLabels = Array.from(new Set(products.flatMap(styleLabelsOf)))
        types = new Set(
          Array.from(raw).map((r) => allLabels.find((l) => normalize(l) === normalize(r)) ?? r)
        )
      }
    }
    return {
      vendors: paramSet(searchParams, "marca"),
      sizes: paramSet(searchParams, "talla"),
      types,
      colors: paramSet(searchParams, "color"),
      materials: paramSet(searchParams, "material"),
      hormas: paramSet(searchParams, "horma"),
      onlyAvailable: searchParams.get("stock") === "1",
    }
  }, [searchParams, initialStyle, products])

  // Escribe cambios de filtro en la URL (router.replace, sin recargar ni
  // scrollear). Como los filtros se DERIVAN de la URL, esto re-renderiza con el
  // nuevo estado — no hay setState de filtros.
  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [mobileOpen, setMobileOpen] = useState(false)
  // En mobile el <aside> es un drawer modal: atrapa el foco, cierra con ESC y
  // restaura el foco al botón "Filtros". En desktop mobileOpen es false, así
  // que el hook queda inactivo y el aside es un sidebar normal.
  const filtersRef = useFocusTrap<HTMLElement>(mobileOpen, () => setMobileOpen(false))

  // === Facetas — qué opciones mostrar en sidebar ===

  const facets = useMemo(() => {
    const vendors = new Set<string>()
    const sizes = new Set<string>()
    const types = new Set<string>()
    // Mapas handle → {label, hex} para mostrar nombres legibles ("Negro" en vez
    // de "negro") y el swatch con el HEX nativo de Shopify cuando está.
    const colorMap = new Map<string, { label: string; hex: string | null }>()
    const materialMap = new Map<string, string>()
    const hormaMap = new Map<string, string>()

    for (const p of allProducts) {
      if (p.vendor) vendors.add(p.vendor)
      for (const label of styleLabelsOf(p)) types.add(label)
      const sizeOpt = (p.options ?? []).find((o) =>
        SIZE_OPTION_NAMES.includes(o.name)
      )
      if (sizeOpt) for (const v of sizeOpt.values) sizes.add(v)

      for (const c of extractTaxonomyValues(p.color)) {
        colorMap.set(c.handle, { label: c.label, hex: c.hex })
      }
      for (const m of extractTaxonomyValues(p.material)) {
        materialMap.set(m.handle, m.label)
      }
      for (const h of extractTaxonomyValues(p.toeStyle)) {
        hormaMap.set(h.handle, h.label)
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
        .map(([handle, { label, hex }]) => ({ handle, label, hex }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      materials: Array.from(materialMap.entries())
        .map(([handle, label]) => ({ handle, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      hormas: Array.from(hormaMap.entries())
        .map(([handle, label]) => ({ handle, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }
  }, [allProducts])

  // === Productos filtrados ===

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (filters.onlyAvailable && !p.availableForSale) return false

      if (filters.vendors.size > 0 && !filters.vendors.has(p.vendor)) return false

      if (
        filters.types.size > 0 &&
        !styleLabelsOf(p).some((label) => filters.types.has(label))
      )
        return false

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

      if (filters.hormas.size > 0) {
        const hormas = extractTaxonomyValues(p.toeStyle)
        if (!hormas.some((h) => filters.hormas.has(h.handle))) return false
      }

      return true
    })
  }, [allProducts, filters])

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
    filters.hormas.size +
    (filters.onlyAvailable ? 1 : 0)

  // Contexto legible para el encabezado del PDF: la sección (de la ruta) + los
  // filtros activos, ej. "Hombre · Exóticas · Marca: Cabrera · En stock".
  const pdfContext = useMemo(() => {
    const en = locale === "en"
    const cap = (h: string) =>
      h.charAt(0).toUpperCase() + h.slice(1).replace(/-/g, " ")
    const labelsFrom = (
      set: Set<string>,
      arr: { handle: string; label: string }[]
    ) => [...set].map((h) => arr.find((f) => f.handle === h)?.label || h)

    const seg = pathname.replace(/^\/(es|en)/, "").split("/").filter(Boolean)
    const base = seg[0]
    const parts: string[] = []
    if (base === "hombre") parts.push(en ? "Men" : "Hombre")
    else if (base === "mujer") parts.push(en ? "Women" : "Mujer")
    else if (base === "outlet") parts.push("Outlet")
    else if (base === "marcas" && seg[1]) parts.push(`${en ? "Brand" : "Marca"}: ${cap(seg[1])}`)
    else if (base === "accesorios") parts.push(en ? "Accessories" : "Accesorios")
    else parts.push(en ? "Catalog" : "Catálogo")

    if (filters.vendors.size) parts.push(`${en ? "Brand" : "Marca"}: ${[...filters.vendors].join(", ")}`)
    if (filters.types.size) parts.push([...filters.types].join(", "))
    if (filters.sizes.size) parts.push(`${en ? "Size" : "Talla"}: ${[...filters.sizes].join(", ")}`)
    if (filters.colors.size) parts.push(labelsFrom(filters.colors, facets.colors).join(", "))
    if (filters.materials.size) parts.push(labelsFrom(filters.materials, facets.materials).join(", "))
    if (filters.hormas.size) parts.push(labelsFrom(filters.hormas, facets.hormas).join(", "))
    if (filters.onlyAvailable) parts.push(en ? "In stock" : "En stock")

    return parts.join("  ·  ")
  }, [pathname, locale, filters, facets])

  // Limpia TODOS los filtros de la URL (conserva la ruta, ej. /hombre/vaqueras
  // mantiene su estilo por la sub-ruta).
  const clearAll = () =>
    updateParams((params) => {
      for (const k of Object.values(PARAM)) params.delete(k)
      params.delete("stock")
    })

  const toggle = (
    key: "vendors" | "sizes" | "types" | "colors" | "materials" | "hormas",
    value: string
  ) => {
    updateParams((params) => {
      const pk = PARAM[key]
      const current = paramSet(params, pk)
      if (current.has(value)) current.delete(value)
      else current.add(value)
      if (current.size > 0) params.set(pk, Array.from(current).join(","))
      else params.delete(pk)
    })
  }

  const setOnlyAvailable = (checked: boolean) =>
    updateParams((params) => {
      if (checked) params.set("stock", "1")
      else params.delete("stock")
    })

  // === Scroll anchoring al filtrar ===
  // Al aplicar/quitar filtros la grid se encoge; el scroll (en px) se queda
  // igual, así que si el usuario venía scrolleado hacia abajo termina mirando
  // el footer ("como si la página lo mandara hasta abajo"). Lo regresamos al
  // inicio de los resultados — pero SOLO si el top de la grid ya salió del
  // viewport por arriba (venía scrolleado), y nunca en el primer render.
  const listingTopRef = useRef<HTMLDivElement>(null)
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const el = listingTopRef.current
    if (el && el.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    }
  }, [filters])

  return (
    <div
      ref={listingTopRef}
      className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8"
    >
      {/* Sidebar desktop / drawer mobile */}
      <aside
        ref={filtersRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? t("filters.title") : undefined}
        className={`
          ${mobileOpen ? "fixed inset-0 z-50 bg-bg overflow-y-auto" : "hidden"}
          lg:block lg:static lg:bg-transparent lg:overflow-visible lg:z-auto
        `}
      >
        {/* Header drawer mobile */}
        {mobileOpen && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-border lg:hidden sticky top-0 bg-bg">
            <h2 className="font-heading text-xl">{t("filters.title")}</h2>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label={t("filters.close")}
              data-autofocus
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
            <h2 className="font-heading text-base text-text">{t("filters.title")}</h2>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs uppercase tracking-wider text-leather hover:text-terracotta"
              >
                {t("filters.clear")} ({activeCount})
              </button>
            )}
          </div>

          {/* Talla */}
          {facets.sizes.length > 0 && (
            <FilterSection title={t("filters.size")}>
              <div className="flex flex-wrap gap-2">
                {facets.sizes.map((size) => {
                  const active = filters.sizes.has(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggle("sizes", size)}
                      aria-pressed={active}
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded-full text-xs border transition-colors ${
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

          {/* Marca */}
          {facets.vendors.length > 0 && (
            <FilterSection title={t("filters.brand")}>
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
                      {allProducts.filter((p) => p.vendor === vendor).length}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Estilo */}
          {facets.types.length > 0 && (
            <FilterSection title={t("filters.style")}>
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
                      {allProducts.filter((p) => styleLabelsOf(p).includes(type)).length}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Color — datos del metafield shopify.color-pattern */}
          {facets.colors.length > 0 && (
            <FilterSection title={t("filters.color")}>
              <div className="space-y-2">
                {facets.colors.map(({ handle, label, hex }) => {
                  // Preferimos el HEX nativo del metaobject de Shopify; si no
                  // viene, caemos al LUT por nombre; y a gris neutro como último
                  // recurso. Nunca rompe.
                  const lut = hex ? null : lookupColor(label)
                  const swatchHex = hex ?? lut?.hex ?? "#B0B0B0"
                  const light = hex ? isLightHex(hex) : lut?.isLight ?? false
                  return (
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
                      <span
                        aria-hidden
                        className={`h-4 w-4 shrink-0 rounded-full border ${
                          light
                            ? "border-border-strong/40"
                            : "border-black/20"
                        }`}
                        style={{ backgroundColor: swatchHex }}
                      />
                      <span className="flex-1">{label}</span>
                    </label>
                  )
                })}
              </div>
            </FilterSection>
          )}

          {/* Material — datos del metafield shopify.shoe-material */}
          {facets.materials.length > 0 && (
            <FilterSection title={t("filters.material")}>
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

          {/* Horma — datos del metafield shopify.toe-style (En punta, Dubai,
              Redondo, Cuadrado). */}
          {facets.hormas.length > 0 && (
            <FilterSection title={t("filters.horma")}>
              <div className="space-y-2">
                {facets.hormas.map(({ handle, label }) => (
                  <label
                    key={handle}
                    className="flex items-center gap-2 cursor-pointer text-sm hover:text-leather"
                  >
                    <input
                      type="checkbox"
                      checked={filters.hormas.has(handle)}
                      onChange={() => toggle("hormas", handle)}
                      className="rounded border-border accent-leather"
                    />
                    <span className="flex-1">{label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Disponibilidad */}
          <FilterSection title={t("filters.availability")}>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-border accent-leather"
              />
              {t("filters.inStock")}
            </label>
          </FilterSection>

          {/* Footer drawer mobile */}
          {mobileOpen && (
            <div className="pt-4 sticky bottom-0 bg-bg border-t border-border -mx-6 px-6 py-4 flex gap-3">
              <button
                onClick={clearAll}
                className="flex-1 py-3 border border-border text-sm uppercase tracking-wider hover:border-leather"
              >
                {t("filters.clear")}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text"
              >
                {t("filters.show")} {filtered.length}
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
            {sorted.length} {sorted.length === 1 ? t("listing.product") : t("listing.products")}
            {activeCount > 0 && (
              <span className="text-text-subtle"> {t("listing.of")} {allProducts.length}</span>
            )}
          </p>

          <div className="flex items-center gap-3">
            {/* Descargar la selección actual (búsqueda/filtros) en PDF */}
            {sorted.length > 0 && (
              <PrintSelectionButton products={sorted} contexto={pdfContext} />
            )}

            {/* Sort */}
            <label className="text-xs text-text-muted hidden sm:inline">
              {t("listing.sort")}
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label={t("listing.sortBy")}
              className="text-sm bg-bg border border-border px-3 py-1.5 hover:border-leather focus:outline-none focus:border-leather cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {t(SORT_LABELS[key])}
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
              {t("filters.title")}
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
                {t("listing.noResults")}
              </p>
              <p className="text-text-muted mb-6">
                {t("listing.noResultsDesc")}
              </p>
              <button
                onClick={clearAll}
                className="inline-flex px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                {t("filters.clearAll")}
              </button>
            </div>
          ) : (
            <EmptyProductsState
              title={t("listing.emptyTitle")}
              description={t("listing.emptyDesc")}
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
              {sorted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Cursor pagination — solo cuando hay más Y no hay filtros.
                Si el usuario está filtrando, "Cargar más" traería productos
                que probablemente no cumplen el filtro (mala UX); mejor le
                pedimos limpiar primero. */}
            {pageInfo?.hasNextPage && activeCount === 0 && (
              <div className="text-center mt-12">
                <button
                  type="button"
                  disabled={loadingMore || !pageInfo.endCursor}
                  aria-busy={loadingMore}
                  onClick={async () => {
                    if (!pageInfo?.endCursor || loadingMore) return
                    setLoadingMore(true)
                    try {
                      const next = await loadMoreProducts({
                        after: pageInfo.endCursor,
                        first: 24,
                        sortKey: "BEST_SELLING",
                      })
                      setAllProducts((prev) => [...prev, ...next.products])
                      setPageInfo(next.pageInfo)
                    } catch (e) {
                      console.error("loadMoreProducts failed", e)
                    } finally {
                      setLoadingMore(false)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? t("listing.loading") : t("listing.loadMore")}
                </button>
              </div>
            )}

            {pageInfo?.hasNextPage && activeCount > 0 && (
              <div className="text-center mt-8 text-xs text-text-subtle">
                {t("listing.clearToSeeMore")}
              </div>
            )}
          </>
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
