import { Suspense } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { EmptyProductsState } from "@/components/EmptyState"
import { CategoryHeader } from "@/components/CategoryHeader"
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
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          {/* accessories.eyebrow y accessories.title SÍ existen en el
              diccionario; la descripción larga todavía no tiene llave. */}
          <CategoryHeader
            eyebrow="accessories.eyebrow"
            title="accessories.title"
            description="Cinturones piteados, sombreros vaqueros, carteras de piel y productos para cuidar tu cuero. Curados de los mismos talleres de León que hacen nuestras botas."
          />

          {products.length === 0 ? (
            <EmptyProductsState
              title="Próximamente"
              description='Estamos curando los primeros accesorios. Mientras tanto, explora el catálogo de botas.'
            />
          ) : (
            <Suspense fallback={<div className="min-h-[400px]" />}>
              {/* Un cinto no se cuenta en pares. */}
              <ProductsListing products={products} unidad="piezas" />
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
  path: "/accesorios",
  title: "Accesorios — cinturones, sombreros, carteras y cuidado",
  description:
    "Accesorios de piel hechos en León: cinturones piteados, sombreros vaqueros, carteras y productos para cuidar tu cuero. Curados por BotasLeón.",
  })
}
