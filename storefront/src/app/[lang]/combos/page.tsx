import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { CategoryHeader } from "@/components/CategoryHeader"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { T } from "@/components/T"
import { getProducts } from "@/lib/shopify"
import { enPromoPar } from "@/lib/promocion"
import { pageMetadata } from "@/lib/seo"

/**
 * /combos — las botas que se llevan de dos en dos.
 *
 * Hoy es una sola promoción —el segundo botín El Elegante a mitad de precio,
 * un descuento automático de Shopify— pero la página no la nombra: lista lo
 * que traiga la etiqueta `promo-2do-50` (ver lib/promocion.ts). Así el dueño
 * mete y saca modelos desde el panel, y el día que la promoción cambie de
 * producto la página sigue siendo verdad sin tocar el código.
 *
 * POR QUÉ EXISTE Y NO BASTA CON LA INSIGNIA: el descuento se arma COMBINANDO
 * —dos botines distintos también cuentan, comprobado contra la Storefront
 * API—, y eso no se puede contar en una ficha sola. Aquí se ven juntos los que
 * combinan, que es lo que hace entender la oferta.
 *
 * SIN FILTROS NI BARRA LATERAL: son tres modelos. Un sidebar de filtros sobre
 * tres tarjetas es más cromo que contenido.
 *
 * Si la promoción termina —se quita la etiqueta en Shopify— la página se queda
 * en pie y lo dice, en vez de dar 404 a quien la tenga guardada o la encuentre
 * en Google.
 */
export const revalidate = 60

export default async function CombosPage() {
  const res = await getProducts({ first: 250, sortKey: "BEST_SELLING" }).catch(() => null)
  const productos = (res?.products ?? []).filter(enPromoPar)

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          <CategoryHeader
            eyebrow="combos.eyebrow"
            title="combos.titulo"
            description="combos.desc"
          />

          {productos.length === 0 ? (
            <div className="max-w-2xl border border-border bg-bg-alt p-10">
              <p className="cuerpo-l text-text-muted">
                <T k="combos.vacio" />
              </p>
              <Link href="/products" className="btn mt-6">
                <T k="combos.vacioCta" />
              </Link>
            </div>
          ) : (
            <>
              {/* CÓMO FUNCIONA, antes de las botas. Un descuento que se aplica
                  solo en el carrito necesita explicarse antes, o el cliente
                  duda de si tiene que hacer algo (un código, un botón) y se
                  va a preguntar por WhatsApp. */}
              <ol className="mb-10 grid gap-4 md:grid-cols-3">
                {["combos.paso1", "combos.paso2", "combos.paso3"].map((k, i) => (
                  <li key={k} className="border border-border bg-bg-alt p-5">
                    <span className="eyebrow text-xs text-text-muted">{i + 1}</span>
                    <p className="cuerpo mt-2 text-text">
                      <T k={k} />
                    </p>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                {productos.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <p className="nota mt-8 max-w-[52ch]">
                <T k="combos.letraChica" />
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const es = lang !== "en"
  return pageMetadata({
    locale: lang,
    path: "/combos",
    title: es ? "Combos" : "Bundles",
    description: es
      ? "Llévate dos y el segundo sale a mitad de precio. Combina modelos y colores."
      : "Take two and the second one is half price. Mix models and colors.",
  })
}
