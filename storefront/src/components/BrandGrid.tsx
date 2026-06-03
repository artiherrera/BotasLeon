import Link from "next/link"
import Image from "next/image"
import { getBrands } from "@/lib/shopify"

/**
 * BrandGrid — sección "Nuestras marcas" en el home.
 *
 * Server component. Si no hay marcas reales en Shopify Metaobject `brand`,
 * la sección se omite del home (mejor cero que demo "Próximamente",
 * que lee como sitio vacío). Cuando hay 1-3 marcas mostramos un layout
 * compacto centrado; con 4+ usamos la cuadrícula completa.
 */

export async function BrandGrid() {
  const brands = await getBrands()

  if (brands.length === 0) return null

  const isCurated = brands.length < 4

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

      <div
        className={
          isCurated
            ? "flex flex-wrap justify-center gap-4 md:gap-6 max-w-2xl mx-auto"
            : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3"
        }
      >
        {brands.map((b) => (
          <RealBrandCard key={b.handle} brand={b} curated={isCurated} />
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href={isCurated ? "/proveedores" : "/marcas"}
          className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
        >
          {isCurated
            ? "¿Eres taller en León? Trabaja con nosotros"
            : "Ver todas las marcas"}
          <span className="ml-2">→</span>
        </Link>
      </div>
    </section>
  )
}

function RealBrandCard({
  brand: b,
  curated,
}: {
  brand: Awaited<ReturnType<typeof getBrands>>[number]
  curated: boolean
}) {
  return (
    <Link
      href={`/marcas/${b.handle}`}
      aria-label={b.name}
      className={`group relative overflow-hidden block bg-bg-alt ${
        curated
          ? "aspect-square w-32 sm:w-40 md:w-48"
          : "aspect-square"
      }`}
    >
      {b.logo ? (
        <div className="absolute inset-0">
          <Image
            src={b.logo.url}
            alt={b.logo.altText || b.name}
            fill
            sizes={
              curated
                ? "(max-width: 640px) 33vw, 192px"
                : "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 12.5vw"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-leather p-3">
          <h3 className="font-display text-lg md:text-xl text-bg text-center leading-tight">
            {b.name}
          </h3>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-bg text-xs font-medium text-center truncate">{b.name}</p>
      </div>
    </Link>
  )
}
