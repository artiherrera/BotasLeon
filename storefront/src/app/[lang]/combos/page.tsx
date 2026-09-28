import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ArmaCombo } from "@/components/ArmaCombo"
import { T } from "@/components/T"
import { getProducts, getProductsByTag, isBoot } from "@/lib/shopify"
import { ETIQUETA_PROMO_PAR, ETIQUETA_PROMO_CINTO } from "@/lib/promocion"
import { aPieza } from "@/lib/combos"
import { pageMetadata } from "@/lib/seo"

/**
 * /combos — las promociones de la tienda, armadas y listas para el carrito.
 *
 * Lo pidió el dueño (2026-09-28) con las promociones ya vivas: las mismas que
 * salen dentro de cada ficha, pero en una página propia donde se arman las dos
 * piezas desde cero. Sirve para lo que una ficha no puede: llegar por el menú,
 * o por un anuncio, sin haber elegido bota todavía.
 *
 * QUÉ NO ES ESTA PÁGINA. No es un catálogo de "packs" inventados por el sitio.
 * Los dos combos salen de descuentos automáticos que viven en Shopify, y las
 * piezas que entran salen de las etiquetas que el dueño pone y quita desde su
 * panel. Si mañana apaga un descuento, aquí hay que quitar su bloque: el sitio
 * no debe seguir prometiendo lo que la caja ya no cumple.
 *
 * LAS BOTAS DEL PRIMER COMBO son las más vendidas, no el catálogo entero: el
 * descuento del cinto aplica con CUALQUIER bota, y poner ciento tres tarjetas
 * en un selector no ayuda a elegir. Quien quiera otra la elige en su ficha, que
 * lleva la misma tira.
 *
 * Si Shopify no devuelve productos de una promoción, su bloque no se pinta.
 * Vale más una página con un combo que una con un hueco.
 */

export const revalidate = 300

export const metadata = pageMetadata({
  title: "Combos",
  description:
    "Arma tu combo: bota y cinto a mitad de precio, o el segundo par al 50%. Elige tallas y agrégalo completo en un toque.",
  path: "/combos",
})

const CUANTAS_BOTAS = 12

export default async function CombosPage() {
  const [botinesPromo, cintos, listado] = await Promise.all([
    getProductsByTag(ETIQUETA_PROMO_PAR),
    getProductsByTag(ETIQUETA_PROMO_CINTO),
    getProducts({ first: 40, sortKey: "BEST_SELLING" })
      .then((r) => r.products)
      .catch(() => []),
  ])

  const botas = listado.filter(isBoot).slice(0, CUANTAS_BOTAS).map(aPieza)

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          <p className="eyebrow text-text-muted mb-2">
            <T k="combos.eyebrow" />
          </p>
          <h1 className="display-l">
            <T k="combos.titulo" />
          </h1>
          <p className="cuerpo mt-3 max-w-[60ch] text-text-muted">
            <T k="combos.intro" />
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ArmaCombo
              insignia="tira.cinto.insignia"
              titulo="combos.cinto.titulo"
              nota="combos.cinto.nota"
              rotuloA="combos.cinto.rotuloA"
              rotuloB="combos.cinto.rotuloB"
              piezasA={botas}
              piezasB={cintos.map(aPieza)}
            />
            <ArmaCombo
              insignia="promoPar.insignia"
              titulo="combos.par.titulo"
              nota="combos.par.nota"
              rotuloA="combos.par.rotuloA"
              rotuloB="combos.par.rotuloB"
              piezasA={botinesPromo.map(aPieza)}
              piezasB={botinesPromo.map(aPieza)}
            />
          </div>

          <p className="nota mt-8 max-w-[60ch]">
            <T k="combos.pie" />
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
