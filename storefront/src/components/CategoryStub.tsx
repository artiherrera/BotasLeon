import { Header } from "./Header"
import { Footer } from "./Footer"
import { ProductCard } from "./ProductCard"
import { EmptyProductsState } from "./EmptyState"
import { getProducts } from "@/lib/shopify"

/**
 * CategoryStub — layout para páginas de categoría (hombre, mujer, etc.)
 * mientras no tengamos colecciones automatizadas + filtros (Sprint C).
 *
 * Por ahora muestra TODOS los productos del catálogo bajo un heading
 * de categoría + un disclaimer "filtros próximamente". Cuando llegue
 * Sprint C, reemplazamos este componente por el real que consulta
 * la colección específica.
 */

type Props = {
  eyebrow: string
  title: string
  description: string
}

export async function CategoryStub({ eyebrow, title, description }: Props) {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  try {
    products = await getProducts({ first: 24, sortKey: "BEST_SELLING" })
  } catch {
    // silent fail — mostramos empty state
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-10">
            <p className="eyebrow text-leather mb-2">{eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              {title}
            </h1>
            <p className="text-text-muted max-w-xl">{description}</p>
          </div>

          <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
            <p className="text-sm text-text-muted">
              {products.length > 0
                ? `${products.length} producto${products.length === 1 ? "" : "s"}`
                : ""}
            </p>
            <p className="text-xs text-text-subtle uppercase tracking-wider">
              Filtros próximamente
            </p>
          </div>

          {products.length === 0 ? (
            <EmptyProductsState
              title="Catálogo en construcción"
              description="Estamos cargando las primeras botas de los talleres de León."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
