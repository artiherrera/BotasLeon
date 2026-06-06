import Link from "next/link"
import Image from "next/image"
import { getAccessories } from "@/lib/shopify"
import {
  ACCESSORY_PRODUCT_TYPES,
  ACCESSORY_TYPE_TO_SLUG,
  type AccessoryProductType,
} from "@/lib/shopify/taxonomy"
import type { Product } from "@/lib/shopify/types"

/**
 * AccessoriesShowcase — sección home compacta para anunciar accesorios.
 *
 * Layout: row horizontal editorial. Mobile = scroll-snap horizontal,
 * desktop = grid 4 columnas. Cada "tile" es una categoría (Cinturones,
 * Sombreros, Carteras, Cuidado del cuero) con imagen de un producto
 * destacado de esa categoría.
 *
 * Diseño intencional: NO competir visualmente con CategoryShowcase y
 * LatestByGenderTabs que ya dominan el home con grids grandes. Aquí solo
 * "y también tenemos esto" en banda compacta (~250-300px alto).
 *
 * Server component — fetch único al build, sin runtime cost. Si no hay
 * accesorios en ninguna categoría, el componente retorna null para no
 * dejar una sección vacía en home.
 */

export async function AccessoriesShowcase() {
  const products = await getAccessories().catch(() => [] as Product[])

  // Agrupar primer producto por categoría. Solo mostramos categorías con
  // al menos un producto — categoría vacía = "Próximamente" en banner
  // mata trust en home. Si NINGUNA tiene producto, ocultamos toda la
  // sección (return null abajo).
  const tiles = ACCESSORY_PRODUCT_TYPES.map((type) => {
    const product = products.find((p) => p.productType === type)
    return product ? { type, product } : null
  }).filter((t): t is { type: AccessoryProductType; product: Product } => t !== null)

  if (tiles.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <p className="eyebrow text-leather mb-2">Accesorios</p>
          <h2 className="font-display text-2xl md:text-3xl text-text leading-tight">
            Para complementar tu vestir
          </h2>
        </div>
        <Link
          href="/accesorios"
          className="hidden sm:inline-flex items-center text-sm font-medium text-leather hover:text-terracotta transition-colors whitespace-nowrap"
        >
          Ver todos →
        </Link>
      </div>

      {/* Mobile: scroll-snap horizontal. Desktop: grid 4 cols.
          touch-pan-x evita conflicto con scroll vertical de la página. */}
      <ul
        className="
          flex md:grid md:grid-cols-4 gap-3 md:gap-4
          overflow-x-auto md:overflow-visible
          snap-x snap-mandatory md:snap-none
          -mx-6 md:mx-0 px-6 md:px-0
          touch-pan-x scrollbar-none
          list-none p-0 m-0 md:m-0
        "
        role="list"
      >
        {tiles.map(({ type, product }) => {
          const slug = ACCESSORY_TYPE_TO_SLUG[type]
          const img = product.featuredImage
          return (
            <li
              key={type}
              className="snap-start flex-shrink-0 w-[70%] sm:w-[40%] md:w-auto"
            >
              <Link
                href={`/accesorios/${slug}`}
                className="group block relative overflow-hidden bg-bg-alt aspect-[3/4] md:aspect-[4/5]"
              >
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.altText ?? type}
                    fill
                    sizes="(min-width: 768px) 22vw, 70vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-leather/30 to-leather/10" />
                )}

                {/* Overlay gradient para legibilidad del label */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <h3 className="font-display text-bg text-lg md:text-xl leading-tight">
                    {type}
                  </h3>
                  <span className="inline-flex items-center text-bg/85 text-xs md:text-sm mt-1 group-hover:text-bg transition-colors">
                    Ver
                    <span className="ml-1.5 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* CTA "Ver todos" mobile — debajo del scroll porque el del header
          está oculto en sm:hidden. */}
      <div className="mt-5 sm:hidden text-center">
        <Link
          href="/accesorios"
          className="inline-flex items-center text-sm font-medium text-leather"
        >
          Ver todos los accesorios →
        </Link>
      </div>
    </section>
  )
}
