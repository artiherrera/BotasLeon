"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"

/**
 * HechoEnLeonStrip — versión compacta del bloque storytelling "Hecho en León".
 *
 * Reemplaza la sección de ~700px que llevaba número 380 gigante + 2
 * párrafos + bloque visual gradient. Misma narrativa en 3 columnas
 * compactas (~200px tall): tradición · origen · curaduría.
 *
 * Es la ÚNICA banda oscura de la portada: con el pie ya sobre plato, esta
 * franja es lo que corta el crema de arriba abajo. Las cifras van en la serif
 * a su único peso (400), no en la Fraunces 600 de antes.
 */
export function HechoEnLeonStrip() {
  const t = useT()
  return (
    <section className="bg-text text-bg relative overflow-hidden">
      {/* Texture overlay sutil — preservada del original */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(0,0,0,0.4) 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative contenedor py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
          <div>
            <p className="display-l text-bg mb-2">
              380
            </p>
            <p className="eyebrow text-bg mb-1">{t("trust.yearsTradition")}</p>
            <p className="cuerpo text-bg/80">
              {t("trust.leonDesc")}
            </p>
          </div>

          <div>
            <p className="display-l text-bg mb-2">
              {t("trust.mexicanBootsStat")}
            </p>
            <p className="eyebrow text-bg mb-1">{t("trust.mexicanBoots")}</p>
            <p className="cuerpo text-bg/80">
              {t("trust.mexicanBootsDesc")}
            </p>
          </div>

          <div>
            <p className="display-l text-bg mb-2">
              100%
            </p>
            <p className="eyebrow text-bg mb-1">{t("trust.genuineLeather")}</p>
            <p className="cuerpo text-bg/80">
              {t("trust.genuineLeatherDesc")}
            </p>
          </div>
        </div>

        <div className="mt-8 md:mt-10 text-center md:text-left">
          <Link
            href="/nosotros"
            className="nav-label group inline-flex items-center text-bg/90 hover:text-bg transition-colors duration-[180ms]"
          >
            {t("trust.ourStory")}
            <span className="ml-2 transition-transform duration-[180ms] group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
