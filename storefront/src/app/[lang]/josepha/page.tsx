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
 *
 * MANDA EL COLOR, DE BORDE A BORDE. Es el encargo del dueño después de que el
 * primer intento con esta paleta le pareciera "hecha por un principiante", y el
 * diagnóstico de aquello fue claro: se habían repartido los tres colores por
 * función —fondo gris, tinta rosa, caja salmón— y salió un muro gris con una
 * palabra flotando y un rectángulo de color pegado encima. El rectángulo pegado
 * era lo que delataba el trabajo.
 *
 * Aquí no hay ni una caja: cada sección es una FRANJA que llega a los dos
 * bordes de la pantalla. La bota no vive dentro de un recuadro, vive dentro de
 * un campo de color que no se acaba. Los botines van en franjas partidas
 * —mitad salmón con la foto, mitad hueso con el texto— y el lado alterna.
 *
 * Lo que SÍ conserva, porque es la misma tienda: el carrito —el minicarrito lo
 * monta el layout en todas las rutas, también en esta—, los precios por
 * mercado, y la compra sin salir de aquí.
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
 * que la negrita es un grosor de verdad y no una falsificación del navegador
 * —globals.css pone font-synthesis-weight: none justamente para eso.
 *
 * Reemplaza a la Josefin que la marca tiene puesta en su metaobjeto de Shopify
 * (campo title_font). Si algún día se quiere volver a la fuente que elige la
 * marca, la función es brandTitleFontClass.
 */
const montserrat = localFont({
  src: "../../../fonts/montserrat.woff2",
  weight: "400 700",
  display: "swap",
})

/* ── Los tres campos de color ──────────────────────────────────────────────
 *
 * Los colores los dio el dueño. Cada uno es un CAMPO que llega al borde, no un
 * papel dentro de una maqueta:
 *
 *   ROSA   #E72B5E → la portada y el cierre, enteros. Es el color de la casa,
 *                    y es lo primero y lo último que se ve.
 *   SALMON #F6B5B1 → la mitad donde vive cada bota.
 *   HUESO  #F4F4F4 → la mitad donde vive cada texto. Es el respiro, no el
 *                    protagonista: ése fue el error del intento anterior.
 *
 * LO QUE MANDA SOBRE EL ROSA ES EL TAMAÑO DE LA LETRA. Medido: el blanco sobre
 * #E72B5E da 4.28:1 y la tinta 4.08:1 — los dos se quedan por debajo del 4.5:1
 * que exige el texto normal, y los dos pasan el 3:1 del texto grande. O sea que
 * en las franjas rosas NO PUEDE HABER TEXTO CHICO, ninguno. Por eso hasta el
 * rótulo de arriba va a 20px en negrita, que es el mínimo que cuenta como
 * "grande" (14pt en negrita). No es capricho tipográfico: es la única forma de
 * usar ese rosa como fondo sin dejar texto ilegible.
 */
const ROSA = "#E72B5E"
const SALMON = "#F6B5B1"
/**
 * El hueso, con cuatro puntos de azul menos que el #F4F4F4 del dueño.
 *
 * No es un capricho: es el gris MÁS NEUTRO al que puede llegar el fondo de
 * estudio de las fotos. Multiply solo oscurece, nunca aclara, y el fondo de
 * las fotos es tibio (239.7 de azul), así que para llegar a 244 de azul haría
 * falta un plato de 259.6 y el canal se acaba en 255. Cuatro puntos en un solo
 * canal no se distinguen a ojo; un cuadro warm dentro de un gris frío, sí.
 */
const HUESO = "#F4F4F0"
const TINTA = "#191A19"
const BLANCO = "#FFFFFF"
/** El rosa oscurecido hasta 7.18:1 sobre el hueso. Mismo tono (344°). */
const ROSA_HONDO = "#A11239"
/** El rosa con el blanco encima a 4.53:1; el #E72B5E se quedaba en 4.28:1. */
const ROSA_BOTON = "#E51D54"

/**
 * PLATO se calcula, y tiene que ser CASI BLANCO. Aquí estuvo el error gordo.
 *
 * El intento anterior puso las fotos sobre un plato salmón (#FBBBBC) para que
 * se fundieran con una franja salmón. Se fundían, sí — y la bota salía teñida
 * de rosa. El dueño lo dijo en cuanto lo vio: "las fotos se ven horribles, como
 * un horrible filtro rosa sobre ellas". Tenía razón, y la causa es aritmética:
 * multiply multiplica CADA píxel por el color del plato, sin distinguir si ese
 * píxel es fondo de estudio o es cuero. Con #FBBBBC la bota conservaba el 98%
 * del rojo pero solo el 73% del verde y el 74% del azul. Eso no es fundir un
 * fondo, es un filtro rosa encima del producto — y en una tienda el cliente
 * tiene que ver el color real de lo que compra: una bota plata no puede
 * llegarle rosa.
 *
 * #F9FCFF deja la bota prácticamente intacta —pierde un 2% de rojo y un 1% de
 * verde, imperceptible— y aun así aterriza el fondo de estudio, medido con
 * sharp en rgb(250.1, 246.5, 239.7), exactamente en el HUESO de la franja. Sin
 * tinte y sin rectángulo.
 *
 * REGLA PARA EL FUTURO: con multiply, el plato solo puede ser casi blanco. Un
 * plato de color no funde un fondo, tiñe el producto entero.
 */
const PLATO = "#F9FCFF"

/* ── La escala ─────────────────────────────────────────────────────────────
 *
 * El dueño pidió letra grande ("las letras son muy pequeñas") y la página se
 * recorre, no se escanea. Pero hay un suelo que no es de gusto: nada que viva
 * sobre el rosa puede bajar de 20px en negrita, o deja de cumplir contraste.
 *
 * Cada valor es clamp(móvil, fluido, escritorio).
 */
const ESCALA = {
  /** El nombre de la casa. Ocupa la portada entera. */
  titulo: "clamp(4rem, 19vw, 14rem)",
  /** Rótulo sobre el rosa: 20px es el mínimo que cuenta como letra grande. */
  rotuloRosa: "clamp(1.25rem, 2vw, 1.5rem)",
  /** La frase de entrada, sobre el rosa. Nunca por debajo de 24px. */
  entrada: "clamp(1.5rem, 3.2vw, 2.25rem)",
  /** El nombre de cada botín. */
  producto: "clamp(2.75rem, 7vw, 4.75rem)",
  /** El precio. Con tres pares al mismo precio, la cifra es argumento. */
  precio: "clamp(2rem, 4.2vw, 2.75rem)",
  /** La frase de cierre, sobre el rosa. */
  cierre: "clamp(2rem, 5.2vw, 3.5rem)",
  /** Rótulos sobre el hueso, donde sí se puede bajar de 20px. */
  rotulo: "clamp(0.8125rem, 1.5vw, 0.9375rem)",
  /** Texto de apoyo: mensualidad, tallas, descripción. */
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
    <div className={`${fuente} min-h-screen`} style={{ backgroundColor: HUESO, color: TINTA }}>
      {/* Sin cabecera y sin enlaces al resto del sitio, a propósito: esta
          página se manda en un anuncio y todo lo que saque de ella es una
          venta menos. Lo único que lleva a otra parte es pagar, y eso va al
          checkout de Shopify. El minicarrito lo monta el layout. */}

      {/* ── Portada: el rosa entero ──────────────────────────────────────── */}
      <section
        className="flex min-h-[88vh] flex-col items-center justify-center px-6 py-24 text-center md:px-12"
        style={{ backgroundColor: ROSA, color: BLANCO }}
      >
        <p
          className="mb-8 lowercase tracking-[0.42em] md:mb-12"
          style={{ fontSize: ESCALA.rotuloRosa, fontWeight: 600 }}
        >
          <T k="josepha.eyebrow" />
        </p>
        {/* La clase de la fuente va EN el h1, no solo en el contenedor: la
            regla `h1,h2,h3,h4` de globals.css apunta al elemento, y una regla
            que apunta al elemento le gana a la fuente heredada del padre. Sin
            esto, el nombre de la casa salía en la serif del sitio. */}
        <h1
          className={`${fuente} lowercase leading-[0.78]`}
          style={{
            fontSize: ESCALA.titulo,
            // Montserrat a este tamaño hay que apretarla mucho o se lee a
            // plantilla de presentación: con el espaciado de fábrica las letras
            // flotan sueltas y la palabra pierde la forma de logotipo.
            letterSpacing: "-0.045em",
            fontWeight: 700,
          }}
        >
          josepha
        </h1>
        <p
          className="mx-auto mt-10 max-w-[24ch] leading-[1.35] md:mt-14"
          style={{ fontSize: ESCALA.entrada, fontWeight: 500 }}
        >
          <T k="josepha.lead" />
        </p>
      </section>

      {/* ── Un botín por franja ──────────────────────────────────────────── */}
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
          <section key={p.id}>
            {/* Las dos mitades llegan a los bordes y se tocan sin junta: ni
                margen, ni sombra, ni esquina redondeada. Lo que separa una
                mitad de la otra es el propio cambio de color. En móvil se
                apilan, y la franja de la foto sigue siendo de ancho completo. */}
            <div
              className={`flex flex-col md:min-h-[92vh] ${
                alDerecho ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* La mitad de la bota, sobre el hueso. La foto se funde con la
                  franja y la bota conserva su color: el plato es casi blanco a
                  propósito. Ver el comentario de PLATO. */}
              <div
                className="flex w-full items-center justify-center px-6 py-14 md:w-[55%] md:px-16 md:py-24"
                style={{ backgroundColor: HUESO }}
              >
                <div className="w-full max-w-xl">
                  <GaleriaJosepha
                    imagenes={fotos}
                    titulo={p.title}
                    plato={PLATO}
                    acento={ROSA_BOTON}
                    tinta={TINTA}
                    prioridad={i === 0}
                  />
                </div>
              </div>

              {/* La mitad del texto, sobre el salmón. Aquí el salmón SÍ es un
                  campo de color: no toca ninguna foto, así que no tiñe nada. */}
              <div
                className={`flex w-full flex-col justify-center px-6 py-16 text-center md:w-[45%] md:px-16 md:py-24 ${
                  alDerecho ? "md:text-left" : "md:text-right"
                }`}
                style={{ backgroundColor: SALMON }}
              >
                {/* "La Estephania" pierde el artículo: aquí los nombres son de
                    pila y así se leen como una firma. */}
                <h2
                  className={`${fuente} lowercase leading-[0.92]`}
                  style={{
                    fontSize: ESCALA.producto,
                    letterSpacing: "-0.035em",
                    fontWeight: 700,
                  }}
                >
                  {p.title.replace(/^la\s+/i, "")}
                </h2>

                {/* El precio en el rosa hondo, no en el #E72B5E: sobre el
                    salmón ese rosa da 2.48:1 y sería ilegible. Éste da 4.57:1
                    y sigue siendo rosa. */}
                <p
                  className="mt-6 leading-none"
                  style={{
                    fontSize: ESCALA.precio,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 700,
                    color: ROSA_HONDO,
                    letterSpacing: "-0.02em",
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
                    style={{ color: TINTA, fontSize: ESCALA.apoyo }}
                  >
                    {MESES_MSI} <T k="msi.of" /> {formatMoney(porMes, moneda, 2)}
                  </p>
                )}

                <DescripcionJosepha
                  handle={p.handle}
                  textoPlano={p.description ?? ""}
                  color={TINTA}
                  tam={ESCALA.apoyo}
                  alineacion={alDerecho ? "izquierda" : "derecha"}
                />

                {/* Se compra AQUÍ: elegir talla y agregar sin salir de la
                    página. El cajón del carrito se abre solo y confirma. */}
                {p.availableForSale ? (
                  <CompraJosepha
                    product={p}
                    borde={TINTA}
                    relleno={BLANCO}
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
              </div>
            </div>
          </section>
        )
      })}

      {/* ── Cierre: el rosa otra vez, para cerrar por donde se abrió ─────── */}
      <section
        className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center md:px-12"
        style={{ backgroundColor: ROSA, color: BLANCO }}
      >
        <p
          className={`${fuente} mx-auto max-w-[20ch] lowercase leading-[1.05]`}
          style={{ fontSize: ESCALA.cierre, fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          <T k="josepha.closing" />
        </p>
        <div className="mx-auto mt-16 h-px w-24" style={{ backgroundColor: SALMON }} />
        <p
          className="mx-auto mt-12 max-w-[26ch] leading-[1.4]"
          style={{ fontSize: ESCALA.entrada, fontWeight: 500 }}
        >
          <T k="josepha.oneOf" />
        </p>
        {/* Aquí iba "ver las catorce casas", que llevaba a /marcas. De esta
            página no se sale al sitio. */}
      </section>
    </div>
  )
}
