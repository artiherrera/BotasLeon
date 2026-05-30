import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { EmptyProductsState } from "@/components/EmptyState"
import { getProducts } from "@/lib/shopify"

/**
 * Listing global de productos.
 *
 * Server component. Por ahora trae los 24 más vendidos (BEST_SELLING).
 * Cuando agreguemos sort UI (Sprint C), leemos `?sort=` de searchParams
 * y mapeamos a sortKey de Shopify. Filtros completos (talla, marca,
 * material) van en Sprint C — primero validamos que el flujo
 * listing → PDP → cart → checkout funciona end-to-end.
 */

type Props = {
  searchParams: Promise<{ sort?: string; q?: string }>
}

const SORT_MAP: Record<string, Parameters<typeof getProducts>[0]> = {
  recientes: { sortKey: "CREATED_AT" },
  precio_menor: { sortKey: "PRICE" },
  precio_mayor: { sortKey: "PRICE" }, // reverse no soportado aún, simplificamos
  vendidos: { sortKey: "BEST_SELLING" },
  titulo: { sortKey: "TITLE" },
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const sortKey = SORT_MAP[params.sort ?? "vendidos"] ?? { sortKey: "BEST_SELLING" }

  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({
      first: 24,
      query: params.q,
      sortKey: sortKey.sortKey,
    })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {/* Header de la sección */}
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

          {/* Toolbar — count + sort */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <p className="text-sm text-text-muted">
              {products.length > 0
                ? `${products.length} producto${products.length === 1 ? "" : "s"}`
                : ""}
            </p>
            <SortDropdown current={params.sort ?? "vendidos"} />
          </div>

          {/* Grid de productos */}
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

// Server-rendered sort dropdown — usa <Link> simple para no requerir client.
// Cada opción navega con ?sort=X. Al hacer Sprint C podemos refactorizar
// a un Select interactivo si la UX lo amerita.
function SortDropdown({ current }: { current: string }) {
  const OPTIONS: Array<{ value: string; label: string }> = [
    { value: "vendidos", label: "Más vendidos" },
    { value: "recientes", label: "Más recientes" },
    { value: "precio_menor", label: "Precio: menor a mayor" },
    { value: "titulo", label: "Nombre: A → Z" },
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
