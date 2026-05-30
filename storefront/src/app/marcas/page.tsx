import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getBrands, getProducts } from "@/lib/shopify"

export const revalidate = 60

/**
 * /marcas — listado completo de marcas que comercializamos.
 *
 * Si hay metaobjects "brand" definidos, los usa con su logo, orden y
 * is_active. Si no, hace fallback al listado de vendors únicos del
 * catálogo. Cada card lleva a /marcas/[handle].
 */
export default async function MarcasPage() {
  const brands = await getBrands()

  // Para cada brand, contamos cuántos productos del catálogo tienen
  // ese vendor. Una sola query para todos los productos para no hacer
  // N+1 fetches.
  const products = brands.length > 0
    ? await getProducts({ first: 200 }).catch(() => [])
    : []

  const productCountByName = new Map<string, number>()
  for (const p of products) {
    productCountByName.set(p.vendor, (productCountByName.get(p.vendor) ?? 0) + 1)
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow text-leather mb-2">Curaduría</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              Las marcas que comercializamos
            </h1>
            <p className="text-text-muted">
              Trabajamos directamente con talleres y casas de León. Cada marca
              pasa nuestro filtro de calidad antes de entrar al catálogo.
            </p>
          </div>

          {brands.length === 0 ? (
            <ConfigBanner />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {brands.map((b) => {
                const count = productCountByName.get(b.name) ?? 0
                return (
                  <Link
                    key={b.handle}
                    href={`/marcas/${b.handle}`}
                    className="group relative aspect-[5/4] bg-bg-alt border border-border hover:border-leather transition-colors overflow-hidden"
                  >
                    {b.logo ? (
                      <div className="absolute inset-0 p-8 flex items-center justify-center">
                        <div className="relative w-full h-full transition-transform group-hover:scale-105">
                          <Image
                            src={b.logo.url}
                            alt={b.logo.altText || b.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-leather">
                        <h3 className="font-display text-2xl text-bg">
                          {b.name}
                        </h3>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-bg text-sm font-medium">{b.name}</p>
                      {b.tagline && (
                        <p className="text-bg/80 text-xs mt-1">{b.tagline}</p>
                      )}
                      <p className="text-bg/60 text-xs mt-1">
                        {count} {count === 1 ? "producto" : "productos"}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ConfigBanner() {
  return (
    <div className="border border-amber-300 bg-amber-50 p-8 max-w-2xl">
      <p className="eyebrow text-amber-900 mb-2">Configuración pendiente</p>
      <h2 className="font-heading text-2xl text-text mb-3">
        Aún sin marcas definidas
      </h2>
      <p className="text-text-muted mb-4">
        Para mostrar tus marcas con logo y orden controlado, crea un
        metaobject tipo <code className="bg-bg px-1.5 py-0.5 rounded text-leather">brand</code> en Shopify admin →
        Settings → Custom data → Metaobjects → Add definition.
      </p>
      <p className="text-sm text-text-muted">
        Mientras tanto, las marcas de tus productos aparecen automáticamente en
        el catálogo (ver{" "}
        <Link href="/products" className="text-leather hover:text-terracotta">
          todas las botas
        </Link>{" "}
        y usa el filtro "Marca" del sidebar).
      </p>
    </div>
  )
}

export const metadata = {
  title: "Marcas — BotasLeón",
}
