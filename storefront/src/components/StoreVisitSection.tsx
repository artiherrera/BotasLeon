"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"

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
  const t = useT()
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Texto */}
        <div>
          <p className="eyebrow text-leather mb-2">{t("nav.visit")}</p>
          <h2 className="font-display text-3xl md:text-4xl text-text mb-4">
            {t("store.title")}
          </h2>
          <p className="text-text-muted max-w-md mb-6 leading-relaxed">
            {t("store.desc")}
          </p>
          <div className="space-y-1 mb-8">
            <p className="text-text">Blvd. Hilario Medina 407, 2º piso</p>
            <p className="text-text-muted">Col. Josefina, 37260 León, Gto.</p>
            <p className="text-text-muted">{t("store.hours")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/visitanos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-text text-bg text-sm hover:bg-leather transition-colors"
            >
              {t("store.viewStore")} →
            </Link>
            <a
              href={MAPS_DIR}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-leather text-leather text-sm hover:bg-text hover:text-bg transition-colors"
            >
              {t("store.directions")}
            </a>
          </div>
        </div>

        {/* Mapa embebido (lazy) */}
        <div className="w-full aspect-[4/3] lg:aspect-[3/2] overflow-hidden rounded-sm border border-border bg-bg-alt">
          <iframe
            title={t("store.mapTitle")}
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
