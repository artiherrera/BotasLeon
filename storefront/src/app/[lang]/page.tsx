import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { HeroPortada } from "@/components/HeroPortada"
import { CategoryShowcase } from "@/components/CategoryShowcase"
import { BrandGrid } from "@/components/BrandGrid"
import { FAQAccordion } from "@/components/FAQAccordion"
import { LoMasNuevo } from "@/components/LoMasNuevo"
import { BannerCintos } from "@/components/BannerCintos"
import { HechoEnLeonStrip } from "@/components/HechoEnLeonStrip"
import { HomeReviews } from "@/components/HomeReviews"
import { StoreVisitSection } from "@/components/StoreVisitSection"
import { FAQJsonLd } from "@/components/StructuredData"
import { FAQS } from "@/lib/faqs"
import { absoluteUrl } from "@/lib/seo"
import { getHeroSlides, getProducts, isBoot } from "@/lib/shopify"

// Canonical + hreflang del home POR IDIOMA (las hijas lo hacen vía pageMetadata).
// El title/description los hereda del layout (ya localizados) — no los reescribimos.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const path = lang === "en" ? "/en" : "/es"
  return {
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        "es-US": absoluteUrl("/es"),
        "en-US": absoluteUrl("/en"),
        "x-default": absoluteUrl("/en"),
      },
    },
    openGraph: { url: absoluteUrl(path) },
  }
}

// El home mezcla data que cambia (precios/stock) con secciones editables desde
// el admin. Sin request-time APIs, la página se prerenderiza en build; este
// revalidate evita que precios/stock queden congelados hasta el próximo
// deploy. Consistente con las rutas de catálogo.
export const revalidate = 60

/**
 * Home page (server component, Next.js 16).
 *
 * Orden de la portada:
 *   1. Header (la barra de avisos va dentro de él, para que salga en todo el sitio)
 *   2. HeroPortada — una sola foto, sin carrusel
 *   3. LoMasNuevo — cuatro botas reales en el segundo golpe de vista
 *   4. CategoryShowcase — el trío Hombre / Mujer / Exóticas
 *   5. BrandGrid — la frase de marca con los logos de los talleres
 *   6. HechoEnLeonStrip — la banda de datos (la única banda oscura de la página)
 *   7. HomeReviews — tres reseñas de cinco estrellas
 *   8. BannerCintos — los cintos, a lo ancho
 *   9. StoreVisitSection — la tienda física en León
 *  10. FAQAccordion + Footer
 *
 * Las FAQ se quedan aquí porque el <FAQJsonLd> de abajo declara esas mismas
 * preguntas: si el acordeón se fuera del home, el JSON-LD tendría que irse con
 * él (datos estructurados sin contenido visible es lo que Google penaliza).
 */
export default async function HomePage() {
  // Un solo fetch para "Lo más nuevo". Antes eran dos pasadas de 250 productos
  // (una por género) porque la sección tenía pestañas Hombre/Mujer; ahora es
  // una fila única ordenada por fecha de alta, así que basta con el batch más
  // reciente. isBoot es obligatorio: getProducts NO filtra por tipo y un cinto
  // se colaría entre las botas.
  const [nuevos, heroSlides] = await Promise.all([
    getProducts({ first: 24, sortKey: "CREATED_AT", reverse: true })
      .then((r) => r.products.filter(isBoot).slice(0, 4))
      .catch(() => []),
    getHeroSlides().catch(() => []),
  ])

  return (
    <>
      <Header />
      <FAQJsonLd items={FAQS} />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <h1 className="sr-only">
          Botas mexicanas hechas en León — vaqueras, clásicas, exóticas y de
          rancho
        </h1>

        <HeroPortada slides={heroSlides} />

        <LoMasNuevo products={nuevos} />

        <CategoryShowcase />

        <BrandGrid />

        <HechoEnLeonStrip />

        {/* Prueba social: se rellena en cliente desde Judge.me; si no hay
            reseñas de cinco estrellas, la sección no se pinta. */}
        <HomeReviews />

        <BannerCintos />

        {/* Confianza: tienda física en León (dirección + mapa → /visitanos) */}
        <StoreVisitSection />

        <FAQAccordion />
      </main>
      <Footer />
    </>
  )
}
