import Image from "next/image"
import { notFound } from "next/navigation"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { T } from "@/components/T"
import { PriceMSI } from "@/components/PriceMSI"
import { getBrands, getProductsByVendor } from "@/lib/shopify"
import { extractTaxonomyValues, primerHandle } from "@/lib/shopify/facets"
import { etiquetaTallaFiltro } from "@/lib/sizes"
import { brandTitleFontClass } from "@/lib/brand-fonts"
import { pageMetadata } from "@/lib/seo"
import { isLocale, type Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/shopify/types"

/**
 * Josepha — una página que no se parece al resto del sitio, a propósito.
 *
 * Es la primera landing de colección y sigue la regla que puso el dueño: "no
 * un sistema de identidad, quiero que parezca una página completamente nueva".
 * Por eso NO monta el Header ni el Footer del sitio y no usa ni un token del
 * sistema visual v3: ni la crema, ni la tinta sobre crema, ni Instrument Serif.
 * Su tipografía es Josefin —la que la propia marca eligió en Shopify, campo
 * `title_font`— y su color es el rosa de su metaobjeto.
 *
 * Lo que SÍ conserva, porque es la misma tienda: el carrito —el minicarrito lo
 * monta el layout en todas las rutas, también en esta—, los precios por
 * mercado, y una salida clara de vuelta al catálogo.
 *
 * Son TRES botines y eso manda en la maqueta: con tres piezas no se hace una
 * cuadrícula, se hacen tres pantallas. Cada una es una sola foto grande con
 * mucho aire alrededor. La página se recorre, no se escanea.
 */

export const revalidate = 60

const TALLER = "Josepha"

/* ── El rosa ───────────────────────────────────────────────────────────────
 *
 * FONDO es el rosa de Josepha (#E1C4C6, su `accent_color` en Shopify) aclarado
 * hasta donde el texto en tinta se lee cómodo. ACENTO es su rosa tal cual.
 *
 * PLATO es el número que importa y no se puede elegir a ojo. Las doce fotos de
 * Josepha traen fondo de estudio en ~(250,246,239) y son uniformes hasta ±1 en
 * las cuatro esquinas (medido con sharp). La foto va con `mix-blend-mode:
 * multiply`, así que el color que se ve donde la foto es "blanca" resulta de
 * multiplicar el fondo del contenedor por ese casi-blanco. Si el contenedor
 * fuera del mismo rosa que la página, el resultado saldría más oscuro que la
 * página y se vería un cuadrado. PLATO está calculado al revés —
 * contenedor = fondo × 255 / fondoDeLaFoto — para que el producto de la
 * multiplicación aterrice justo en FONDO y la foto no tenga borde.
 */
const FONDO = "#F5E9EA"
const ACENTO = "#E1C4C6"
const PLATO = "#FAF2FA"
const TINTA = "#191A19"
/** Rosa oscurecido para texto secundario: 5.1:1 sobre FONDO, pasa AA. */
const ROSA_HONDO = "#7C555A"

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props) {
  const { lang } = await params
  const locale = isLocale(lang) ? (lang as Locale) : "es"
  const es = locale === "es"
  return pageMetadata({
    path: "/josepha",
    locale,
    title: es ? "Josepha · Botines para mujer" : "Josepha · Ankle boots for women",
    description: es
      ? "Tres botines para mujer hechos a mano en León, Guanajuato. Tacón de bloque, punta de bota."
      : "Three ankle boots for women, handmade in León, Guanajuato. Block heel, western toe.",
  })
}

/** La corrida de tallas de un par, en la escala del mercado. */
function tallasDe(p: Product): string[] {
  const sexo = primerHandle(p.targetGender)
  return extractTaxonomyValues(p.shoeSizes)
    .map((v) => etiquetaTallaFiltro(v.label, sexo, p.productType))
    .sort((a, b) => {
      const n = (s: string) => parseFloat((s.match(/[\d.]+/) ?? [""])[0])
      return (n(a) || 0) - (n(b) || 0)
    })
}

export default async function JosephaPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [productos, marcas] = await Promise.all([
    getProductsByVendor(TALLER, 24).catch(() => [] as Product[]),
    getBrands().catch(() => []),
  ])
  const marca = marcas.find((b) => b.handle === "josepha") ?? null

  // Sin productos no hay página: mejor 404 que una landing vacía con el
  // nombre de una casa que sí existe.
  if (productos.length === 0) notFound()

  const fuente = brandTitleFontClass(marca?.titleFont ?? "josefin")

  return (
    <div style={{ backgroundColor: FONDO, color: TINTA }} className="min-h-screen">
      {/* Cabecera propia, de 56px. No es el Header del sitio: aquí no hay mega
          menú ni buscador. Solo el nombre de la casa y la puerta de vuelta —
          quien entra por un anuncio tiene que poder salir al catálogo. */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link
          href="/"
          aria-label="Botas León"
          className={`${fuente} text-[13px] lowercase tracking-[0.32em] transition-opacity duration-300 hover:opacity-60`}
          style={{ color: ROSA_HONDO }}
        >
          <T k="josepha.back" />
        </Link>
        {/* Aquí iba el logo del metaobjeto y se retiró: es un cuadrado de
            400×400 con fondo rosa propio, así que a 36px de alto quedaba un
            recuadro con letra ilegible. Y sobra: dos dedos más abajo el nombre
            está escrito a 200px. Si algún día el taller sube un logo apaisado
            y con fondo transparente, aquí es donde va. */}
        <span aria-hidden />
      </header>

      {/* ── Portada ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-16 text-center md:px-10 md:pb-32 md:pt-28">
        <p
          className={`${fuente} mb-8 text-[11px] lowercase tracking-[0.42em] md:mb-12`}
          style={{ color: ROSA_HONDO }}
        >
          <T k="josepha.eyebrow" />
        </p>
        {/* El nombre, enorme y en minúsculas. clamp para que en un teléfono
            de 360 no se parta: es la primera impresión de la página. */}
        <h1
          className={`${fuente} lowercase leading-[0.9]`}
          style={{ fontSize: "clamp(4rem, 20vw, 14rem)", letterSpacing: "0.02em" }}
        >
          josepha
        </h1>
        <p
          className={`${fuente} mx-auto mt-10 max-w-[30ch] text-[15px] leading-relaxed md:mt-14 md:text-[17px]`}
          style={{ color: ROSA_HONDO }}
        >
          <T k="josepha.lead" />
        </p>
      </section>

      {/* ── Un botín por pantalla ───────────────────────────────────────── */}
      {productos.map((p, i) => {
        const foto = p.featuredImage ?? p.images?.[0] ?? null
        const tallas = tallasDe(p)
        return (
          <section
            key={p.id}
            className="px-6 pb-24 md:px-10 md:pb-40"
            /* Alternar el lado da ritmo sin necesidad de más adorno: en una
               página de tres piezas, la repetición exacta se siente pobre. */
          >
            <div
              className={`mx-auto flex max-w-5xl flex-col items-center gap-8 md:gap-16 ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              <Link
                href={`/products/${p.handle}`}
                className="block w-full md:w-[58%]"
                aria-label={p.title}
              >
                <div
                  className="relative aspect-square w-full overflow-hidden"
                  style={{ backgroundColor: PLATO, isolation: "isolate" }}
                >
                  {foto && (
                    <Image
                      src={foto.url}
                      alt={foto.altText || p.title}
                      fill
                      sizes="(min-width: 768px) 58vw, 100vw"
                      priority={i === 0}
                      className="object-contain mix-blend-multiply transition-transform duration-700 ease-out hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
                    />
                  )}
                </div>
              </Link>

              <div className={`w-full text-center md:w-[42%] ${i % 2 === 1 ? "md:text-right" : "md:text-left"}`}>
                <h2
                  className={`${fuente} lowercase leading-[1.05]`}
                  style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)", letterSpacing: "0.01em" }}
                >
                  {p.title.replace(/^la\s+/i, "")}
                </h2>

                <div className={`mt-6 flex ${i % 2 === 1 ? "md:justify-end" : "md:justify-start"} justify-center`}>
                  <PriceMSI
                    amount={p.priceRange.minVariantPrice.amount}
                    currency={p.priceRange.minVariantPrice.currencyCode}
                    compareAt={p.compareAtPriceRange?.minVariantPrice.amount}
                  />
                </div>

                {tallas.length > 0 && (
                  <p
                    className={`${fuente} mt-6 text-[13px] tracking-[0.14em]`}
                    style={{ color: ROSA_HONDO }}
                  >
                    <T k="josepha.sizes" /> {tallas[0]}–{tallas[tallas.length - 1]}
                  </p>
                )}

                <p className="mt-8">
                  {p.availableForSale ? (
                    <Link
                      href={`/products/${p.handle}`}
                      className={`${fuente} inline-block border-b pb-1 text-[13px] lowercase tracking-[0.28em] transition-colors duration-300`}
                      style={{ borderColor: ACENTO, color: TINTA }}
                    >
                      <T k="josepha.see" />
                    </Link>
                  ) : (
                    <span
                      className={`${fuente} text-[13px] lowercase tracking-[0.28em]`}
                      style={{ color: ROSA_HONDO }}
                    >
                      <T k="josepha.soldOut" />
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>
        )
      })}

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-4 text-center md:px-10 md:pb-32">
        <p
          className={`${fuente} mx-auto max-w-[26ch] lowercase leading-[1.25]`}
          style={{ fontSize: "clamp(1.5rem, 4.2vw, 2.5rem)" }}
        >
          <T k="josepha.closing" />
        </p>
        <div className="mx-auto mt-16 h-px w-16" style={{ backgroundColor: ACENTO }} />
        <p
          className={`${fuente} mx-auto mt-10 max-w-[34ch] text-[13px] leading-relaxed`}
          style={{ color: ROSA_HONDO }}
        >
          <T k="josepha.oneOf" />
        </p>
        <p className="mt-6">
          <Link
            href="/marcas"
            className={`${fuente} inline-block border-b pb-1 text-[12px] lowercase tracking-[0.28em]`}
            style={{ borderColor: ACENTO, color: TINTA }}
          >
            <T k="josepha.allBrands" />
          </Link>
        </p>
      </section>

      {/* El minicarrito NO se monta aquí: ya lo pone el layout en todas las
          rutas, así que ponerlo otra vez lo pintaría doble. Que la página se
          escape del Header no significa que se escape del carrito. */}
    </div>
  )
}
