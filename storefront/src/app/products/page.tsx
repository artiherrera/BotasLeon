import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { EmptyProductsState } from "@/components/EmptyState"
import { getProducts } from "@/lib/shopify"

/**
 * Listing global de productos.
 *
 * Server component STATIC con revalidate de 60s — mismo patrón que el
 * home. Evitamos `searchParams` por ahora porque vuelve la ruta dinámica
 * y Amplify Hosting tiene problemas serviendo rutas Next 16 puramente
 * dinámicas (las hace 500). Sort UI se re-agrega en Sprint C con un
 * mecanismo distinto (cliente con useRouter o filtros via collections).
 */

// Forzar rehidratación cada 60s — recoge productos nuevos del admin
// sin requerir redeploy.
export const revalidate = 60

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({
      first: 24,
      sortKey: "BEST_SELLING",
    })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
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

          {products.length > 0 && (
            <p className="text-sm text-text-muted mb-8 pb-4 border-b border-border">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          )}

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
