import Link from "next/link"

/**
 * CategoryShowcase — 3 cards grandes en el home que navegan a las
 * páginas de categoría. Visual: cuero / terracota / cognac. Sin foto
 * (que vendría como mejora futura), gradients de la paleta.
 *
 * Diseño: 1 col en mobile, 3 cols desktop. Aspect 4:5 para sentido
 * de "vitrina premium".
 */

const CATEGORIES = [
  {
    href: "/hombre",
    eyebrow: "Categoría",
    title: "Hombre",
    description: "Vaqueras, clásicas, trabajo de rancho.",
    bgClass: "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  },
  {
    href: "/mujer",
    eyebrow: "Categoría",
    title: "Mujer",
    description: "Vaqueras, clásicas, largas, fashion.",
    bgClass: "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  },
  {
    href: "/nino",
    eyebrow: "Categoría",
    title: "Niños",
    description: "Mini-vaqueras y clásicas para los que más crecen.",
    bgClass: "bg-gradient-to-br from-cognac via-gold to-leather-light",
  },
]

export function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow text-leather mb-2">Compra por categoría</p>
        <h2 className="font-display text-3xl md:text-4xl text-text">
          Encuentra tu par
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group relative aspect-[4/5] overflow-hidden block"
          >
            <div className={`absolute inset-0 ${cat.bgClass} transition-transform duration-700 group-hover:scale-[1.04]`} />

            {/* Texture overlay sutil */}
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35) 0%, transparent 55%),
                  radial-gradient(circle at 70% 80%, rgba(0,0,0,0.4) 0%, transparent 60%)
                `,
              }}
            />

            {/* Gradient inferior */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

            {/* Contenido */}
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="eyebrow text-bg/80 text-xs mb-3">{cat.eyebrow}</p>
              <h3 className="font-display text-4xl md:text-5xl text-bg leading-none mb-3">
                {cat.title}
              </h3>
              <p className="text-bg/85 text-sm leading-snug mb-4 max-w-xs">
                {cat.description}
              </p>
              <span className="inline-flex items-center text-bg/90 text-xs uppercase tracking-widest group-hover:text-bg transition-colors">
                Explorar
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
