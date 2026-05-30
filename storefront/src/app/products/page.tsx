import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { getProducts } from "@/lib/shopify"

/**
 * Listing global de productos. Server fetcha → pasa a ProductsListing
 * (client) que maneja filtros. Página estática con revalidate de 60s.
 */
export const revalidate = 60

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({ first: 48, sortKey: "BEST_SELLING" })
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

          {fetchError ? (
            <div className="border border-red-300 bg-red-50 text-red-900 rounded-sm p-6">
              <p className="font-medium mb-2">Error al cargar productos</p>
              <p className="text-sm font-mono break-all">{fetchError}</p>
            </div>
          ) : (
            <ProductsListing products={products} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = {
  title: "Todas las botas — BotasLeón",
}
