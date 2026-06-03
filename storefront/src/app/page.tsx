import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { HeroCarousel } from "@/components/HeroCarousel"
import { MarqueeBar } from "@/components/MarqueeBar"
import { CategoryShowcase } from "@/components/CategoryShowcase"
import { BrandGrid } from "@/components/BrandGrid"
import { FAQAccordion } from "@/components/FAQAccordion"
import { LatestByGenderTabs } from "@/components/LatestByGenderTabs"
import { NewsletterForm } from "@/components/NewsletterForm"
import { FAQJsonLd } from "@/components/StructuredData"
import { FAQS } from "@/lib/faqs"
import { getHeroSlides, getProductsByTaxonomy } from "@/lib/shopify"

/**
 * Home page (server component, Next.js 16).
 *
 * Orden (re-jerarquizado):
 *   1. Header sticky
 *   2. HeroCarousel — 3 slides Metaobjects con Ken Burns
 *   3. MarqueeBar — cintillo trust con 4 mensajes
 *   4. CategoryShowcase — 3 cards Hombre/Mujer/Niños
 *   5. BrandGrid — Marcas que comercializamos (Metaobjects)
 *   6. LatestByGenderTabs — Lo más nuevo con tabs Hombre/Mujer
 *   7. Storytelling "Hecho en León" — brand anchor antes del cierre
 *   8. FAQAccordion
 *   9. Newsletter
 *   10. Footer
 *
 * Eliminada la sección "Más vendidos" mientras el catálogo es chico
 * (mostraba los mismos productos que "Lo más nuevo" → redundante).
 * Cuando haya 20+ productos la re-introducimos con datos distintos
 * o cambiamos a "Curated" / "Editor's pick".
 */
export default async function HomePage() {
  // Parallel fetch — hero + 2 grids por género en una pasada.
  const [hombreProducts, mujerProducts, heroSlides] = await Promise.all([
    getProductsByTaxonomy("gender", "masculino", 8).catch(() => []),
    getProductsByTaxonomy("gender", "femenino", 8).catch(() => []),
    getHeroSlides().catch(() => []),
  ])

  return (
    <>
      <Header />
      <FAQJsonLd items={FAQS} />
      <main className="flex-1">
        <h1 className="sr-only">
          Botas mexicanas hechas en León — vaqueras, clásicas, exóticas y de
          rancho
        </h1>
        <HeroCarousel slides={heroSlides} />

        <MarqueeBar />

        <CategoryShowcase />

        <BrandGrid />

        <LatestByGenderTabs
          hombreProducts={hombreProducts}
          mujerProducts={mujerProducts}
        />

        {/* Storytelling Hecho en León — brand anchor antes del cierre */}
        <section className="bg-leather text-bg py-24 md:py-32 relative overflow-hidden">
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
                  href="/nosotros"
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

        <FAQAccordion />

        {/* Newsletter */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="border border-border p-10 md:p-16 text-center bg-bg-alt">
            <p className="eyebrow text-leather mb-3">Newsletter</p>
            <h3 className="font-heading text-2xl md:text-3xl text-text mb-3">
              Suscríbete y recibe 10% en tu primera compra
            </h3>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Plus las novedades de las marcas de León antes que nadie. Sin
              spam, prometido.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
