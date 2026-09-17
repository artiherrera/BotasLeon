import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { ProductCard } from "./ProductCard"
import { T } from "@/components/T"
import type { Product } from "@/lib/shopify/types"

/**
 * BotasExoticas — ocho exóticas al azar, después de "Lo más nuevo".
 *
 * Pedido del dueño (2026-09-16): un agregado de tarjetas INDIFERENTE AL SEXO,
 * con "Botas Exóticas", una leyenda, y ocho botas exóticas al azar. Va justo
 * después de las dos filas de novedades, que sí son por género.
 *
 * EL AZAR SE TIRA EN EL SERVIDOR, no en el navegador. La portada se regenera
 * cada 60 s (revalidate en app/[lang]/page.tsx), así que cada regeneración
 * trae otras ocho: en la práctica, otras ocho por visita. Barajar en el
 * cliente obligaría a elegir entre pintar la fila vacía en el HTML (nada que
 * ver hasta que carga el JS, nada para Google) o pintar unas y cambiarlas
 * al hidratar (la fila salta delante del que la está mirando). Ninguna de
 * las dos vale lo que vale un "al azar" de verdad.
 *
 * Mismo encabezado que LoMasNuevo —eyebrow, título, "Ver todo" a la derecha
 * y una regla— para que la portada se lea como una sola pieza; lo que cambia
 * es la leyenda bajo el título, que aquí sí hace falta: "exóticas" no le dice
 * a todo el mundo qué pieles son ni por qué cuestan lo que cuestan.
 *
 * OCHO EN DOS FILAS DE CUATRO en escritorio (dos columnas en móvil, como las
 * novedades): el doble que una fila de novedades, porque aquí la gracia es la
 * variedad de pieles, y con cuatro no se ve.
 *
 * "Ver todo" lleva a /hombre/exoticas, la única página completa de exóticas
 * que existe (ver CategoryShowcase: /products?estilo= corta a 24). Hoy las 23
 * exóticas son de hombre; si aparecen de mujer, esta fila las enseña igual y
 * el enlace habrá que repensarlo.
 */
export function BotasExoticas({
  products,
  href = "/hombre/exoticas",
}: {
  /** Ya barajadas y recortadas a ocho por quien llama. */
  products: Product[]
  href?: string
}) {
  // Sin exóticas no se pinta la sección: un título con la rejilla vacía se
  // lee como una tienda rota.
  if (products.length === 0) return null

  return (
    <section className="contenedor seccion">
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          <p className="eyebrow text-text-muted mb-2">
            <T k="exoticas.eyebrow" />
          </p>
          <h2 className="display-m">
            <T k="exoticas.titulo" />
          </h2>
          <p className="cuerpo mt-3 max-w-[52ch] text-text-muted">
            <T k="exoticas.leyenda" />
          </p>
        </div>
        {/* py-3 -my-3: objetivo táctil de 46px sin mover el texto, igual que
            en LoMasNuevo. */}
        <Link
          href={href}
          className="cuerpo -my-3 shrink-0 py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          <T k="nav.seeAll" />
          <span className="ml-1.5" aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} empezarEnSegunda />
        ))}
      </div>
    </section>
  )
}
