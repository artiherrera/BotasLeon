import Link from "next/link"
import Image from "next/image"
import { getBrands } from "@/lib/shopify"

type Brand = Awaited<ReturnType<typeof getBrands>>[number]

/**
 * BrandGrid — sección "Marcas que comercializamos" en el home.
 *
 * Cintillo (marquee) horizontal de desplazamiento LENTO con TODAS las marcas
 * dadas de alta en Shopify. Cada logo enlaza a /marcas/[handle] (las botas de
 * esa marca). CSS-only, mismo patrón que MarqueeBar: items duplicados 2× y la
 * animación va a -50% para loop perfecto; pausa al hover (para poder hacer
 * clic) y respeta prefers-reduced-motion (ahí queda scrollable a mano).
 *
 * Se omite si no hay marcas (mejor cero que una sección vacía).
 */

// Rellenamos cada "mitad" hasta >= MIN para que el cintillo llene pantallas
// anchas sin dejar hueco en el punto de loop: como la animación va a -50%,
// cada mitad debe ser al menos tan ancha como el viewport.
const MIN_PER_HALF = 12

export async function BrandGrid() {
  const brands = await getBrands()
  if (brands.length === 0) return null

  // Una mitad = las marcas reales repetidas hasta MIN; el track son 2 mitades.
  const half: Brand[] = []
  while (half.length < MIN_PER_HALF) half.push(...brands)
  const track = [...half, ...half]

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center mb-12">
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

      {/* Cintillo full-bleed con desvanecido en los bordes */}
      <div className="brand-marquee-wrap relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 md:w-32 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 md:w-32 bg-gradient-to-l from-bg to-transparent" />
        <div className="brand-marquee flex w-max items-center gap-4 md:gap-6">
          {track.map((b, idx) => (
            <BrandLogo key={idx} brand={b} decorative={idx >= brands.length} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 text-center mt-12">
        <Link
          href="/marcas"
          className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
        >
          Ver todas las marcas
          <span className="ml-2" aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

/**
 * Un logo del cintillo. `decorative` marca las copias visuales (relleno + la
 * 2ª mitad): siguen siendo clickeables con mouse pero se ocultan a lectores
 * de pantalla y al teclado, para que solo las marcas reales estén una vez.
 */
function BrandLogo({ brand: b, decorative }: { brand: Brand; decorative: boolean }) {
  return (
    <Link
      href={`/marcas/${b.handle}`}
      aria-label={decorative ? undefined : `Ver botas de ${b.name}`}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className="group relative block aspect-square w-28 shrink-0 overflow-hidden rounded-sm bg-bg-alt md:w-36"
    >
      {b.logo ? (
        <Image
          src={b.logo.url}
          alt={decorative ? "" : b.logo.altText || b.name}
          fill
          sizes="144px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-leather p-3">
          <span className="font-display text-base md:text-lg text-bg text-center leading-tight">
            {b.name}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-center text-xs font-medium text-bg">{b.name}</p>
      </div>
    </Link>
  )
}
