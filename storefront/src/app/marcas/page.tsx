import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getProducts } from "@/lib/shopify"

export const revalidate = 60

/**
 * /marcas — listado de marcas que comercializamos.
 *
 * Agrega productos por vendor y muestra cada marca como card.
 * Por ahora muestra solo los vendors únicos que existen en el catálogo.
 * Cuando construyamos /marcas/[handle] en Sprint C, cada card va a esa
 * página individual de marca.
 */
export default async function MarcasPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  try {
    products = await getProducts({ first: 100 })
  } catch {}

  const vendors = Array.from(
    new Set(products.map((p) => p.vendor).filter(Boolean))
  ).sort()

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

          {vendors.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">Próximamente</p>
              <p className="text-text-muted">
                Estamos finalizando acuerdos con las primeras marcas. Vuelve
                pronto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vendors.map((vendor) => {
                const count = products.filter((p) => p.vendor === vendor).length
                return (
                  <Link
                    key={vendor}
                    href="/products"
                    className="group relative aspect-[5/4] bg-leather text-bg p-6 flex flex-col justify-between hover:bg-text transition-colors"
                  >
                    <div>
                      <p className="eyebrow text-bg/70 text-xs">Marca</p>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl leading-none mb-1">
                        {vendor}
                      </h3>
                      <p className="text-xs uppercase tracking-wider text-bg/70">
                        {count} {count === 1 ? "producto" : "productos"} →
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

export const metadata = {
  title: "Marcas — BotasLeón",
  description:
    "Marcas y casas de calzado de León, Guanajuato que comercializamos en BotasLeón.",
}
