import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { HeroPortada } from "@/components/HeroPortada"
import { CategoryShowcase } from "@/components/CategoryShowcase"
import { BrandGrid } from "@/components/BrandGrid"
import { FAQAccordion } from "@/components/FAQAccordion"
import { LoMasNuevo } from "@/components/LoMasNuevo"
import { Cinturones } from "@/components/Cinturones"
import { HechoEnLeonStrip } from "@/components/HechoEnLeonStrip"
import { HomeReviews } from "@/components/HomeReviews"
import { StoreVisitSection } from "@/components/StoreVisitSection"
import { FAQJsonLd } from "@/components/StructuredData"
import { FAQS } from "@/lib/faqs"
import { absoluteUrl } from "@/lib/seo"
import { getHeroSlides, getProductsByStyle, getProductsByTaxonomy, isBoot } from "@/lib/shopify"
import { BandaCatalogo } from "@/components/BandaCatalogo"
import { BotasExoticas } from "@/components/BotasExoticas"

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
 * Orden de la portada — la arquitectura la fijó el dueño (2026-09-17):
 *   1. Header (la barra de avisos va dentro de él, para que salga en todo el sitio)
 *   2. HeroPortada — una sola foto, sin carrusel
 *   3. LoMasNuevo — cuatro botas reales en el segundo golpe de vista (×2: hombre, mujer)
 *   4. BotasExoticas — ocho exóticas al azar, sin mirar el sexo
 *   5. Cinturones — los cintos como tarjetas (antes era un banner con una foto)
 *   6. CategoryShowcase — el trío Hombre / Mujer / Outlet
 *   7. BrandGrid — la frase de marca con los logos de los talleres
 *   8. HechoEnLeonStrip — la banda de datos (la única banda oscura de la página)
 *   9. HomeReviews — tres reseñas de cinco estrellas
 *  10. StoreVisitSection — la tienda física en León
 *  11. FAQAccordion
 *  12. BandaCatalogo — el catálogo PDF, "hasta el final"
 *  13. Footer
 *
 * Las FAQ se quedan aquí porque el <FAQJsonLd> de abajo declara esas mismas
 * preguntas: si el acordeón se fuera del home, el JSON-LD tendría que irse con
 * él (datos estructurados sin contenido visible es lo que Google penaliza).
 */
export default async function HomePage() {
  // "Lo más nuevo" son DOS filas, una por género, y cada una necesita su propia
  // consulta: el orden por fecha de alta es GLOBAL, así que un solo batch se
  // llena con lo que se subió último y puede no traer ni una bota de mujer.
  // El tope de 250 es el máximo de la Storefront API y hace falta de verdad —
  // con menos, el género cuyas botas se cargaron antes salía vacío.
  // isBoot es obligatorio: getProductsByTaxonomy no filtra por tipo y un cinto
  // se colaría entre las botas.
  // Las exóticas van COMPLETAS (23 hoy): BotasExoticas elige ocho al azar en
  // el navegador. No se barajan aquí porque Amplify no regenera esta página
  // entre deploys aunque diga revalidate 60 (medido; ver BotasExoticas).
  const [nuevosHombre, nuevosMujer, exoticas, heroSlides] = await Promise.all([
    getProductsByTaxonomy("gender", "masculino", 250, { sortKey: "CREATED_AT" })
      .then((ps) => ps.filter(isBoot).slice(0, 4))
      .catch(() => []),
    getProductsByTaxonomy("gender", "femenino", 250, { sortKey: "CREATED_AT" })
      .then((ps) => ps.filter(isBoot).slice(0, 4))
      .catch(() => []),
    getProductsByStyle("exoticas").catch(() => []),
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

        <LoMasNuevo
          products={nuevosHombre}
          titulo="latest.tabMen"
          href="/hombre"
          eyebrow="latest.eyebrow"
          pareja={nuevosMujer.length > 0 ? "arriba" : null}
        />

        <LoMasNuevo
          products={nuevosMujer}
          titulo="latest.tabWomen"
          href="/mujer"
          pareja={nuevosHombre.length > 0 ? "abajo" : null}
        />

        {/* Ocho exóticas al azar, sin mirar el sexo: pedido del dueño, justo
            después de las novedades por género. */}
        <BotasExoticas pool={exoticas} />

        {/* Los cintos como tarjetas, después de las exóticas. */}
        <Cinturones />

        <CategoryShowcase />

        <BrandGrid />

        <HechoEnLeonStrip />

        {/* Prueba social: se rellena en cliente desde Judge.me; si no hay
            reseñas de cinco estrellas, la sección no se pinta. */}
        <HomeReviews />

        {/* Confianza: tienda física en León (dirección + mapa → /visitanos) */}
        <StoreVisitSection />

        <FAQAccordion />

        {/* EL CATÁLOGO, HASTA EL FINAL, por decisión del dueño (2026-09-17).
            Estuvo un tiempo tras las novedades para que no cayera al 95% del
            recorrido; ahora es lo último antes del pie: quien llega hasta aquí
            ya vio todo y el catálogo es el "llévatelo todo" de despedida. */}
        <BandaCatalogo />
      </main>
      <Footer />
    </>
  )
}
