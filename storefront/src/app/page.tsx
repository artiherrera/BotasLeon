import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { HeroCarousel } from "@/components/HeroCarousel"
import { TrustBadges } from "@/components/TrustBadges"
import { CategoryShowcase } from "@/components/CategoryShowcase"
import { BrandGrid } from "@/components/BrandGrid"
import { FAQAccordion } from "@/components/FAQAccordion"
import { ProductCard } from "@/components/ProductCard"
import { EmptyProductsState } from "@/components/EmptyState"
import { getProducts, getHeroSlides } from "@/lib/shopify"

/**
 * Home page (server component, Next.js 16).
 *
 * Estructura premium multi-brand:
 *   1. Header sticky
 *   2. HeroCarousel — 3 slides rotativos
 *   3. TrustBadges — 4 promesas BotasLeón
 *   4. "Lo más nuevo" — grid de productos (vacío hasta cargar Shopify)
 *   5. BrandGrid — sección "Nuestras marcas" (placeholders)
 *   6. Storytelling "Hecho en León"
 *   7. "Más vendidos" — segundo grid de productos
 *   8. FAQAccordion — 6 preguntas frecuentes
 *   9. Newsletter signup
 *   10. Footer
 *
 * Server fetch a Shopify Storefront API por sección que lo requiera.
 * Si la tienda no tiene productos aún, el EmptyState mantiene la home
 * visualmente completa.
 */
export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({ first: 8 })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  // Hero slides desde Metaobjects — getHeroSlides() ya maneja errores
  // y devuelve [] si la definition aún no existe; HeroCarousel cae
  // al placeholder en ese caso.
  const heroSlides = await getHeroSlides()

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroCarousel slides={heroSlides} />

        <TrustBadges />

        <CategoryShowcase />

        {/* Lo más nuevo */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-leather mb-2">Catálogo</p>
              <h2 className="font-heading text-3xl md:text-4xl text-text">
                Lo más nuevo
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
            >
              Ver todo →
            </Link>
          </div>

          {fetchError ? (
            <div className="border border-red-300 bg-red-50 text-red-900 rounded-sm p-6">
              <p className="font-medium mb-2">Error al cargar productos de Shopify</p>
              <p className="text-sm font-mono break-all">{fetchError}</p>
            </div>
          ) : products.length === 0 ? (
            <EmptyProductsState
              title="Próximamente"
              description="Estamos cargando el catálogo con las primeras botas de los talleres de León."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <BrandGrid />

        {/* Storytelling Hecho en León */}
        <section className="bg-leather text-bg py-24 md:py-32 relative overflow-hidden">
          {/* Texture overlay sutil */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, rgba(0,0,0,0.4) 0%, transparent 50%)
              `,
            }}
          />

          <div className="relative mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-7">
                <p className="eyebrow text-gold mb-4">Origen</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-bg leading-[1.05] mb-8">
                  Hecho en León,
                  <br />
                  Guanajuato.
                </h2>
                <p className="text-bg-alt text-lg leading-relaxed mb-6 max-w-xl">
                  León lleva <strong className="text-bg">380 años</strong>{" "}
                  haciendo calzado. Es la capital mundial del cuero — el lugar
                  donde nacen 7 de cada 10 botas mexicanas.
                </p>
                <p className="text-bg-alt text-lg leading-relaxed mb-10 max-w-xl">
                  Nosotros somos curadores: recorremos los talleres, verificamos
                  cada par, y traemos solo lo que vale la pena, directo a tu
                  puerta.
                </p>
                <Link
                  href="/sobre-nosotros"
                  className="inline-flex items-center px-8 py-4 border border-bg/40 text-bg hover:bg-bg/10 transition-colors"
                >
                  Conoce nuestra historia
                  <span className="ml-2">→</span>
                </Link>
              </div>

              <div className="md:col-span-5">
                <div className="aspect-[4/5] bg-gradient-to-br from-leather-light via-cognac to-terracotta-dark relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-display text-7xl text-bg mb-2">380</p>
                      <p className="eyebrow text-bg/80">Años de tradición</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Más vendidos */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-leather mb-2">Selección</p>
              <h2 className="font-heading text-3xl md:text-4xl text-text">
                Más vendidos
              </h2>
            </div>
            <Link
              href="/products?sort=best-selling"
              className="hidden sm:inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
            >
              Ver todo →
            </Link>
          </div>

          {products.length === 0 ? (
            <EmptyProductsState
              title="Aún sin datos de ventas"
              description="Esta sección se llenará automáticamente cuando empieces a vender."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <FAQAccordion />

        {/* Newsletter */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="border border-border p-10 md:p-16 text-center bg-bg-alt">
            <p className="eyebrow text-leather mb-3">Newsletter</p>
            <h3 className="font-heading text-2xl md:text-3xl text-text mb-3">
              Las novedades, antes que nadie.
            </h3>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Lanzamientos, ofertas exclusivas y novedades de los talleres de
              León. Sin spam, prometido.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="flex-1 px-4 py-3 border border-border bg-bg focus:outline-none focus:border-leather"
                aria-label="Correo electrónico"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-leather text-bg font-medium hover:bg-text transition-colors"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
