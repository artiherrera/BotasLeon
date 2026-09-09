import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { ProductCard } from "./ProductCard"
import { T } from "@/components/T"
import type { Product } from "@/lib/shopify/types"

/**
 * LoMasNuevo — una fila con las cuatro botas más recientes de un género.
 *
 * Antes eran dos PESTAÑAS (Hombre / Mujer) en serif y mayúsculas subrayadas,
 * y de las dos solo se veía una: la otra costaba un clic que casi nadie daba.
 * Ahora son dos secciones seguidas, cada una con su encabezado y su enlace,
 * así que las dos se ven al bajar.
 *
 * Encabezado único de sección: eyebrow gris + título a la izquierda, "Ver
 * todo" en cuero a la derecha sobre la misma línea, y una regla de 1px debajo.
 * Server component: los ProductCard entran por el payload RSC.
 */
export function LoMasNuevo({
  products,
  titulo = "latest.title",
  href = "/products",
  eyebrow = null,
}: {
  products: Product[]
  /** Llave del diccionario con el título de la sección. */
  titulo?: string
  /** A dónde lleva "Ver todo". */
  href?: string
  /** Eyebrow sobre el título. Solo lo lleva la primera de las dos secciones:
      repetido, "CATÁLOGO" deja de informar y se vuelve ruido. */
  eyebrow?: string | null
}) {
  // Sin productos no se pinta la sección: un encabezado con la fila vacía se
  // lee como una tienda rota, no como una tienda nueva.
  if (products.length === 0) return null

  return (
    <section className="contenedor seccion">
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          {eyebrow && (
            <p className="eyebrow text-text-muted mb-2">
              <T k={eyebrow} />
            </p>
          )}
          <h2 className="display-m">
            <T k={titulo} />
          </h2>
        </div>
        {/* py-3 -my-3: el objetivo táctil sube a 46px (móvil pide 44) sin mover
            un pixel del texto — el padding crece y el margen negativo lo
            devuelve. Como es hijo de un flex, el padding sí cuenta para el
            layout, por eso hace falta compensarlo. */}
        <Link
          href={href}
          className="cuerpo -my-3 shrink-0 py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          <T k="nav.seeAll" />
          <span className="ml-1.5" aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} singleImage />
        ))}
      </div>
    </section>
  )
}
