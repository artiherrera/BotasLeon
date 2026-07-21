import { Suspense, type CSSProperties } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { getBrands, getProductsByVendor } from "@/lib/shopify"
import { brandTitleFontClass } from "@/lib/brand-fonts"
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

/**
 * Mezcla un hex con el crema del sitio para un fondo tenue y legible. `amount`
 * es el % del color de marca (el resto es crema). Se usa como fallback del
 * fondo cuando la marca definió acento pero no un bg_color propio.
 */
function softTint(hex: string, amount = 0.14): string {
  const h = hex.replace("#", "").trim()
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex
  const cr = 251,
    cg = 248,
    cb = 241 // #FBF8F1 (crema del sitio)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number, cc: number) => Math.round(c * amount + cc * (1 - amount))
  const to2 = (n: number) => n.toString(16).padStart(2, "0")
  return `#${to2(mix(r, cr))}${to2(mix(g, cg))}${to2(mix(b, cb))}`
}

export default async function MarcaPage({ params }: Props) {
  const { handle } = await params
  const brands = await getBrands()
  const brand = brands.find((b) => b.handle === handle)

  if (!brand) notFound()

  // Productos donde vendor = brand.name
  const products = await getProductsByVendor(brand.name).catch(() => [])

  // Identidad visual propia de la marca (data-driven), acotada a ESTA página vía
  // variables CSS (default = cuero/crema del sitio):
  //  - --brand-accent: acentos (eyebrow, barra, botones, hovers)
  //  - --brand-bg: fondo de TODA la página. Usa bg_color si existe; si no, se
  //    deriva un tinte suave del acento. La marca toma control del fondo entero.
  const titleFontClass = brandTitleFontClass(brand.titleFont)
  const accent = brand.accentColor || null
  const pageBg = brand.bgColor || (accent ? softTint(accent) : null)
  const themeStyle = {
    "--brand-accent": accent || "var(--color-leather)",
    "--brand-bg": pageBg || "var(--color-bg)",
  } as CSSProperties

  return (
    <>
      <Header />
      <main
        id="contenido"
        tabIndex={-1}
        className="flex-1 bg-[color:var(--brand-bg)]"
        style={themeStyle}
      >
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-text-muted">
            <Link href="/" className="hover:text-[color:var(--brand-accent)]">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/marcas" className="hover:text-[color:var(--brand-accent)]">Marcas</Link>
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
              <p className="eyebrow mb-2 text-[color:var(--brand-accent)]">Marca</p>
              <h1
                className={`${titleFontClass || "font-display"} text-4xl md:text-5xl text-text mb-3`}
              >
                {brand.name}
              </h1>
              {brand.tagline && (
                <p className="text-text-muted max-w-xl text-lg">{brand.tagline}</p>
              )}
              {/* Barra de acento — firma visual de la marca. */}
              <span
                aria-hidden
                className="mt-5 block h-1 w-16 rounded-full bg-[color:var(--brand-accent)]"
              />
            </div>
          </div>

          {/* Productos de esta marca */}
          {products.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">
                Aún sin productos
              </p>
              <p className="text-text-muted mb-6">
                No hay productos en el catálogo con vendor «{brand.name}».
                Verifica que el campo «Proveedor» de tus productos en Shopify
                sea exactamente «{brand.name}».
              </p>
              <Link
                href="/products"
                className="inline-flex px-6 py-3 rounded-full border border-[color:var(--brand-accent)] text-[color:var(--brand-accent)] text-sm uppercase tracking-wider hover:bg-[color:var(--brand-accent)] hover:text-bg transition-colors"
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
