import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Hero } from "@/components/Hero"
import { ProductCard } from "@/components/ProductCard"
import { EmptyProductsState } from "@/components/EmptyState"
import { getProducts } from "@/lib/shopify"

/**
 * Home page (server component, Next.js 16).
 *
 * Estructura:
 *   1. Header sticky
 *   2. Hero (imagen + copy western)
 *   3. Grid de segmentos (Hombre / Mujer / Niño)
 *   4. Productos featured o EmptyState elegante
 *   5. Sección storytelling "Hecho en León"
 *   6. Email signup
 *   7. Footer
 *
 * Nota Next.js 16: fetch() ya NO se cachea por default. Si en Sprint 2
 * queremos cacheo agresivo, agregamos `'use cache'` + `cacheLife('hours')`
 * a getProducts(). Por ahora, fetch fresh en cada request (OK en dev).
 */
export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let fetchError: string | null = null
  try {
    products = await getProducts({ first: 8 })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        {/* Segmentos destacados */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-heading text-3xl md:text-4xl text-text mb-10 text-center">
            Encuentra tu estilo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CategoryCard
              href="/hombre"
              title="Hombre"
              eyebrow="Vaqueras · Industriales · Casuales"
              bg="bg-leather"
            />
            <CategoryCard
              href="/mujer"
              title="Mujer"
              eyebrow="Vaqueras · Botines · Altas"
              bg="bg-terracotta"
            />
            <CategoryCard
              href="/nino"
              title="Niño"
              eyebrow="Para los más pequeños"
              bg="bg-leather-light"
            />
          </div>
        </section>

        {/* Productos featured */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-leather mb-2">Catálogo</p>
              <h2 className="font-heading text-3xl md:text-4xl text-text">
                Más vendidos
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
            >
              Ver todo →
            </Link>
          </div>

          {fetchError ? (
            <div className="border border-red-300 bg-red-50 text-red-900 rounded-sm p-6">
              <p className="font-medium mb-2">Error al cargar productos de Shopify</p>
              <p className="text-sm font-mono break-all">{fetchError}</p>
            </div>
          ) : products.length === 0 ? (
            <EmptyProductsState
              title="Próximamente"
              description="Estamos cargando el catálogo. Las primeras botas estarán listas muy pronto."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Hecho en León */}
        <section className="bg-bg-alt py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="eyebrow text-leather mb-4">Origen</p>
            <h2 className="font-display text-4xl md:text-5xl text-leather mb-6 leading-tight">
              Hecho en León,<br />Guanajuato.
            </h2>
            <p className="text-text-muted text-lg leading-relaxed max-w-2xl mx-auto">
              Cada bota es fabricada a mano por artesanos de tercera generación
              en talleres familiares de León — la capital mundial del calzado.
              Trabajamos directo con proveedores aliados para llevar piezas
              únicas a tu puerta.
            </p>
          </div>
        </section>

        {/* Email signup */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="border border-border rounded-sm p-10 md:p-16 text-center bg-bg">
            <p className="eyebrow text-leather mb-3">Newsletter</p>
            <h3 className="font-heading text-2xl md:text-3xl text-text mb-3">
              Sé el primero en saber
            </h3>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Lanzamientos, ofertas exclusivas y novedades de las marcas que
              comercializamos. Sin spam.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="flex-1 px-4 py-3 border border-border rounded-sm bg-bg focus:outline-none focus:border-leather"
                aria-label="Correo electrónico"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-leather text-bg font-medium rounded-sm hover:bg-text transition-colors"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function CategoryCard({
  href,
  title,
  eyebrow,
  bg,
}: {
  href: string
  title: string
  eyebrow: string
  bg: string
}) {
  return (
    <Link
      href={href}
      className="group block relative aspect-[4/5] overflow-hidden rounded-sm bg-bg-alt"
    >
      <div className={`absolute inset-0 ${bg} opacity-90`} />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-8 text-bg">
        <p className="eyebrow text-bg/80 mb-2">{eyebrow}</p>
        <h3 className="font-display text-4xl mb-1">{title}</h3>
        <span className="inline-block mt-3 text-sm group-hover:translate-x-1 transition-transform">
          Explorar →
        </span>
      </div>
    </Link>
  )
}
