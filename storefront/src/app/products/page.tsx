import { Suspense } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { getProducts } from "@/lib/shopify"
import type { Product, PageInfo } from "@/lib/shopify/types"
import { pageMetadata } from "@/lib/seo"

/**
 * Listing global de productos. Server fetcha el primer batch → pasa a
 * ProductsListing (client) que maneja filtros + "Cargar más" (cursor
 * pagination) llamando a Shopify directo. Página estática con
 * revalidate de 60s.
 *
 * Initial first=24 para LCP rápido; siguientes batches via loadMoreProducts.
 */
export const revalidate = 60

export default async function ProductsPage() {
  let products: Product[] = []
  let pageInfo: PageInfo | undefined
  let fetchError: string | null = null
  try {
    const res = await getProducts({ first: 24, sortKey: "BEST_SELLING" })
    products = res.products
    pageInfo = res.pageInfo
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
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
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={products} initialPageInfo={pageInfo} />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = pageMetadata({
  path: "/products",
  title: "Todas las botas",
  description:
    "Catálogo completo de botas mexicanas — vaqueras, clásicas, exóticas y de rancho. Filtra por marca, talla, color y material.",
})
