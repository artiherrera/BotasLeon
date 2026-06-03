import { Suspense } from "react"
import Link from "next/link"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { ProductsListing } from "./ProductsListing"
import { getProductsByTaxonomy } from "@/lib/shopify"

/**
 * CategoryStub — página de categoría.
 *
 * Filtra productos por metafield de taxonomía Shopify (target-gender o
 * age-group) dereferenciado a handle. No requiere colecciones manuales:
 * el admin solo necesita marcar el metacampo correcto en cada producto
 * (lo que ya hace al subir un producto con categoría "Boots").
 *
 * Si no hay productos que coincidan, empty state limpio (no muestra
 * productos de otras categorías como antes).
 */

type Props = {
  eyebrow: string
  title: string
  description: string
  // Tipo de taxonomía a filtrar
  taxonomyKey: "gender" | "age"
  // Handle del metaobject Shopify (ej. "femenino", "masculino", "adultos", "ninos")
  taxonomyHandle: string
  // Hint humano de qué configurar si la página queda vacía
  configHint: string
}

export async function CategoryStub({
  eyebrow,
  title,
  description,
  taxonomyKey,
  taxonomyHandle,
  configHint,
}: Props) {
  const products = await getProductsByTaxonomy(taxonomyKey, taxonomyHandle)

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-8">
            <p className="eyebrow text-leather mb-2">{eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              {title}
            </h1>
            <p className="text-text-muted max-w-xl">{description}</p>
          </div>

          {products.length === 0 ? (
            <EmptyState configHint={configHint} />
          ) : (
            // Suspense requerido: ProductsListing usa useSearchParams,
            // y sin boundary Next falla el build estático con
            // "Missing Suspense boundary with useSearchParams".
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={products} />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function EmptyState({ configHint }: { configHint: string }) {
  return (
    <div className="border border-border bg-bg-alt p-10 max-w-2xl">
      <p className="eyebrow text-leather mb-2">Aún sin productos</p>
      <h2 className="font-heading text-2xl text-text mb-3">
        Sección en construcción
      </h2>
      <p className="text-text-muted mb-5">
        Aún no hay productos en esta categoría. Vuelve pronto.
      </p>
      <details className="text-sm text-text-muted">
        <summary className="cursor-pointer font-medium">
          Detalles técnicos para el admin
        </summary>
        <div className="mt-3">
          <p>
            Esta categoría muestra productos que tienen {configHint}.
            Si un producto debería aparecer aquí pero no lo hace, verifica
            que tenga el metacampo correcto en Shopify admin.
          </p>
        </div>
      </details>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
        >
          Ver catálogo completo
        </Link>
      </div>
    </div>
  )
}
