import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { HeroCarousel } from "@/components/HeroCarousel"
import { MarqueeBar } from "@/components/MarqueeBar"
import { CategoryShowcase } from "@/components/CategoryShowcase"
import { BrandGrid } from "@/components/BrandGrid"
import { FAQAccordion } from "@/components/FAQAccordion"
import { LatestByGenderTabs } from "@/components/LatestByGenderTabs"
import { AccessoriesShowcase } from "@/components/AccessoriesShowcase"
import { NewsletterForm } from "@/components/NewsletterForm"
import { HechoEnLeonStrip } from "@/components/HechoEnLeonStrip"
import { FAQJsonLd } from "@/components/StructuredData"
import { FAQS } from "@/lib/faqs"
import { absoluteUrl } from "@/lib/seo"
import { getHeroSlides, getProductsByTaxonomy } from "@/lib/shopify"

// Canonical para el home (las páginas hijas ya lo tienen vía pageMetadata).
// El title default y description vienen del layout — no los reescribimos.
export const metadata = {
  alternates: { canonical: absoluteUrl("/") },
}

/**
 * Home page (server component, Next.js 16).
 *
 * Orden re-jerarquizado para conversión (productos visibles en viewport 2):
 *   1. Header sticky
 *   2. MarqueeBar — trust strip arriba del Hero (MSI · envío · cambios)
 *   3. HeroCarousel — 3 slides Metaobjects con Ken Burns (intacto)
 *   4. LatestByGenderTabs — productos reales JUSTO después del Hero
 *   5. CategoryShowcase — 3 cards Hombre/Mujer/Accesorios
 *   6. BrandGrid — Marcas (oculto cuando 0 marcas, curado cuando 1-3)
 *   7. HechoEnLeonStrip — banda compacta 380 años · 7 de 10 · curadores
 *   8. FAQAccordion
 *   9. Newsletter
 *  10. Footer
 *
 * Por qué este orden:
 *  - MarqueeBar arriba del Hero = trust signals visibles en scroll 0 (patrón Zara/H&M).
 *  - LatestByGenderTabs justo tras Hero = el usuario ve botas reales en viewport 2,
 *    no después de 4-5 scrolls (antes la 1ª bota aparecía en pos 6).
 *  - Storytelling 380 años pasa de sección XL (~700px) a strip horizontal (~250px) =
 *    libera 1 viewport completo en mobile manteniendo la narrativa.
 *
 * La sección storytelling completa antigua se mantiene en git history; si en
 * el futuro se quiere recuperar como "Acerca de" en /nosotros, restaurar desde
 * commit anterior.
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

        {/* Trust strip ARRIBA del Hero — patrón Zara/H&M/Liverpool */}
        <MarqueeBar />

        {/* Hero — intacto */}
        <HeroCarousel slides={heroSlides} />

        {/* PRODUCTOS REALES en viewport 2 (antes pos 6, ahora pos 4) */}
        <LatestByGenderTabs
          hombreProducts={hombreProducts}
          mujerProducts={mujerProducts}
        />

        <CategoryShowcase />

        {/* Accesorios — banda compacta, oculto si no hay productos. */}
        <AccessoriesShowcase />

        <BrandGrid />

        {/* Storytelling compacto — banda horizontal en lugar de sección XL */}
        <HechoEnLeonStrip />

        <FAQAccordion />

        {/* Newsletter — id newsletter para scroll-target del AnnouncementBar */}
        <section id="newsletter" className="mx-auto max-w-7xl px-6 py-20 scroll-mt-24">
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
