import Image from "next/image"
import { notFound } from "next/navigation"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { T } from "@/components/T"
import { getBrands, getProductByHandle, getProductsByVendor } from "@/lib/shopify"
import { brandTitleFontClass } from "@/lib/brand-fonts"
import { formatMoney } from "@/lib/utils"
import { MESES_MSI, mensualidadMsi } from "@/lib/msi"
import { pageMetadata } from "@/lib/seo"
import { isLocale, type Locale } from "@/lib/i18n/config"
import { CompraJosepha } from "@/components/josepha/CompraJosepha"
import { DescripcionJosepha } from "@/components/josepha/DescripcionJosepha"
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
 *
 * EL PRECIO SE PINTA AQUÍ y no con PriceMSI, que es el componente compartido:
 * ese usa la clase .precio del sistema, o sea Instrument Sans, y metía la
 * tipografía del sitio de siempre en la única página que no debe tenerla.
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
 * fuera del mismo rosa que la página, el resultado saldría más oscuro y se
 * vería un cuadrado. PLATO está calculado al revés —contenedor = fondo × 255 /
 * fondoDeLaFoto— para que la multiplicación aterrice justo en FONDO y la foto
 * no tenga borde. Comprobado en pantalla: página 245,233,234 · dentro del
 * cuadro 246,235,235.
 */
const FONDO = "#F5E9EA"
const ACENTO = "#E1C4C6"
const PLATO = "#FAF2FA"
const TINTA = "#191A19"
/** Rosa oscurecido para texto secundario: 5.1:1 sobre FONDO, pasa AA. */
const ROSA_HONDO = "#7C555A"

/* ── La escala ─────────────────────────────────────────────────────────────
 *
 * Josefin es una geométrica de trazo fino y altura de x pequeña: a los tamaños
 * que sirven para una sans normal se ve tímida, no delicada. En una página con
 * este aire, un cuerpo de 15px se lee como letra chica de contrato. Toda la
 * escala vive aquí, en un solo sitio, para poder subirla o bajarla entera.
 *
 * Cada valor es clamp(móvil, fluido, escritorio).
 */
const ESCALA = {
  /** El nombre de la casa: la primera impresión de la página. */
  titulo: "clamp(4.5rem, 21vw, 15rem)",
  /** La frase de entrada. Es la tesis, no un pie de foto. */
  entrada: "clamp(1.375rem, 3.4vw, 2rem)",
  /** El nombre de cada botín. */
  producto: "clamp(3rem, 8vw, 5.25rem)",
  /** El precio. Con tres pares al mismo precio, la cifra es argumento. */
  precio: "clamp(2rem, 4.6vw, 2.75rem)",
  /** La frase de cierre. */
  cierre: "clamp(1.875rem, 5vw, 3.25rem)",
  /** Rótulos en minúsculas muy espaciadas. */
  rotulo: "clamp(0.8125rem, 1.5vw, 0.9375rem)",
  /** Texto de apoyo: mensualidad, tallas, enlaces. */
  apoyo: "clamp(1rem, 1.8vw, 1.125rem)",
} as const

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

export default async function JosephaPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [listado, marcas] = await Promise.all([
    getProductsByVendor(TALLER, 24).catch(() => [] as Product[]),
    getBrands().catch(() => []),
  ])
  // El listado sale del fragmento de TARJETA, que no trae descripción. Con
  // tres productos sale más barato pedir cada uno completo que engordar el
  // fragmento que usan todas las listas del sitio.
  const productos = (
    await Promise.all(listado.map((p) => getProductByHandle(p.handle).catch(() => p)))
  ).filter((p): p is Product => !!p)
  const marca = marcas.find((b) => b.handle === "josepha") ?? null

  // Sin productos no hay página: mejor 404 que una landing vacía con el
  // nombre de una casa que sí existe.
  if (productos.length === 0) notFound()

  const fuente = brandTitleFontClass(marca?.titleFont ?? "josefin")

  return (
    <div
      style={{ backgroundColor: FONDO, color: TINTA }}
      className={`${fuente} min-h-screen`}
    >
      {/* Cabecera propia. No es el Header del sitio: aquí no hay mega menú ni
          buscador, solo la puerta de vuelta — quien entra por un anuncio tiene
          que poder salir al catálogo.
          El logo del metaobjeto se retiró: es un cuadrado de 400×400 con fondo
          rosa propio, así que a 36px quedaba un recuadro con letra ilegible, y
          sobra cuando el nombre está escrito enorme dos dedos más abajo. Si
          algún día el taller sube uno apaisado y transparente, va aquí. */}
      <header className="px-6 py-6 md:px-12 md:py-8">
        <Link
          href="/"
          className="inline-block lowercase tracking-[0.34em] transition-opacity duration-300 hover:opacity-60"
          style={{ color: ROSA_HONDO, fontSize: ESCALA.rotulo }}
        >
          <T k="josepha.back" />
        </Link>
      </header>

      {/* ── Portada ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-12 text-center md:px-12 md:pb-40 md:pt-24">
        <p
          className="mb-10 lowercase tracking-[0.44em] md:mb-16"
          style={{ color: ROSA_HONDO, fontSize: ESCALA.rotulo }}
        >
          <T k="josepha.eyebrow" />
        </p>
        {/* La clase de la fuente va EN el h1, no solo en el contenedor: la
            regla `h1,h2,h3,h4` de globals.css apunta al elemento, y una regla
            que apunta al elemento le gana a la fuente heredada del padre. Sin
            esto, el nombre de la casa salía en la serif del sitio — justo la
            tipografía que esta página no debe tener. */}
        <h1
          className={`${fuente} lowercase leading-[0.85]`}
          style={{ fontSize: ESCALA.titulo, letterSpacing: "0.01em" }}
        >
          josepha
        </h1>
        <p
          className="mx-auto mt-12 max-w-[26ch] leading-[1.45] md:mt-20"
          style={{ color: ROSA_HONDO, fontSize: ESCALA.entrada }}
        >
          <T k="josepha.lead" />
        </p>
      </section>

      {/* ── Un botín por pantalla ───────────────────────────────────────── */}
      {productos.map((p, i) => {
        const foto = p.featuredImage ?? p.images?.[0] ?? null
        const moneda = p.priceRange.minVariantPrice.currencyCode
        const porMes = mensualidadMsi(p.priceRange.minVariantPrice.amount, moneda)
        const alDerecho = i % 2 === 0
        return (
          <section key={p.id} className="px-6 pb-28 md:px-12 md:pb-48">
            {/* Alternar el lado da ritmo sin más adorno: en una página de tres
                piezas, la repetición exacta se siente pobre. */}
            <div
              className={`mx-auto flex max-w-6xl flex-col items-center gap-10 md:gap-20 ${
                alDerecho ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <Link
                href={`/products/${p.handle}`}
                className="block w-full md:w-[56%]"
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
                      sizes="(min-width: 768px) 56vw, 100vw"
                      priority={i === 0}
                      className="object-contain mix-blend-multiply transition-transform duration-700 ease-out hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
                    />
                  )}
                </div>
              </Link>

              <div
                className={`w-full text-center md:w-[44%] ${
                  alDerecho ? "md:text-left" : "md:text-right"
                }`}
              >
                {/* "La Estephania" pierde el artículo: aquí los nombres son de
                    pila y así se leen como una firma. */}
                <h2
                  className={`${fuente} lowercase leading-[0.95]`}
                  style={{ fontSize: ESCALA.producto, letterSpacing: "0.005em" }}
                >
                  {p.title.replace(/^la\s+/i, "")}
                </h2>

                <p
                  className="mt-8 leading-none"
                  style={{ fontSize: ESCALA.precio, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatMoney(p.priceRange.minVariantPrice.amount, moneda)}
                </p>

                {/* Los meses sin intereses solo existen en México, y lo decide
                    mensualidadMsi por MERCADO y por moneda, nunca por idioma:
                    botasleon.com también se lee en español y ahí se cobra en
                    dólares. */}
                {porMes !== null && (
                  <p
                    className="mt-3 leading-snug"
                    style={{ color: ROSA_HONDO, fontSize: ESCALA.apoyo }}
                  >
                    {MESES_MSI} <T k="msi.of" /> {formatMoney(porMes, moneda, 2)}
                  </p>
                )}

                {/* Aquí iba "Tallas 24–27" y se quitó: la rejilla de abajo
                    ya enseña las cuatro, una por una y en el orden correcto.
                    Decir el rango encima era repetir con menos información. */}

                <DescripcionJosepha
                  handle={p.handle}
                  textoPlano={p.description ?? ""}
                  color={ROSA_HONDO}
                  tam={ESCALA.apoyo}
                  alineacion={alDerecho ? "izquierda" : "derecha"}
                />

                {/* Se compra AQUÍ: elegir talla y agregar sin salir de la
                    página. El cajón del carrito se abre solo y hace de
                    confirmación. */}
                {p.availableForSale ? (
                  <CompraJosepha
                    product={p}
                    acento={ACENTO}
                    tinta={TINTA}
                    rosaHondo={ROSA_HONDO}
                    tamRotulo={ESCALA.rotulo}
                    tamApoyo={ESCALA.apoyo}
                  />
                ) : (
                  <p
                    className="mt-10 lowercase tracking-[0.26em]"
                    style={{ color: ROSA_HONDO, fontSize: ESCALA.apoyo }}
                  >
                    <T k="josepha.soldOut" />
                  </p>
                )}

                {/* La ficha sigue existiendo y ahí vive el resto: la galería
                    completa, las medidas, la guía de tallas y las reseñas. */}
                <p className="mt-8">
                  <Link
                    href={`/products/${p.handle}`}
                    className="inline-block border-b pb-1 lowercase tracking-[0.24em] transition-opacity duration-300 hover:opacity-60"
                    style={{ borderColor: ACENTO, color: ROSA_HONDO, fontSize: ESCALA.rotulo }}
                  >
                    <T k="josepha.see" />
                  </Link>
                </p>
              </div>
            </div>
          </section>
        )
      })}

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28 pt-4 text-center md:px-12 md:pb-40">
        <p
          className="mx-auto max-w-[22ch] lowercase leading-[1.1]"
          style={{ fontSize: ESCALA.cierre }}
        >
          <T k="josepha.closing" />
        </p>
        <div className="mx-auto mt-20 h-px w-24" style={{ backgroundColor: ACENTO }} />
        <p
          className="mx-auto mt-14 max-w-[30ch] leading-[1.5]"
          style={{ color: ROSA_HONDO, fontSize: ESCALA.apoyo }}
        >
          <T k="josepha.oneOf" />
        </p>
        <p className="mt-10">
          <Link
            href="/marcas"
            className="inline-block border-b-2 pb-2 lowercase tracking-[0.26em] transition-opacity duration-300 hover:opacity-60"
            style={{ borderColor: ACENTO, color: TINTA, fontSize: ESCALA.apoyo }}
          >
            <T k="josepha.allBrands" />
          </Link>
        </p>
      </section>
    </div>
  )
}
