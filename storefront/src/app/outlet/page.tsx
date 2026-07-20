import { Suspense } from "react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
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
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-8">
            <p className="eyebrow text-terracotta mb-2">Outlet</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              Ofertas y liquidación
            </h1>
            <p className="text-text-muted max-w-xl">
              Botas con descuento — precios especiales por tiempo limitado.
            </p>
          </div>

          {onSale.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 max-w-2xl text-center">
              <p className="font-heading text-xl text-text mb-2">
                Sin ofertas por ahora
              </p>
              <p className="text-text-muted mb-6">
                Cuando tengamos pares con descuento aparecerán aquí.
              </p>
              <Link
                href="/products"
                className="inline-flex px-8 py-4 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
              >
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

export const metadata = pageMetadata({
  path: "/outlet",
  title: "Outlet",
  description: "Botas con descuento y ofertas especiales en BotasLeón.",
})
