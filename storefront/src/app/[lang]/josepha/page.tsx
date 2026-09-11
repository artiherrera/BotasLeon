import { notFound } from "next/navigation"
import localFont from "next/font/local"
import { T } from "@/components/T"
import { getProductByHandle, getProductsByVendor } from "@/lib/shopify"
import { formatMoney } from "@/lib/utils"
import { MESES_MSI, mensualidadMsi } from "@/lib/msi"
import { pageMetadata } from "@/lib/seo"
import { isLocale, type Locale } from "@/lib/i18n/config"
import { CompraJosepha } from "@/components/josepha/CompraJosepha"
import { GaleriaJosepha } from "@/components/josepha/GaleriaJosepha"
import { DescripcionJosepha } from "@/components/josepha/DescripcionJosepha"
import type { Product } from "@/lib/shopify/types"

/**
 * Josepha — una página que no se parece al resto del sitio, a propósito.
 *
 * Es la primera landing de colección y sigue la regla que puso el dueño: "no
 * un sistema de identidad, quiero que parezca una página completamente nueva".
 * Por eso NO monta el Header ni el Footer del sitio y no usa ni un token del
 * sistema visual v3: ni la crema, ni la tinta sobre crema, ni Instrument Serif.
 * Su tipografía es Montserrat y su paleta son los tres colores que dio el
 * dueño para esta casa: rosa fuerte, gris hueso y salmón.
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

/**
 * Montserrat, la que pidió el dueño para esta página.
 *
 * Archivo LOCAL, no next/font/google: el proyecto dejó de bajar fuentes de
 * Google en el build porque un deploy real falló cuando fonts.gstatic.com
 * devolvió 404 a media compilación. Es el archivo variable de 400 a 700, así
 * que "Montserrat Bold" y "Montserrat normal" salen del mismo archivo de 35 KB
 * y son grosores de verdad, no falsificados por el navegador —globals.css pone
 * font-synthesis-weight: none justamente para que nadie finja una negrita.
 *
 * Esto REEMPLAZA a la Josefin que Josepha tiene puesta en su metaobjeto de
 * Shopify (campo title_font). Si algún día se quiere volver a la fuente que
 * elige la marca, la función es brandTitleFontClass.
 */
const montserrat = localFont({
  src: "../../../fonts/montserrat.woff2",
  weight: "400 700",
  display: "swap",
})

/* ── La paleta ─────────────────────────────────────────────────────────────
 *
 * Los tres colores los dio el dueño: #E72B5E, #F4F4F4 y #F6B5B1. Los tres
 * sirven, pero NO para cualquier cosa, y el reparto de abajo sale de medir el
 * contraste, no de elegir a ojo:
 *
 *   · #F4F4F4 gris hueso  → el fondo. Con tinta encima da 15.87:1.
 *   · #F6B5B1 salmón      → NO es color de texto: sobre el hueso da 1.57:1,
 *                           ilegible. Es superficie: el plato de las fotos.
 *   · #E72B5E rosa fuerte → sobre el hueso da 3.89:1. Pasa SOLO en letra
 *                           grande, así que vive en el nombre de la casa y en
 *                           nada más pequeño que eso.
 *
 * Para lo que el rosa no alcanza hay dos variantes suyas, mismo tono (344°),
 * calculadas hasta que el número da:
 *   · ROSA_HONDO #A11239 → 7.18:1 sobre el hueso, AAA. Rótulos y textos de
 *     apoyo. Es el rosa oscurecido, no un café ni un vino.
 *   · ROSA_BOTON #E51D54 → el blanco encima da 4.53:1. El #E72B5E tal cual se
 *     quedaba en 4.28:1, debajo de AA, y un botón de compra con el texto
 *     flojo es el peor lugar para ahorrar contraste.
 */
const FONDO = "#F4F4F4"
const ACENTO = "#F6B5B1"
const TINTA = "#191A19"
const ROSA = "#E72B5E"
const ROSA_HONDO = "#A11239"
const ROSA_BOTON = "#E51D54"
/**
 * PLATO es el único número que no se puede elegir: se calcula.
 *
 * Las doce fotos de Josepha traen fondo de estudio en rgb(250.1, 246.5, 239.7)
 * —medido con sharp sobre las doce— y van con `mix-blend-mode: multiply`, así
 * que el color que se ve donde la foto es "blanca" es el del contenedor
 * multiplicado por ese casi-blanco. Si el contenedor fuera el salmón tal cual,
 * la foto aterrizaría en rgb(241,175,167) y se vería un cuadro más oscuro
 * dentro del cuadro. PLATO va al revés —contenedor = salmón × 255 ÷ foto— para
 * que la multiplicación caiga EXACTO en #F6B5B1: desviación cero en los tres
 * canales.
 *
 * Y por eso el plato es salmón y no gris hueso: para aterrizar en #F4F4F4 el
 * canal azul necesitaría 259.6, y el azul no llega más allá de 255. Multiply
 * solo oscurece, nunca aclara, así que un fondo de estudio tibio no puede
 * fundirse con un gris neutro. Sobre el salmón sí cae, y de paso las botas
 * quedan en una baldosa rosa en vez de flotar sobre nada.
 */
const PLATO = "#FBBBBC"

/* ── La escala ─────────────────────────────────────────────────────────────
 *
 * Montserrat tiene la altura de x grande y el trazo parejo, así que a igual
 * número de píxeles se lee más sólida que la Josefin que estaba antes. Aun
 * así la escala se queda alta: el dueño pidió expresamente letra grande —"las
 * letras son muy pequeñas"— y esta página se recorre, no se escanea. Toda la
 * escala vive aquí, en un solo sitio, para subirla o bajarla entera.
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

  const listado = await getProductsByVendor(TALLER, 24).catch(() => [] as Product[])
  // El listado sale del fragmento de TARJETA, que no trae descripción. Con
  // tres productos sale más barato pedir cada uno completo que engordar el
  // fragmento que usan todas las listas del sitio.
  const productos = (
    await Promise.all(listado.map((p) => getProductByHandle(p.handle).catch(() => p)))
  ).filter((p): p is Product => !!p)
  // Sin productos no hay página: mejor 404 que una landing vacía con el
  // nombre de una casa que sí existe.
  if (productos.length === 0) notFound()

  const fuente = montserrat.className

  return (
    <div
      style={{ backgroundColor: FONDO, color: TINTA }}
      className={`${fuente} min-h-screen`}
    >
      {/* Sin cabecera y sin enlaces al resto del sitio, a propósito: esta
          página se manda en un anuncio y todo lo que saque de ella es una
          venta menos. Lo único que lleva a otra parte es pagar, y eso va al
          checkout de Shopify, no al catálogo. El minicarrito, que sí puede
          aparecer, lo monta el layout. */}

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
          style={{
            fontSize: ESCALA.titulo,
            letterSpacing: "-0.02em",
            color: ROSA,
            fontWeight: 700,
          }}
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
        // La portada primero y luego las demás, sin repetirla.
        const portada = p.featuredImage ?? p.images?.[0] ?? null
        const fotos = [
          ...(portada ? [portada] : []),
          ...(p.images ?? []).filter((im) => im.url && im.url !== portada?.url),
        ]
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
              {/* La galería. Ninguna foto es un enlace: al tocarlas se abren
                  encima de esta misma página. El dueño lo pidió con todas sus
                  letras — nada debe sacar de aquí al visitante que llegó por un
                  anuncio. */}
              <div className="w-full md:w-[56%]">
                <GaleriaJosepha
                  imagenes={fotos}
                  titulo={p.title}
                  plato={PLATO}
                  acento={ACENTO}
                  tinta={TINTA}
                  prioridad={i === 0}
                />
              </div>

              <div
                className={`w-full text-center md:w-[44%] ${
                  alDerecho ? "md:text-left" : "md:text-right"
                }`}
              >
                {/* "La Estephania" pierde el artículo: aquí los nombres son de
                    pila y así se leen como una firma. */}
                <h2
                  className={`${fuente} lowercase leading-[0.95]`}
                  style={{
                    fontSize: ESCALA.producto,
                    letterSpacing: "-0.015em",
                    fontWeight: 700,
                  }}
                >
                  {p.title.replace(/^la\s+/i, "")}
                </h2>

                <p
                  className="mt-8 leading-none"
                  style={{
                    fontSize: ESCALA.precio,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 700,
                  }}
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
                    rosaBoton={ROSA_BOTON}
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

                {/* Aquí iba "verlo completo", que llevaba a la ficha del
                    producto. Se quitó: esta página no manda a ninguna otra. Se
                    ve, se escoge talla y se compra sin salir. */}
              </div>
            </div>
          </section>
        )
      })}

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28 pt-4 text-center md:px-12 md:pb-40">
        <p
          className="mx-auto max-w-[22ch] lowercase leading-[1.1]"
          style={{ fontSize: ESCALA.cierre, color: ROSA, fontWeight: 700 }}
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
        {/* Aquí iba "ver las catorce casas", que llevaba a /marcas. Misma
            razón: de esta página no se sale al sitio. */}
      </section>
    </div>
  )
}
