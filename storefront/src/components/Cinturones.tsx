import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { ProductCard } from "./ProductCard"
import { ProductRail } from "./ProductRail"
import { T } from "@/components/T"
import { getAccessories } from "@/lib/shopify"
import type { Product } from "@/lib/shopify/types"

/**
 * Cinturones — los cintos como TARJETAS, después de las exóticas.
 *
 * Pedido del dueño (2026-09-17): "necesito que se vean los cintos, no solo
 * uno, sino también como tarjetas". Hasta hoy los cintos salían en un banner
 * con UNA foto (BannerCintos) al final de la portada; ese banner nació cuando
 * en Shopify había dos cintos y una fila de tarjetas se veía vacía. Hoy hay
 * cinco, medidos en los dos mercados, y con cinco una fila sí se sostiene.
 * El banner sale de la portada: los cintos ya no se enseñan dos veces.
 *
 * RIEL Y NO REJILLA. Son cinco: en una rejilla de cuatro por fila el quinto
 * queda solo abajo, y en una de cinco las tarjetas se encogen a 250px y ya no
 * casan con las filas de arriba. El riel enseña cuatro y deja asomar el
 * quinto —que es la señal de que hay más— con flechas en escritorio y
 * arrastre en móvil. Y crece solo si mañana hay ocho cintos.
 *
 * `singleImage` en las tarjetas es obligatorio dentro del riel: dos
 * deslizadores horizontales anidados se pelean el dedo en móvil (ver
 * ProductRail).
 *
 * Mismo encabezado que las filas de novedades y de exóticas —eyebrow,
 * título, "Ver todo" a la derecha, una regla— para que la portada se lea como
 * una sola pieza. La leyenda es la que ya tenía el banner; el eyebrow es
 * "Accesorios" y no el "Va bien con" del banner, que encima de un título a
 * secas ("Va bien con / Cinturones") no se leía.
 *
 * Server component: un fetch en build. Sin cintos publicados, la sección no
 * existe.
 */
const CINTURONES = "Cinturones"

export async function Cinturones() {
  const cintos = await getAccessories(CINTURONES).catch(() => [] as Product[])
  if (cintos.length === 0) return null

  return (
    <section className="contenedor seccion">
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          <p className="eyebrow text-text-muted mb-2">
            <T k="cinturones.eyebrow" />
          </p>
          <h2 className="display-m">
            <T k="cinturones.titulo" />
          </h2>
          <p className="cuerpo mt-3 max-w-[52ch] text-text-muted">
            <T k="cintos.desc" />
          </p>
        </div>
        <Link
          href="/accesorios/cinturones"
          className="cuerpo -my-3 shrink-0 py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          <T k="nav.seeAll" />
          <span className="ml-1.5" aria-hidden>→</span>
        </Link>
      </div>

      <ProductRail label={CINTURONES}>
        {cintos.map((p) => (
          <ProductCard key={p.id} product={p} singleImage />
        ))}
      </ProductRail>
    </section>
  )
}
