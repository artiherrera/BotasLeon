import Link from "next/link"
import Image from "next/image"
import { getCategoryCards } from "@/lib/shopify"
import type { CategoryCard } from "@/lib/shopify/types"

/**
 * CategoryShowcase — 3 cards grandes en el home que navegan a las
 * páginas de categoría. Visual: cuero / terracota / cognac.
 *
 * Fuente de datos: Metaobjects "category_card" en Shopify admin
 * (Settings → Custom data). Si el admin todavía no creó entries, o si
 * Shopify falla, caemos al hardcode con gradients para que el home
 * nunca quede en blanco.
 *
 * Diseño: 1 col en mobile, 3 cols desktop. Aspect 4:5 para sentido
 * de "vitrina premium".
 */

// Fallback hardcoded — se usa cuando el metaobject "category_card"
// no tiene entries activas en Shopify. Mantiene el home funcional
// mientras el admin configura las cards desde el panel.
const FALLBACK_CATEGORIES = [
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
    href: "/accesorios",
    eyebrow: "Categoría",
    title: "Accesorios",
    description: "Cinturones, sombreros, carteras y cuidado del cuero.",
    bgClass: "bg-gradient-to-br from-cognac via-gold to-leather-light",
  },
] as const

// Gradients cíclicos para cards SIN imagen (cuando una entry del
// metaobject existe pero todavía no tiene asset subido). Mismo
// ciclo que el fallback completo para mantener consistencia visual.
const CARD_FALLBACK_GRADIENTS = [
  "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  "bg-gradient-to-br from-cognac via-gold to-leather-light",
]

export async function CategoryShowcase() {
  // Si Shopify falla o no hay metaobject configurado, getCategoryCards
  // devuelve []. El componente detecta el array vacío y rendera el
  // hardcode con gradients (comportamiento original) para que el home
  // nunca se rompa.
  const cards = await getCategoryCards().catch(() => [] as CategoryCard[])

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow text-leather mb-2">Compra por categoría</p>
        <h2 className="font-display text-3xl md:text-4xl text-text">
          Encuentra tu par
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {cards.length === 0
          ? // Fallback completo — admin no ha configurado el metaobject.
            FALLBACK_CATEGORIES.map((cat) => (
              <CardFrame
                key={cat.href}
                href={cat.href}
                eyebrow={cat.eyebrow}
                title={cat.title}
                description={cat.description}
              >
                <div
                  className={`absolute inset-0 ${cat.bgClass} transition-transform duration-700 group-hover:scale-[1.04]`}
                />
              </CardFrame>
            ))
          : cards.map((card, i) => (
              <CardFrame
                key={card.handle}
                href={card.href || "#"}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
              >
                {card.image ? (
                  <Image
                    src={card.image.url}
                    alt={card.image.altText ?? card.title}
                    width={card.image.width}
                    height={card.image.height}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  // Card individual sin imagen → gradient específico
                  // (entry existe pero asset todavía no subido).
                  <div
                    className={`absolute inset-0 ${
                      CARD_FALLBACK_GRADIENTS[i % CARD_FALLBACK_GRADIENTS.length]
                    } transition-transform duration-700 group-hover:scale-[1.04]`}
                  />
                )}
              </CardFrame>
            ))}
      </div>
    </section>
  )
}

// Frame compartido entre la rama de fallback y la rama con datos —
// evita duplicar overlays/gradients/textos en dos sitios.
function CardFrame({
  href,
  eyebrow,
  title,
  description,
  children,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-[4/5] overflow-hidden block"
    >
      {children}

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

      {/* Gradient inferior para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

      {/* Contenido */}
      <div className="absolute inset-x-0 bottom-0 p-8">
        {eyebrow ? (
          <p className="eyebrow text-bg/80 text-xs mb-3">{eyebrow}</p>
        ) : null}
        <h3 className="font-display text-4xl md:text-5xl text-bg leading-none mb-3">
          {title}
        </h3>
        {description ? (
          <p className="text-bg/85 text-sm leading-snug mb-4 max-w-xs">
            {description}
          </p>
        ) : null}
        <span className="inline-flex items-center text-bg/90 text-xs uppercase tracking-widest group-hover:text-bg transition-colors">
          Explorar
          <span className="ml-2 transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  )
}
