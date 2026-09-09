import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Localized } from "@/components/Localized"
import { T } from "@/components/T"
import { pageMetadata } from "@/lib/seo"
import { whatsappHref, storeVisitWhatsappMessage } from "@/lib/whatsapp"
import { getStorePhotos } from "@/lib/shopify"
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config"

export const revalidate = 60

/**
 * /visitanos — tienda física en León. Genera confianza ("somos reales"):
 * hero + dirección + mapa embebido de Google + CTAs (cómo llegar / agendar por
 * WhatsApp). El iframe de Maps requiere frame-src google en la CSP (next.config).
 *
 * NOTA: horario es un valor por defecto — confirmar/ajustar con el dueño.
 *
 * FOTO DEL HERO: no hay. El hero apuntaba por CSS a /tienda-hero.jpg, un archivo
 * que nunca se subió, así que cada visita se comía un 404 y el fondo real era el
 * degradado de respaldo. Ese degradado tampoco era degradado: el tema remapea
 * leather-light al mismo #6B4A2E del cuero y leather-dark ni existe. Mientras no
 * haya foto, el hero es plato liso con la tinta encima; cuando llegue la foto se
 * mete con <Image> y la clase .plato-foto (nunca .plato a secas: el multiply
 * sobre una toma de ambiente apaga los medios tonos y le mete dominante
 * amarilla).
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

export default async function VisitanosPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  // El idioma de la URL manda el mensaje precargado de WhatsApp (el layout ya
  // hace notFound() si el segmento no es un locale válido).
  const { lang } = await params
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  // Galería de fotos del local — metaobjeto "store_photo" que el admin sube
  // desde Shopify. Vacío hasta que existan → la sección se auto-oculta.
  const photos = await getStorePhotos()

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        {/* Hero sobre plato. */}
        <section className="bg-plate text-text border-b border-border-plate">
          <div className="contenedor py-20 md:py-28">
            <p className="eyebrow text-text-muted mb-4">
              <T k="page.visitanos.eyebrow" />
            </p>
            <h1 className="display-l text-text mb-4 max-w-3xl">
              <T k="page.visitanos.heroTitle" />
            </h1>
            <p className="cuerpo-l medida-lectura text-text-muted">
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
        <section className="contenedor py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="display-m text-text mb-6">
                <T k="page.visitanos.findUs" />
              </h2>

              <div className="space-y-6">
                <div>
                  <p className="eyebrow text-text-muted mb-1">
                    <T k="page.visitanos.labelAddress" />
                  </p>
                  <p className="cuerpo-l text-text">
                    {ADDRESS_LINE}
                    <br />
                    {ADDRESS_AREA}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-text-muted mb-1">
                    <T k="page.visitanos.labelHours" />
                  </p>
                  <p className="cuerpo text-text-muted">
                    <Localized
                      es={<>Lunes a sábado · 10:00 – 19:00</>}
                      en={<>Monday to Saturday · 10 a.m. – 7 p.m.</>}
                    />
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-text-muted mb-1">
                    <T k="page.visitanos.labelContact" />
                  </p>
                  <p className="cuerpo text-text-muted">WhatsApp: +52 479 303 2457</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={MAPS_DIR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <T k="page.visitanos.ctaDirections" /> →
                </a>
                <a
                  href={whatsappHref(locale, storeVisitWhatsappMessage(locale))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sec"
                >
                  <T k="page.visitanos.ctaSchedule" />
                </a>
              </div>
            </div>

            {/* Mapa embebido (Google Maps, sin API key) */}
            <div className="w-full aspect-[4/3] lg:aspect-auto lg:h-[440px] overflow-hidden border border-border bg-plate">
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
          <section className="contenedor pb-16 md:pb-20">
            <h2 className="display-m text-text mb-6">
              <T k="page.visitanos.insideTitle" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {photos.map((p) => (
                <div
                  key={p.handle}
                  className="plato plato-foto aspect-[4/3]"
                >
                  <Image
                    src={p.image.url}
                    alt={
                      p.image.altText || "Tienda BotasLeón en León, Guanajuato"
                    }
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
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
