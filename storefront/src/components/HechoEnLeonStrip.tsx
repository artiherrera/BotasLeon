import Link from "next/link"

/**
 * HechoEnLeonStrip — versión compacta del bloque storytelling "Hecho en León".
 *
 * Reemplaza la sección de ~700px que llevaba número 380 gigante + 2
 * párrafos + bloque visual gradient. Misma narrativa en 3 columnas
 * compactas (~200px tall): tradición · origen · curaduría.
 *
 * Mantiene fondo leather + texto cream del original para consistency,
 * sin tomar tanto scroll. CTA "Conoce nuestra historia" sigue presente
 * al final.
 */
export function HechoEnLeonStrip() {
  return (
    <section className="bg-leather text-bg relative overflow-hidden">
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

      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
          <div>
            <p className="font-display text-4xl md:text-5xl text-bg leading-none mb-2">
              380
            </p>
            <p className="eyebrow text-gold text-[11px] mb-1">Años de tradición</p>
            <p className="text-bg-alt text-sm leading-relaxed">
              León lleva 380 años haciendo calzado. La capital mundial del cuero.
            </p>
          </div>

          <div>
            <p className="font-display text-4xl md:text-5xl text-bg leading-none mb-2">
              7 de 10
            </p>
            <p className="eyebrow text-gold text-[11px] mb-1">Botas mexicanas</p>
            <p className="text-bg-alt text-sm leading-relaxed">
              Nacen aquí. El epicentro del calzado de cuero en México.
            </p>
          </div>

          <div>
            <p className="font-display text-4xl md:text-5xl text-bg leading-none mb-2">
              100%
            </p>
            <p className="eyebrow text-gold text-[11px] mb-1">Piel genuina</p>
            <p className="text-bg-alt text-sm leading-relaxed">
              Cuero verificado en cada par. CITES certificado en colecciones exóticas.
            </p>
          </div>
        </div>

        <div className="mt-8 md:mt-10 text-center md:text-left">
          <Link
            href="/nosotros"
            className="inline-flex items-center text-bg/90 hover:text-bg text-sm uppercase tracking-wider transition-colors"
          >
            Conoce nuestra historia
            <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
