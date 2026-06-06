import { Suspense } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { EmptyProductsState } from "@/components/EmptyState"
import { getAccessories } from "@/lib/shopify"
import { pageMetadata } from "@/lib/seo"

/**
 * /accesorios — listing general de todos los accesorios.
 *
 * Filtra por productType ∈ ACCESSORY_PRODUCT_TYPES (Cinturones,
 * Sombreros, Carteras, Cuidado del cuero). ProductsListing toma el
 * fragment estándar + sus filtros (vendor, productType, color, material).
 *
 * Si no hay accesorios, empty state limpio — el catálogo de botas
 * sigue siendo la propuesta principal.
 */

export const revalidate = 60

export default async function AccesoriosPage() {
  const products = await getAccessories()

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-8">
            <p className="eyebrow text-leather mb-2">Accesorios</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              Para complementar tu vestir
            </h1>
            <p className="text-text-muted max-w-xl">
              Cinturones piteados, sombreros vaqueros, carteras de piel y
              productos para cuidar tu cuero. Curados de los mismos talleres
              de León que hacen nuestras botas.
            </p>
          </div>

          {products.length === 0 ? (
            <EmptyProductsState
              title="Próximamente"
              description='Estamos curando los primeros accesorios. Mientras tanto, explora el catálogo de botas.'
            />
          ) : (
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={products} />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export const metadata = pageMetadata({
  path: "/accesorios",
  title: "Accesorios — cinturones, sombreros, carteras y cuidado",
  description:
    "Accesorios de piel hechos en León: cinturones piteados, sombreros vaqueros, carteras y productos para cuidar tu cuero. Curados por BotasLeón.",
})
