import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { EmptyProductsState } from "@/components/EmptyState"
import { getProducts } from "@/lib/shopify"

/**
 * Listing global de productos.
 *
 * Server component. Por ahora trae los 24 más vendidos.
 * Filtros completos (talla, marca, material, género) van en Sprint C
 * cuando ya existan colecciones automatizadas basadas en metacampos.
 *
 * Deliberadamente sin dependencias de cart u otros providers — esta
 * página es el primer pedazo del Sprint B re-introducido en pedazos
 * chicos. Verificable en aislamiento.
 */

type Props = {
  searchParams: Promise<{ sort?: string; q?: string }>
}

type SortKey = "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT" | "UPDATED_AT" | "RELEVANCE"

const SORT_MAP: Record<string, SortKey> = {
  vendidos: "BEST_SELLING",
  recientes: "CREATED_AT",
  precio: "PRICE",
  titulo: "TITLE",
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const sortKey = SORT_MAP[params.sort ?? "vendidos"] ?? "BEST_SELLING"

  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({
      first: 24,
      query: params.q,
      sortKey,
    })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {/* Sección header */}
          <div className="mb-10">
            <p className="eyebrow text-leather mb-2">Catálogo</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              Todas las botas
            </h1>
            <p className="text-text-muted max-w-xl">
              Curadas directamente de los talleres de León. Cada par verificado
              en cuero, costuras y construcción antes de llegar a tu puerta.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <p className="text-sm text-text-muted">
              {products.length > 0
                ? `${products.length} producto${products.length === 1 ? "" : "s"}`
                : ""}
            </p>
            <SortDropdown current={params.sort ?? "vendidos"} />
          </div>

          {/* Grid o estado vacío/error */}
          {fetchError ? (
            <div className="border border-red-300 bg-red-50 text-red-900 rounded-sm p-6">
              <p className="font-medium mb-2">Error al cargar productos</p>
              <p className="text-sm font-mono break-all">{fetchError}</p>
            </div>
          ) : products.length === 0 ? (
            <EmptyProductsState
              title="Catálogo en construcción"
              description="Estamos cargando las primeras botas de los talleres de León. Vuelve pronto."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

// Sort dropdown server-rendered con <Link> — sin client component.
function SortDropdown({ current }: { current: string }) {
  const OPTIONS = [
    { value: "vendidos", label: "Más vendidos" },
    { value: "recientes", label: "Más recientes" },
    { value: "precio", label: "Precio" },
    { value: "titulo", label: "Nombre A → Z" },
  ]

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted hidden sm:inline">Ordenar:</span>
      <div className="flex gap-1 flex-wrap">
        {OPTIONS.map((opt) => {
          const active = opt.value === current
          return (
            <Link
              key={opt.value}
              href={{ pathname: "/products", query: { sort: opt.value } }}
              className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
                active
                  ? "bg-leather text-bg"
                  : "border border-border text-text-muted hover:border-leather hover:text-leather"
              }`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
