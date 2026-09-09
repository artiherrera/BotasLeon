import { Suspense } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { CategoryHeader } from "@/components/CategoryHeader"
import { getProducts } from "@/lib/shopify"
import { saleInfo } from "@/lib/utils"
import { pageMetadata } from "@/lib/seo"

/**
 * /outlet — todas las botas con descuento (compareAtPrice > precio).
 *
 * La Storefront API no filtra por "en oferta", así que bajamos el catálogo
 * (tope 250) y filtramos en JS con saleInfo. revalidate 60 para reflejar
 * cambios de precio/oferta sin redeploy.
 */

export const revalidate = 60

export default async function OutletPage() {
  const res = await getProducts({ first: 250, sortKey: "BEST_SELLING" }).catch(
    () => null
  )
  const onSale = (res?.products ?? []).filter(
    (p) =>
      saleInfo(
        p.priceRange.minVariantPrice.amount,
        p.compareAtPriceRange?.minVariantPrice.amount
      ).onSale
  )

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          {/* El texto sigue en español fijo porque las llaves cat.outlet.* aún
              no existen en el diccionario; CategoryHeader traduce con t(), que
              devuelve la cadena tal cual si no es una llave conocida, así que
              hoy imprime lo mismo que antes y el día que se creen las llaves
              basta con sustituir estas tres cadenas. */}
          <CategoryHeader
            eyebrow="Outlet"
            title="Ofertas y liquidación"
            description="Botas con descuento — precios especiales por tiempo limitado."
          />

          {onSale.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 max-w-2xl">
              <p className="display-s text-text mb-2">
                Sin ofertas por ahora
              </p>
              <p className="cuerpo medida-lectura text-text-muted mb-6">
                Cuando tengamos pares con descuento aparecerán aquí.
              </p>
              <Link href="/products" className="btn btn-sec">
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            // Suspense requerido: ProductsListing usa useSearchParams.
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={onSale} />
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
  path: "/outlet",
  title: "Outlet",
  description: "Botas con descuento y ofertas especiales en BotasLeón.",
  })
}
