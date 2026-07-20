import Link from "next/link"

/**
 * StoreVisitSection — bloque de confianza en el home: "tenemos tienda física".
 * Mapa embebido (lazy, no pesa en el LCP) + dirección + CTAs. El detalle
 * completo vive en /visitanos. El iframe de Maps requiere frame-src google en
 * la CSP (ya configurado en next.config).
 */

const MAPS_QUERY = "Blvd. Hilario Medina 407, Josefina, 37260 León, Guanajuato"
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`
const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAPS_QUERY)}`

export function StoreVisitSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Texto */}
        <div>
          <p className="eyebrow text-leather mb-2">Visítanos</p>
          <h2 className="font-display text-3xl md:text-4xl text-text mb-4">
            Te esperamos en León
          </h2>
          <p className="text-text-muted max-w-md mb-6 leading-relaxed">
            No somos solo una tienda en línea: tenemos tienda física en León,
            Guanajuato. Ven a conocer y probarte tus botas en persona.
          </p>
          <div className="space-y-1 mb-8">
            <p className="text-text">Blvd. Hilario Medina 407, 2º piso</p>
            <p className="text-text-muted">Col. Josefina, 37260 León, Gto.</p>
            <p className="text-text-muted">Lunes a sábado · 10:00 – 19:00</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/visitanos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
            >
              Ver la tienda →
            </Link>
            <a
              href={MAPS_DIR}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-leather text-leather text-sm uppercase tracking-widest hover:bg-leather hover:text-bg transition-colors"
            >
              Cómo llegar
            </a>
          </div>
        </div>

        {/* Mapa embebido (lazy) */}
        <div className="w-full aspect-[4/3] lg:aspect-[3/2] overflow-hidden rounded-sm border border-border bg-bg-alt">
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
  )
}
