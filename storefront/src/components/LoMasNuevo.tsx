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
  pareja = null,
}: {
  products: Product[]
  /** Llave del diccionario con el título de la sección. */
  titulo?: string
  /** A dónde lleva "Ver todo". */
  href?: string
  /** Eyebrow sobre el título. Solo lo lleva la primera de las dos secciones:
      repetido, "CATÁLOGO" deja de informar y se vuelve ruido. */
  eyebrow?: string | null
  /** Las dos filas (hombre, mujer) son UN bloque, y se pegan: la de arriba
      recorta su relleno de abajo a la mitad y la de abajo no lleva relleno
      arriba. Sin esto quedaban 192px entre la última bota de hombre y el
      título de mujer —el mismo hueco que entre secciones distintas— y el
      dueño lo vio como "demasiado espacio". Medido tras el cambio: 48px en
      escritorio, 32 en móvil. */
  pareja?: "arriba" | "abajo" | null
}) {
  // Sin productos no se pinta la sección: un encabezado con la fila vacía se
  // lee como una tienda rota, no como una tienda nueva.
  if (products.length === 0) return null

  const pegado =
    pareja === "arriba" ? " pb-8 md:pb-12" : pareja === "abajo" ? " pt-0 md:pt-0" : ""

  return (
    <section className={`contenedor seccion${pegado}`}>
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

      {/* SIN `singleImage`. Lo llevaba, y por eso en la portada el ratón encima
          de una tarjeta no cambiaba a la segunda foto mientras que en el
          catálogo y en Hombre sí: sin carrusel no hay a qué saltar.

          Esa bandera existe para las tarjetas que van dentro de ProductRail,
          donde dos deslizadores horizontales anidados se disputan el gesto en
          móvil y gana el de adentro, dejando el riel atascado. Aquí abajo no
          hay riel: esto es una rejilla de dos columnas en móvil y cuatro en
          escritorio, así que no hay gesto que disputar. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} empezarEnSegunda />
        ))}
      </div>
    </section>
  )
}
