import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { pageMetadata } from "@/lib/seo"
import { whatsappHref } from "@/lib/whatsapp"

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
  telephone: "+524777608064",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Blvd. Hilario Medina 407, 2º piso",
    addressLocality: "León",
    addressRegion: "Guanajuato",
    postalCode: "37260",
    addressCountry: "MX",
  },
}).replace(/</g, "\\u003c")

export default function VisitanosPage() {
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
            <p className="eyebrow text-gold mb-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
              Visítanos
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-4 max-w-3xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              Te esperamos en nuestra tienda en León
            </h1>
            <p className="text-bg/90 text-lg max-w-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              Ven a conocer y probarte nuestras botas en persona — hechas en
              León, la capital mundial del cuero.
            </p>
          </div>
        </section>

        {/* Datos + mapa */}
        <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="font-heading text-2xl text-text mb-6">
                Cómo encontrarnos
              </h2>

              <div className="space-y-6">
                <div>
                  <p className="eyebrow text-leather mb-1">Dirección</p>
                  <p className="text-text text-lg leading-snug">
                    {ADDRESS_LINE}
                    <br />
                    {ADDRESS_AREA}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-leather mb-1">Horario</p>
                  <p className="text-text-muted">Lunes a sábado · 10:00 – 19:00</p>
                </div>
                <div>
                  <p className="eyebrow text-leather mb-1">Contacto</p>
                  <p className="text-text-muted">WhatsApp: +52 477 760 8064</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={MAPS_DIR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
                >
                  Cómo llegar →
                </a>
                <a
                  href={whatsappHref(
                    "¡Hola! 👋 Me gustaría visitar su tienda en León. ¿Me confirman el horario?"
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-widest hover:bg-leather hover:text-bg transition-colors"
                >
                  Agenda tu visita
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

export const metadata = pageMetadata({
  path: "/visitanos",
  title: "Visítanos — nuestra tienda en León",
  description:
    "Ven a conocer y probarte nuestras botas en persona. Blvd. Hilario Medina 407, León, Guanajuato. Cómo llegar, horarios y ubicación.",
})
