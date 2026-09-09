import { Suspense } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { CategoryHeader } from "@/components/CategoryHeader"
import { CatalogButton } from "@/components/CatalogButton"
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
        <div className="contenedor seccion">
          {/* Sin llaves de diccionario todavía (cat.all.*): CategoryHeader
              traduce con t(), que devuelve la cadena tal cual cuando no es una
              llave conocida, así que el texto sale igual que antes. */}
          <CategoryHeader
            eyebrow="Catálogo"
            title="Todas las botas"
            description="Curadas directamente de los talleres de León. Cada par verificado en cuero, costuras y construcción antes de llegar a tu puerta."
          />

          {/* El visor del catálogo deja de ser el botón sólido que competía con
              las botas, pero NO desaparece: en terciario. El pie enlaza el PDF
              directo, que Chrome/Android y los navegadores de IG y FB DESCARGAN
              en vez de abrir; este visor HTML es el que abre en todos, y sin
              este enlace se quedaba sin una sola puerta de entrada en el sitio. */}
          <div className="-mt-6 mb-10">
            <CatalogButton className="btn-ter min-h-11" />
          </div>

          {fetchError ? (
            <div className="border border-red-300 bg-red-50 text-red-900 p-6">
              <p className="cuerpo font-medium mb-2">Error al cargar productos</p>
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

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/products",
  title: "Todas las botas",
  description:
    "Catálogo completo de botas mexicanas — vaqueras, clásicas, exóticas y de rancho. Filtra por marca, talla, color y material.",
  })
}
