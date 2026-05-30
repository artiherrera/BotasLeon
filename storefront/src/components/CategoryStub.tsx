import Link from "next/link"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { ProductsListing } from "./ProductsListing"
import { getCollectionByHandle, getProducts } from "@/lib/shopify"

/**
 * CategoryStub — página de categoría.
 *
 * Lógica:
 *  1. Si existe colección Shopify con el handle dado → muestra sus productos.
 *  2. Si NO existe → fallback a TODOS los productos del catálogo + aviso
 *     suave arriba diciendo al admin cómo configurar la colección para
 *     que filtre de verdad.
 *
 * Esto evita la frustración de "no aparece nada" cuando el catálogo
 * tiene productos pero la colección aún no está configurada en Shopify.
 */

type Props = {
  eyebrow: string
  title: string
  description: string
  collectionHandle: string
  collectionRuleHint: string
}

export async function CategoryStub({
  eyebrow,
  title,
  description,
  collectionHandle,
  collectionRuleHint,
}: Props) {
  const collection = await getCollectionByHandle(collectionHandle)
  const usingFallback = !collection
  const products = collection
    ? collection.products
    : await getProducts({ first: 48 }).catch(() => [])

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

          {usingFallback && (
            <ConfigBanner handle={collectionHandle} rule={collectionRuleHint} />
          )}

          {products.length === 0 ? (
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">
                Aún sin productos
              </p>
              <p className="text-text-muted mb-6">
                El catálogo está en construcción. Vuelve pronto.
              </p>
              <Link
                href="/products"
                className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            <ProductsListing products={products} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ConfigBanner({ handle, rule }: { handle: string; rule: string }) {
  return (
    <details className="mb-8 border border-amber-300 bg-amber-50 px-5 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-amber-900">
        Mostrando todo el catálogo · Configuración pendiente para filtrar
        esta categoría
      </summary>
      <div className="mt-3 text-amber-900/90 space-y-2">
        <p>
          Para que esta página filtre productos automáticamente, crea una
          colección en Shopify admin → Productos → Colecciones:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Handle</strong>:{" "}
            <code className="bg-white px-1.5 py-0.5 rounded text-leather">
              {handle}
            </code>
          </li>
          <li>
            <strong>Tipo</strong>: Automatizada
          </li>
          <li>
            <strong>Condición</strong>: {rule}
          </li>
        </ul>
        <p className="text-xs">
          Después de crearla, productos que cumplan la regla aparecerán aquí
          automáticamente y este aviso desaparecerá.
        </p>
      </div>
    </details>
  )
}
