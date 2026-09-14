"use client"

import Image from "next/image"
import { useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"

/**
 * El catálogo, con sitio propio en la portada.
 *
 * Estaba solo en el pie: medido en producción, el único enlace visible desde la
 * portada caía en y=7075 de una página de 7458px — al 95% del recorrido. Para
 * encontrarlo había que bajar entera la portada, y el dueño lo dijo en corto:
 * "no me aparece accesible el catálogo desde la página principal". El otro
 * sitio donde vive es el listado, que ya es un paso adentro.
 *
 * LA IMAGEN ES LA PORTADA DE VERDAD del catálogo, no una foto de adorno: el
 * generador ya deja cada página como webp en /catalogo/{es,en}/p-001.webp, y es
 * la misma que verá al abrirlo. Enseñar la portada real es la forma más honesta
 * de anunciar un catálogo — y no cuesta un archivo nuevo.
 *
 * Por MERCADO y no por idioma, igual que el botón del listado y el enlace del
 * pie: el catálogo trae los precios horneados, y el de México está en pesos.
 */
export function BandaCatalogo() {
  const t = useT()
  const visor = isMX ? "/catalogo-es.html" : "/catalogo-en.html"
  const portada = isMX ? "/catalogo/es/p-001.webp" : "/catalogo/en/p-001.webp"

  return (
    <section className="bg-plate border-y border-border-plate">
      <div className="contenedor grid items-center gap-8 py-14 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-16 md:py-20">
        {/* La portada, con su proporción real (816×1056) para que no se
            deforme ni haya que recortarla. Enlace además de la imagen: en un
            teléfono la gente toca la foto antes que el botón. */}
        <a href={visor} className="group block" aria-label={t("catalogo.ver")}>
          <span className="block overflow-hidden border border-border-plate bg-bg">
            <Image
              src={portada}
              alt=""
              width={816}
              height={1056}
              sizes="(min-width: 768px) 26rem, 100vw"
              className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </span>
        </a>

        <div>
          <p className="eyebrow text-xs text-text-muted">
            {t("catalogo.eyebrow")}
          </p>
          <h2 className="display-m mt-3 text-text">{t("catalogo.titulo")}</h2>
          <p className="cuerpo mt-4 max-w-[46ch] text-text-muted">
            {t("catalogo.texto")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={visor} className="btn">
              {t("catalogo.ver")}
            </a>
            {/* `download` no fuerza la descarga en un dominio distinto, pero
                aquí el archivo es nuestro, así que sí baja en vez de abrirse. */}
            <a
              href={isMX ? "/catalogo-es.pdf" : "/catalogo-en.pdf"}
              download
              className="btn btn-sec"
            >
              {t("catalogo.pdf")}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
