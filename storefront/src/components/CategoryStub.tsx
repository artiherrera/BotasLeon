import Link from "next/link"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { ProductsListing } from "./ProductsListing"
import { getCollectionByHandle } from "@/lib/shopify"

/**
 * CategoryStub — página de categoría.
 *
 * SIEMPRE consulta Shopify Collection por handle. Si la colección no
 * existe, muestra empty state con instrucciones EN LUGAR de fallback
 * a "todos los productos" — esa estrategia mostraba productos de mujer
 * en /hombre y viceversa, lo cual confunde al cliente y luce amateur.
 *
 * Mientras el admin no cree la colección, la página queda intencionalmente
 * vacía. Es preferible "vacío con explicación" que "wrong data".
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
  const products = collection?.products ?? []

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

          {!collection ? (
            <CollectionMissingState
              handle={collectionHandle}
              rule={collectionRuleHint}
            />
          ) : products.length === 0 ? (
            <CollectionEmptyState />
          ) : (
            <ProductsListing products={products} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function CollectionMissingState({ handle, rule }: { handle: string; rule: string }) {
  return (
    <div className="border border-amber-300 bg-amber-50 p-8 max-w-2xl">
      <p className="eyebrow text-amber-900 mb-2">Configuración pendiente</p>
      <h2 className="font-heading text-2xl text-text mb-3">
        Sección en construcción
      </h2>
      <p className="text-text-muted mb-5">
        Aún estamos cargando productos en esta categoría.
      </p>
      <details className="text-sm text-amber-900/90">
        <summary className="cursor-pointer font-medium">
          Detalles técnicos para el admin
        </summary>
        <div className="mt-3 space-y-2">
          <p>
            Para que esta página muestre productos, crea una colección en
            Shopify admin → Productos → Colecciones:
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

function CollectionEmptyState() {
  return (
    <div className="border border-border bg-bg-alt p-10 text-center">
      <p className="font-heading text-xl text-text mb-2">Aún sin productos</p>
      <p className="text-text-muted mb-6">
        Ningún producto cumple los criterios de esta categoría. Vuelve pronto.
      </p>
      <Link
        href="/products"
        className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
      >
        Ver catálogo completo
      </Link>
    </div>
  )
}
