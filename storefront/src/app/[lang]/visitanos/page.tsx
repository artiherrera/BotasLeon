import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Localized } from "@/components/Localized"
import { T } from "@/components/T"
import { pageMetadata } from "@/lib/seo"
import { whatsappHref } from "@/lib/whatsapp"
import { getStorePhotos } from "@/lib/shopify"

export const revalidate = 60

/**
 * /visitanos — tienda física en León. Genera confianza ("somos reales"):
 * hero + dirección + mapa embebido de Google + CTAs (cómo llegar / agendar por
 * WhatsApp). El iframe de Maps requiere frame-src google en la CSP (next.config).
 *
 * NOTA: horario es un valor por defecto — confirmar/ajustar con el dueño. La
 * foto del hero está pendiente (por ahora usa degradado de marca).
 */

const ADDRESS_LINE = "Blvd. Hilario Medina 407, 2º piso"
const ADDRESS_AREA = "Col. Josefina, 37260 León de los Aldama, Gto."
const MAPS_QUERY = "Blvd. Hilario Medina 407, Josefina, 37260 León, Guanajuato"
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`
const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAPS_QUERY)}`

const STORE_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Store",
  name: "BotasLeón",
  image: "https://botasleon.com/logo_botasleon.png",
  url: "https://botasleon.com/visitanos",
  telephone: "+524793032457",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Blvd. Hilario Medina 407, 2º piso",
    addressLocality: "León",
    addressRegion: "Guanajuato",
    postalCode: "37260",
    addressCountry: "MX",
  },
}).replace(/</g, "\\u003c")

export default async function VisitanosPage() {
  // Galería de fotos del local — metaobjeto "store_photo" que el admin sube
  // desde Shopify. Vacío hasta que existan → la sección se auto-oculta.
  const photos = await getStorePhotos()

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        {/* Hero. Para poner la foto del local: sube el archivo a
            public/tienda-hero.jpg (horizontal, ~2400×1350). Aparece sola vía
            background CSS — sin tocar código. Mientras no exista, se ve el
            degradado de cuero de fondo. */}
        <section className="relative overflow-hidden bg-gradient-to-br from-leather via-leather-light to-leather-dark text-bg">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/tienda-hero.jpg')" }}
          />
          {/* Scrim inferior — legibilidad del texto sobre cualquier foto. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
            <p className="eyebrow text-bg mb-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
              <T k="page.visitanos.eyebrow" />
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-4 max-w-3xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <T k="page.visitanos.heroTitle" />
            </h1>
            <p className="text-bg/90 text-lg max-w-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              <Localized
                es={
                  <>
                    Ven a conocer y probarte nuestras botas en persona — hechas en
                    León, la capital mundial del cuero.
                  </>
                }
                en={
                  <>
                    Come see and try on our boots in person — made in León, the
                    world capital of leather.
                  </>
                }
              />
            </p>
          </div>
        </section>

        {/* Datos + mapa */}
        <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="font-heading text-2xl text-text mb-6">
                <T k="page.visitanos.findUs" />
              </h2>

              <div className="space-y-6">
                <div>
                  <p className="eyebrow text-leather mb-1">
                    <T k="page.visitanos.labelAddress" />
                  </p>
                  <p className="text-text text-lg leading-snug">
                    {ADDRESS_LINE}
                    <br />
                    {ADDRESS_AREA}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-leather mb-1">
                    <T k="page.visitanos.labelHours" />
                  </p>
                  <p className="text-text-muted">
                    <Localized
                      es={<>Lunes a sábado · 10:00 – 19:00</>}
                      en={<>Monday to Saturday · 10 a.m. – 7 p.m.</>}
                    />
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-leather mb-1">
                    <T k="page.visitanos.labelContact" />
                  </p>
                  <p className="text-text-muted">WhatsApp: +52 479 303 2457</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={MAPS_DIR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-text text-bg text-sm hover:bg-leather transition-colors"
                >
                  <T k="page.visitanos.ctaDirections" /> →
                </a>
                <a
                  href={whatsappHref(
                    "¡Hola! 👋 Me gustaría agendar una visita a su tienda en León para ver y probarme sus botas. ¿Qué día y horario me recomiendan?"
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
                >
                  <T k="page.visitanos.ctaSchedule" />
                </a>
              </div>
            </div>

            {/* Mapa embebido (Google Maps, sin API key) */}
            <div className="w-full aspect-[4/3] lg:aspect-auto lg:h-[440px] overflow-hidden rounded-sm border border-border bg-bg-alt">
              <iframe
                title="Ubicación de BotasLeón en Google Maps"
                src={MAPS_EMBED}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Galería del local — metaobjeto "store_photo". Se oculta si aún no
            hay fotos subidas desde Shopify. */}
        {photos.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
            <h2 className="font-heading text-2xl text-text mb-6">
              <T k="page.visitanos.insideTitle" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {photos.map((p) => (
                <div
                  key={p.handle}
                  className="relative aspect-[4/3] overflow-hidden rounded-sm bg-bg-alt"
                >
                  <Image
                    src={p.image.url}
                    alt={
                      p.image.altText || "Tienda BotasLeón en León, Guanajuato"
                    }
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* LocalBusiness (Store) JSON-LD — SEO local + confianza en Google. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: STORE_JSONLD }}
      />
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/visitanos",
  title: "Visítanos — nuestra tienda en León",
  description:
    "Ven a conocer y probarte nuestras botas en persona. Blvd. Hilario Medina 407, León, Guanajuato. Cómo llegar, horarios y ubicación.",
  })
}
