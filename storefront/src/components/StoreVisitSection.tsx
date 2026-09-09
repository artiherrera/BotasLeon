"use client"

import { useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"

/**
 * StoreVisitSection — bloque de confianza en el home: "tenemos tienda física".
 * Dirección + horario + mapa. El detalle completo vive en /visitanos. El iframe
 * de Maps requiere frame-src google en la CSP (ya configurado en next.config).
 */

const MAPS_QUERY = "Blvd. Hilario Medina 407, Josefina, 37260 León, Guanajuato"
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`
const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAPS_QUERY)}`

export function StoreVisitSection() {
  const t = useT()
  // El iframe de Google tardaba varios segundos en pintar y mientras tanto
  // dejaba un rectángulo vacío del tamaño de media sección. Ahora el mapa se
  // carga cuando alguien lo pide: hasta entonces se ve el plato con la
  // dirección, que es el dato que casi todo el mundo venía a buscar.
  const [verMapa, setVerMapa] = useState(false)

  return (
    <section className="contenedor seccion">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Texto */}
        <div>
          <p className="eyebrow text-text-muted mb-2">{t("nav.visit")}</p>
          <h2 className="display-m mb-4">{t("store.title")}</h2>
          <p className="cuerpo-l medida-lectura mb-6 text-text-muted">
            {t("store.desc")}
          </p>
          <div className="mb-8 space-y-1">
            <p className="cuerpo">Blvd. Hilario Medina 407, 2º piso</p>
            <p className="cuerpo text-text-muted">Col. Josefina, 37260 León, Gto.</p>
            <p className="cuerpo text-text-muted">{t("store.hours")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/visitanos" className="btn btn-sec">
              {t("store.viewStore")}
            </Link>
            <a
              href={MAPS_DIR}
              target="_blank"
              rel="noopener noreferrer"
              // .btn-ter vuelve la altura a auto (son ~19px de texto): min-h-11
              // le devuelve los 44px de objetivo táctil sin ponerle caja.
              className="btn btn-ter min-h-11 self-center"
            >
              {t("store.directions")}
            </a>
          </div>
        </div>

        {/* Mapa: plato con la dirección hasta que el visitante lo pide. */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-plate lg:aspect-[3/2]">
          {verMapa ? (
            <iframe
              title={t("store.mapTitle")}
              src={MAPS_EMBED}
              className="h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setVerMapa(true)}
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 px-6 text-center"
            >
              <span className="cuerpo font-medium">
                Blvd. Hilario Medina 407, 2º piso
              </span>
              <span className="cuerpo text-text-muted">
                Col. Josefina, 37260 León, Gto.
              </span>
              <span className="nota mt-2 text-leather">{t("store.mapPlaceholder")}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
