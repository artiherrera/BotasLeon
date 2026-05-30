import Link from "next/link"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { ProductCard } from "./ProductCard"
import { getCollectionByHandle } from "@/lib/shopify"

/**
 * CategoryStub — página de categoría que consulta una colección Shopify.
 *
 * Si la colección existe → muestra sus productos (con filtros básicos en
 * Sprint C).
 * Si NO existe → empty state explicando al admin qué crear en Shopify.
 *
 * Las colecciones deben ser automatizadas con regla por metacampo
 * (Sexo objetivo, Grupo de edad, etc.) para que productos nuevos
 * caigan solos sin trabajo manual.
 */

type Props = {
  eyebrow: string
  title: string
  description: string
  collectionHandle: string  // ej: "hombre", "mujer", "ninos"
  // Para el mensaje del empty state — qué regla configurar
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
          <div className="mb-10">
            <p className="eyebrow text-leather mb-2">{eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              {title}
            </h1>
            <p className="text-text-muted max-w-xl">{description}</p>
          </div>

          {!collection ? (
            // Colección no existe en Shopify
            <CollectionMissingState
              handle={collectionHandle}
              rule={collectionRuleHint}
            />
          ) : products.length === 0 ? (
            // Colección existe pero está vacía
            <div className="border border-border bg-bg-alt p-10 text-center">
              <p className="font-heading text-xl text-text mb-2">
                Aún sin productos
              </p>
              <p className="text-text-muted mb-6">
                Ningún producto cumple los criterios de esta categoría.
                Sube productos con los metacampos correctos en Shopify y aparecerán aquí.
              </p>
              <Link
                href="/products"
                className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
              >
                Ver catálogo completo
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {products.length} producto{products.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-text-subtle uppercase tracking-wider">
                  Filtros próximamente
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
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
        Colección "{handle}" aún no existe en Shopify
      </h2>
      <p className="text-text-muted mb-4">
        Para que esta página muestre productos, ve a Shopify admin →
        Productos → Colecciones → <strong>Crear colección</strong>:
      </p>
      <ul className="text-sm text-text-muted space-y-2 mb-6 pl-5 list-disc">
        <li>
          <strong>Título</strong>: el que tú quieras (no afecta)
        </li>
        <li>
          <strong>Handle</strong> (URL): debe ser exactamente{" "}
          <code className="bg-bg px-1.5 py-0.5 rounded text-leather">{handle}</code>
        </li>
        <li>
          <strong>Tipo</strong>: Automatizada (Smart / Automated)
        </li>
        <li>
          <strong>Condición</strong>: {rule}
        </li>
      </ul>
      <p className="text-sm text-text-muted">
        Después de guardar, productos que cumplan la regla aparecerán
        automáticamente aquí.
      </p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-flex px-6 py-3 border border-leather text-leather text-sm uppercase tracking-wider hover:bg-leather hover:text-bg transition-colors"
        >
          Ver catálogo completo mientras tanto
        </Link>
      </div>
    </div>
  )
}
