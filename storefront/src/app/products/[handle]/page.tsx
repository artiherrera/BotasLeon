import type { CSSProperties } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { brandTitleFontClass } from "@/lib/brand-fonts"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductGalleryConnected } from "@/components/ProductGalleryConnected"
import { ProductOptions } from "@/components/ProductOptions"
import { PDPVariantProvider } from "@/components/PDPVariantContext"
import { PDPTrustBlock } from "@/components/PDPTrustBlock"
import { ProductReviewBlock } from "@/components/ProductReviewBlock"
import { RelatedProducts } from "@/components/RelatedProducts"
import { RecentlyViewed } from "@/components/RecentlyViewed"
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/StructuredData"
import { ProductViewedTracker } from "@/components/ProductViewedTracker"
import { WhatsAppButton } from "@/components/WhatsAppButton"
import { getProductByHandle, getProducts, getBrands } from "@/lib/shopify"
import { formatMoney, saleInfo } from "@/lib/utils"
import { absoluteUrl } from "@/lib/seo"

/**
 * PDP — Página de detalle de producto.
 *
 * Static con generateStaticParams — pre-construimos una página por
 * cada producto existente al momento del build. Productos nuevos
 * requieren rebuild (next push o empty commit).
 *
 * Razón: Amplify Hosting da 500 en rutas Next 16 puramente dinámicas,
 * así que no podemos depender de generación on-the-fly. Acepamos
 * que cargar producto nuevo en Shopify requiera un redeploy hasta
 * que automaticemos via webhook (futuro).
 *
 * ProductOptions tiene selector de talla funcional pero botón
 * "Agregar al carrito" deshabilitado por ahora — se activa en el
 * paso 3 cuando reintroduzcamos el cart.
 */

export const revalidate = 60

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  try {
    // Paginamos el catálogo completo (Shopify topa `first` en 250) para
    // pre-generar TODAS las PDPs — importante porque Amplify no regenera
    // rutas dinámicas on-demand de forma fiable. Cap de 20 páginas (5000
    // productos) como salvaguarda anti-loop.
    const params: { handle: string }[] = []
    let after: string | null = null
    for (let page = 0; page < 20; page++) {
      const { products, pageInfo } = await getProducts({ first: 250, after })
      params.push(...products.map((p) => ({ handle: p.handle })))
      if (!pageInfo.hasNextPage || !pageInfo.endCursor) break
      after = pageInfo.endCursor
    }
    return params
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) notFound()

  // Marca clickable: si el vendor tiene página de marca (metaobjeto "brand"
  // con name === vendor), la etiqueta enlaza al listado de esa marca. Si no
  // hay match, se muestra como texto (evita un link a 404). getBrands está
  // cacheado y el PDP es estático → corre en build, sin costo en runtime.
  const brands = await getBrands().catch(() => [])
  // Match insensible a mayúsculas/espacios: el `name` de la marca puede diferir
  // del vendor solo en capitalización (ej. "FORAJIDAS" vs "Forajidas") y el chip
  // debe salir igual. Shopify ya busca vendors sin distinguir mayúsculas.
  const vendorKey = product.vendor?.trim().toLowerCase()
  const brand = vendorKey
    ? brands.find((b) => b.name.trim().toLowerCase() === vendorKey)
    : undefined

  // Identidad de la marca en su producto: el acento tiñe el CTA del chip
  // (default = terracota si la marca no definió color) y el nombre puede usar
  // la fuente propia de la marca.
  const brandTitleFont = brandTitleFontClass(brand?.titleFont)
  const chipAccentStyle = {
    "--brand-accent": brand?.accentColor || "var(--color-terracotta)",
  } as CSSProperties

  const price = product.priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.minVariantPrice
  const sale = saleInfo(price.amount, compareAt?.amount)

  return (
    <>
      {/* Structured data Schema.org para rich snippets en Google */}
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "/" },
          { name: "Catálogo", url: "/products" },
          { name: product.title, url: `/products/${product.handle}` },
        ]}
      />

      {/* Klaviyo: dispara 'Viewed Product' para Browse Abandonment flow */}
      <ProductViewedTracker product={product} />

      {/* WhatsApp flotante con contexto de la bota (nombre + link) */}
      <WhatsAppButton
        product={{ title: product.title, url: absoluteUrl(`/products/${product.handle}`) }}
      />

      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 md:py-12">
          <nav className="mb-8 text-sm text-text-muted">
            <Link href="/" className="hover:text-leather">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-leather">Catálogo</Link>
            <span className="mx-2">/</span>
            <span className="text-text">{product.title}</span>
          </nav>

          {/* Provider envuelve SOLO el grid Gallery+Info. RelatedProducts y
              RecentlyViewed quedan fuera y siguen siendo independientes. */}
          <PDPVariantProvider product={product}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Galería acotada (estilo Amazon): no pasa de ~½ de la altura
                  de pantalla y va centrada, para que el bloque de compra suba
                  y quepa sin tanto scroll en móvil/tablet. En desktop 2-col
                  llena su columna. */}
              <div className="mx-auto w-full max-w-[min(90vw,50vh)] lg:mx-0 lg:max-w-none">
                <ProductGalleryConnected />
              </div>

              <div className="lg:sticky lg:top-24 lg:self-start">
                {/* Marca clickeable como CHIP: logo (o monograma) + nombre +
                    "Ver todas →". La forma de pastilla con borde comunica que
                    es tocable SIN depender del hover (funciona igual en móvil);
                    el fallback plano (vendor sin página de marca) es texto
                    simple, y ese contraste refuerza que el chip sí se toca. */}
                {product.vendor &&
                  (brand ? (
                    <Link
                      href={`/marcas/${brand.handle}`}
                      aria-label={`Ver todas las botas de ${product.vendor}`}
                      style={chipAccentStyle}
                      className="group mb-3 inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-alt py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      {brand.logo ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg">
                          <Image
                            src={brand.logo.url}
                            alt={brand.logo.altText || product.vendor}
                            width={brand.logo.width || 36}
                            height={brand.logo.height || 36}
                            className="h-full w-full object-contain p-0.5"
                          />
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg font-display text-base leading-none text-leather"
                        >
                          {product.vendor.charAt(0)}
                        </span>
                      )}
                      <span className="flex flex-col leading-tight">
                        <span
                          className={
                            brandTitleFont
                              ? `${brandTitleFont} text-sm leading-none text-leather`
                              : "eyebrow text-leather"
                          }
                        >
                          {product.vendor}
                        </span>
                        <span className="text-xs font-medium text-[color:var(--brand-accent)]">
                          Ver todas
                          <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <p className="eyebrow text-leather mb-3">{product.vendor}</p>
                  ))}
                <h1 className="font-heading text-3xl md:text-4xl text-text mb-4 leading-tight">
                  {product.title}
                </h1>

                <div className="mb-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-display text-2xl text-text">
                    {formatMoney(price.amount, price.currencyCode)}
                  </p>
                  {sale.onSale && compareAt && (
                    <>
                      <span className="text-lg text-text-subtle line-through">
                        {formatMoney(compareAt.amount, compareAt.currencyCode)}
                      </span>
                      <span className="rounded-sm bg-terracotta px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-bg">
                        -{sale.discountPct}%
                      </span>
                    </>
                  )}
                </div>

                <ProductOptions product={product} />

                <PDPTrustBlock product={product} />

                <ProductReviewBlock product={product} />

                {product.descriptionHtml && (
                  <div className="mt-12 pt-8 border-t border-border">
                    <h2 className="eyebrow text-leather mb-4">Descripción</h2>
                    <div
                      className="prose prose-sm max-w-none text-text-muted leading-relaxed [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                    />
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-border text-sm text-text-subtle space-y-1">
                  {product.productType && <p>Tipo: {product.productType}</p>}
                </div>
              </div>
            </div>
          </PDPVariantProvider>
        </div>

        <RelatedProducts
          currentHandle={product.handle}
          vendor={product.vendor}
          productType={product.productType}
        />
        <RecentlyViewed
          currentHandle={product.handle}
          currentTitle={product.title}
          currentImage={product.featuredImage?.url}
        />
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: Props) {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) return { title: "Producto no encontrado" }
  const description = (product.description || `${product.title} por ${product.vendor || "BotasLeón"}`).slice(0, 160)
  const featuredImage = product.featuredImage?.url
  return {
    title: product.title,
    description,
    alternates: {
      canonical: absoluteUrl(`/products/${product.handle}`),
    },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: absoluteUrl(`/products/${product.handle}`),
      images: featuredImage ? [{ url: featuredImage, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: featuredImage ? [featuredImage] : undefined,
    },
  }
}
