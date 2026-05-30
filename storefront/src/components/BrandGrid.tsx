import Link from "next/link"

/**
 * BrandGrid — sección "Nuestras marcas" en el home.
 *
 * Patrón estándar de retailer multi-marca: grid de cards, cada una
 * representa una marca que vendemos. Por ahora son placeholders
 * (Marca 1-6) hasta que el admin cargue las collections reales
 * con vendor en Shopify. Sustituir hard-coded por fetch de
 * `getCollections()` cuando existan.
 *
 * Decisión visual: cards con fondo cuero alternado, tipografía
 * grande (Bevan para nombre, Inter para count). Hover sutil que
 * cambia el contraste sin saltar.
 */

type BrandPlaceholder = {
  name: string
  description: string
  count: string
  bgClass: string
  textClass: string
}

const BRANDS: BrandPlaceholder[] = [
  {
    name: "Marca 01",
    description: "Vaqueras premium",
    count: "Próximamente",
    bgClass: "bg-leather",
    textClass: "text-bg",
  },
  {
    name: "Marca 02",
    description: "Botas de trabajo",
    count: "Próximamente",
    bgClass: "bg-bg-alt",
    textClass: "text-leather",
  },
  {
    name: "Marca 03",
    description: "Botines urbanos",
    count: "Próximamente",
    bgClass: "bg-terracotta",
    textClass: "text-bg",
  },
  {
    name: "Marca 04",
    description: "Cuero exótico",
    count: "Próximamente",
    bgClass: "bg-leather-light",
    textClass: "text-bg",
  },
  {
    name: "Marca 05",
    description: "Tradición artesanal",
    count: "Próximamente",
    bgClass: "bg-cognac",
    textClass: "text-text",
  },
  {
    name: "Marca 06",
    description: "Estilo casual",
    count: "Próximamente",
    bgClass: "bg-text",
    textClass: "text-bg",
  },
]

export function BrandGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="text-center mb-12">
        <p className="eyebrow text-leather mb-3">Marcas que comercializamos</p>
        <h2 className="font-heading text-3xl md:text-4xl text-text mb-3">
          Las mejores casas de León,
          <br />
          bajo un mismo techo.
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Trabajamos directamente con los talleres más respetados de la capital
          mundial del cuero. Cada marca pasa nuestro filtro.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {BRANDS.map((brand, idx) => (
          <Link
            key={idx}
            href="/marcas"
            className="group relative aspect-[5/4] overflow-hidden block"
          >
            <div className={`absolute inset-0 ${brand.bgClass}`} />

            {/* Texture overlay sutil */}
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
              }}
            />

            <div className={`relative h-full p-8 flex flex-col justify-between ${brand.textClass}`}>
              <div>
                <p className="eyebrow text-current opacity-70 text-xs mb-2">
                  {brand.description}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <h3 className="font-display text-3xl md:text-4xl leading-none">
                  {brand.name}
                </h3>
                <span className="text-xs uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                  {brand.count} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/marcas"
          className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
        >
          Ver todas las marcas
          <span className="ml-2">→</span>
        </Link>
      </div>
    </section>
  )
}
