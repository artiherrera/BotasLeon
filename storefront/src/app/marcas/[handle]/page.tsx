import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { getBrands, getProductsByVendor } from "@/lib/shopify"
import { pageMetadata } from "@/lib/seo"

/**
 * Página individual de marca. Static via generateStaticParams —
 * pre-construimos una página por cada brand metaobject existente.
 * Productos se filtran por vendor matching brand.name.
 */

export const revalidate = 60

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  try {
    const brands = await getBrands()
    return brands.map((b) => ({ handle: b.handle }))
  } catch {
    return []
  }
}

export default async function MarcaPage({ params }: Props) {
  const { handle } = await params
  const brands = await getBrands()
  const brand = brands.find((b) => b.handle === handle)

  if (!brand) notFound()

  // Productos donde vendor = brand.name
  const products = await getProductsByVendor(brand.name).catch(() => [])

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-text-muted">
            <Link href="/" className="hover:text-leather">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/marcas" className="hover:text-leather">Marcas</Link>
            <span className="mx-2">/</span>
            <span className="text-text">{brand.name}</span>
          </nav>

          {/* Hero de la marca */}
          <div className="mb-12 flex flex-col md:flex-row items-start md:items-center gap-8 pb-10 border-b border-border">
            {brand.logo && (
              <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-bg-alt overflow-hidden">
                <Image
                  src={brand.logo.url}
                  alt={brand.logo.altText || brand.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="eyebrow text-leather mb-2">Marca</p>
              <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
                {brand.name}
              </h1>
              {brand.tagline && (
                <p className="text-text-muted max-w-xl text-lg">{brand.tagline}</p>
              )}
            </div>
          </div>

          {/* Productos de esta marca */}
          {products.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">
                Aún sin productos
              </p>
              <p className="text-text-muted mb-6">
                No hay productos en el catálogo con vendor "{brand.name}".
                Verifica que el campo "Proveedor" de tus productos en Shopify
                sea exactamente "{brand.name}".
              </p>
              <Link
                href="/products"
                className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                Ver catálogo completo
              </Link>
            </div>
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

export async function generateMetadata({ params }: Props) {
  const { handle } = await params
  const brands = await getBrands()
  const brand = brands.find((b) => b.handle === handle)
  if (!brand) return { title: "Marca no encontrada" }
  return pageMetadata({
    path: `/marcas/${handle}`,
    title: brand.name,
    description: brand.tagline || `Botas de ${brand.name} hechas en León.`,
  })
}
