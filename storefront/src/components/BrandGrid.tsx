import Link from "next/link"
import Image from "next/image"
import { getBrands } from "@/lib/shopify"

/**
 * BrandGrid — sección "Nuestras marcas" en el home.
 *
 * Server component. Trae las marcas desde Shopify Metaobject `brand`.
 * Si admin no ha creado ninguna, muestra placeholders (Marca 01-06)
 * con aviso suave indicando que pueden gestionarse desde Shopify.
 *
 * Cada card: logo (si existe) + nombre. Click → /marcas/[handle].
 * Marcas ordenadas por sort_order. Solo se muestran las is_active=true.
 */

type PlaceholderBrand = {
  handle: string
  name: string
  tagline: string
  bgClass: string
  textClass: string
}

const PLACEHOLDER_BRANDS: PlaceholderBrand[] = [
  { handle: "placeholder-1", name: "Marca 01", tagline: "Vaqueras premium", bgClass: "bg-leather", textClass: "text-bg" },
  { handle: "placeholder-2", name: "Marca 02", tagline: "Botas de trabajo", bgClass: "bg-bg-alt", textClass: "text-leather" },
  { handle: "placeholder-3", name: "Marca 03", tagline: "Botines urbanos", bgClass: "bg-terracotta", textClass: "text-bg" },
  { handle: "placeholder-4", name: "Marca 04", tagline: "Cuero exótico", bgClass: "bg-leather-light", textClass: "text-bg" },
  { handle: "placeholder-5", name: "Marca 05", tagline: "Tradición artesanal", bgClass: "bg-cognac", textClass: "text-text" },
  { handle: "placeholder-6", name: "Marca 06", tagline: "Estilo casual", bgClass: "bg-text", textClass: "text-bg" },
]

export async function BrandGrid() {
  const brands = await getBrands()
  const usingPlaceholders = brands.length === 0

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
        {usingPlaceholders
          ? PLACEHOLDER_BRANDS.map((b) => (
              <PlaceholderCard key={b.handle} brand={b} />
            ))
          : brands.map((b) => <RealBrandCard key={b.handle} brand={b} />)}
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

      {usingPlaceholders && (
        <p className="text-xs text-text-subtle text-center mt-6 max-w-md mx-auto">
          Estas son marcas de demostración. Crea metaobjects tipo "brand" en
          Shopify para mostrar tus marcas reales con logo y orden personalizado.
        </p>
      )}
    </section>
  )
}

function PlaceholderCard({ brand: b }: { brand: PlaceholderBrand }) {
  return (
    <Link
      href="/marcas"
      className="group relative aspect-[5/4] overflow-hidden block"
    >
      <div className={`absolute inset-0 ${b.bgClass}`} />
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
        }}
      />
      <div className={`relative h-full p-8 flex flex-col justify-between ${b.textClass}`}>
        <p className="eyebrow text-current opacity-70 text-xs">{b.tagline}</p>
        <div>
          <h3 className="font-display text-3xl md:text-4xl leading-none">{b.name}</h3>
          <p className="text-xs uppercase tracking-wider mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
            Próximamente →
          </p>
        </div>
      </div>
    </Link>
  )
}

function RealBrandCard({ brand: b }: { brand: Awaited<ReturnType<typeof getBrands>>[number] }) {
  return (
    <Link
      href={`/marcas/${b.handle}`}
      className="group relative aspect-[5/4] overflow-hidden block bg-bg-alt border border-border hover:border-leather transition-colors"
    >
      {b.logo ? (
        <div className="absolute inset-0 p-8 flex items-center justify-center">
          <div className="relative w-full h-full transition-transform group-hover:scale-105">
            <Image
              src={b.logo.url}
              alt={b.logo.altText || b.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-leather">
          <h3 className="font-display text-3xl md:text-4xl text-bg">{b.name}</h3>
        </div>
      )}

      {/* Hover overlay con tagline */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-bg text-sm font-medium">{b.name}</p>
        {b.tagline && (
          <p className="text-bg/80 text-xs mt-1">{b.tagline}</p>
        )}
      </div>
    </Link>
  )
}
