import type { CSSProperties } from "react"
import { notFound } from "next/navigation"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
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
import { getProductByHandle, getProducts, getBrands } from "@/lib/shopify"
import {
  LocalizedProductTitle,
  LocalizedProductDescription,
  LocalizedPrice,
} from "@/components/LocalizedProductContent"
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

/**
 * Handles que no salieron de generateStaticParams → 404 en el router, SIN
 * intentar renderizarlos en runtime. Es el fix del 500: un producto
 * despublicado (o una URL vieja de un anuncio) llegaba a render on-demand y
 * Amplify responde "Internal Server Error" a las rutas Next 16 dinámicas.
 * Google reintenta y penaliza un 500; un 404 lo saca del índice y punto.
 *
 * Costo asumido: un producto nuevo en Shopify da 404 hasta el siguiente
 * deploy — igual que antes, porque el render on-demand nunca funcionó en
 * Amplify.
 */
export const dynamicParams = false

type Props = {
  params: Promise<{ lang: string; handle: string }>
}

/** Recorre el catálogo completo (Shopify topa `first` en 250). Cap de 20
 *  páginas (5000 productos) como salvaguarda anti-loop. */
async function fetchAllHandles(): Promise<string[]> {
  const handles: string[] = []
  let after: string | null = null
  for (let page = 0; page < 20; page++) {
    const { products, pageInfo } = await getProducts({ first: 250, after })
    handles.push(...products.map((p) => p.handle))
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break
    after = pageInfo.endCursor
  }
  return handles
}

export async function generateStaticParams() {
  // DOS pasadas y unión de resultados. No es paranoia: un deploy real salió con
  // 96 de 98 fichas porque Shopify devolvió un catálogo corto —sin error, con
  // hasNextPage=false—, y como dynamicParams=false, esos dos productos daban
  // 404 permanente aunque existieran. El buscador sí los encontraba, así que el
  // cliente llegaba a una página inexistente.
  //
  // La segunda pasada cuesta una petición por build y convierte un fallo
  // silencioso en uno que se cura solo (y se ve en el log).
  const [a, b] = await Promise.all([fetchAllHandles(), fetchAllHandles()])
  const union = Array.from(new Set([...a, ...b]))
  if (union.length !== a.length || union.length !== b.length) {
    console.warn(
      `[PDP] catálogo inconsistente entre pasadas: ${a.length} y ${b.length} → se pre-generan ${union.length}`
    )
  }
  // SIN try/catch a propósito: con dynamicParams = false, tragarse un fallo de
  // Shopify publicaría un sitio donde TODAS las fichas dan 404. Que reviente el
  // build es lo correcto — Amplify deja en pie el deploy anterior.
  return union.map((handle) => ({ handle }))
}

export default async function ProductPage({ params }: Props) {
  const { lang, handle } = await params
  const isEn = lang === "en"
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

  return (
    <>
      {/* Structured data Schema.org para rich snippets en Google */}
      <ProductJsonLd product={product} lang={lang} />
      <BreadcrumbJsonLd
        items={[
          { name: isEn ? "Home" : "Inicio", url: `/${lang}` },
          { name: isEn ? "Catalog" : "Catálogo", url: `/${lang}/products` },
          { name: product.title, url: `/${lang}/products/${product.handle}` },
        ]}
      />

      {/* Klaviyo: dispara 'Viewed Product' para Browse Abandonment flow */}
      <ProductViewedTracker product={product} />

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
                <LocalizedProductTitle
                  handle={product.handle}
                  fallback={product.title}
                  className="font-heading text-3xl md:text-4xl text-text mb-4 leading-tight"
                />

                <div className="mb-8">
                  <LocalizedPrice
                    amount={price.amount}
                    currency={price.currencyCode}
                    compareAt={compareAt?.amount}
                    size="pdp"
                  />
                </div>

                <ProductOptions product={product} />

                <PDPTrustBlock product={product} />

                <ProductReviewBlock product={product} />

                <LocalizedProductDescription
                  handle={product.handle}
                  fallbackHtml={product.descriptionHtml ?? ""}
                />

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
  const { lang, handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) return { title: "Producto no encontrado" }
  const description = (product.description || `${product.title} por ${product.vendor || "BotasLeón"}`).slice(0, 160)
  const featuredImage = product.featuredImage?.url
  return {
    title: product.title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${lang}/products/${product.handle}`),
      languages: {
        "es-US": absoluteUrl(`/es/products/${product.handle}`),
        "en-US": absoluteUrl(`/en/products/${product.handle}`),
        "x-default": absoluteUrl(`/en/products/${product.handle}`),
      },
    },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: absoluteUrl(`/${lang}/products/${product.handle}`),
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
