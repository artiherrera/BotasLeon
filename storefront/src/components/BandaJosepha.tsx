import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { T } from "@/components/T"
import { getProductsByVendor } from "@/lib/shopify"
import { fuenteJosepha } from "@/lib/fuente-josepha"
import type { Product } from "@/lib/shopify/types"

/**
 * El acceso directo a Josepha desde la portada.
 *
 * Lo pidió el dueño el 2026-11-10: "¿puedes poner un acceso directo a Josepha
 * desde nuestro landing page?". Josepha ya estaba en el menú en tres sitios,
 * pero el menú hay que abrirlo: en la portada no había nada que llevara a la
 * colección, y la landing es justo la página a la que se manda el tráfico de
 * los anuncios.
 *
 * NO ES UNA TARJETA MÁS, Y ESO ES EL PUNTO. El trío de tarjetas de la portada
 * (CategoryShowcase) sale de un metaobjeto de Shopify y es de tres en tres:
 * meter Josepha ahí la dejaría indistinguible de "Hombre" y "Mujer" y además
 * habría que tocar el admin. Esta banda trae los colores y la tipografía de
 * su propia página, así que anuncia a qué sitio lleva antes de que la toquen
 * —que es lo que hace que un acceso directo se use.
 *
 * LOS DOS TRUCOS QUE VIENEN DE LA LANDING, y que no son de adorno:
 *
 * 1. EL CAMPO DE COLOR LLEGA A LOS DOS BORDES. Nada de un recuadro de color
 *    pegado en medio de la crema: eso es lo que el dueño rechazó dos veces en
 *    la landing ("parece hecha por un principiante"). Media banda es hueso y
 *    media es rosa, de borde a borde.
 *
 * 2. EL PLATO DEBAJO DE LA FOTO. Las fotos van con `mix-blend-mode: multiply`
 *    para que el fondo de estudio se funda con la franja. Multiply multiplica
 *    cada píxel por el color de abajo, así que el plato tiene que ser CASI
 *    BLANCO o tiñe la bota entera: #F9FCFF deja el cuero intacto y aterriza el
 *    fondo de estudio exactamente en el hueso #F4F4F0 de la franja. Por eso el
 *    campo es hueso y el plato —una caja con la proporción EXACTA de la foto—
 *    es casi blanco: después de multiplicar, los dos son el mismo color y la
 *    caja desaparece. Si se igualaran, se vería un rectángulo.
 *
 * SOBRE EL ROSA NO PUEDE HABER TEXTO CHICO. Medido en la landing: el blanco
 * sobre #E72B5E da 4.28:1, por debajo del 4.5:1 que la AA exige al texto
 * normal y por encima del 3:1 que le exige al grande. Así que todo lo que va
 * encima del rosa —rótulo, frase y botón— está en 20px o más en negrita, que
 * es el mínimo que cuenta como texto grande. No es gusto tipográfico: es la
 * única forma de usar ese rosa de fondo sin dejar texto ilegible.
 *
 * Server component: una consulta en el build. Si Josepha se queda sin
 * productos publicados, la banda no existe —ni un hueco ni un enlace roto a
 * una página que en ese caso también devuelve 404.
 */

const TALLER = "Josepha"

/** Los colores de la casa. Mismos valores y mismo porqué que en /josepha. */
const ROSA = "#E72B5E"
const HUESO = "#F4F4F0"
const PLATO = "#F9FCFF"
const BLANCO = "#FFFFFF"

export async function BandaJosepha() {
  const productos = await getProductsByVendor(TALLER, 3).catch(() => [] as Product[])
  const foto = productos.map((p) => p.featuredImage ?? p.images?.[0]).find((im) => im?.url)
  if (!foto) return null

  return (
    <section className={fuenteJosepha.className}>
      {/* Toda la banda es el enlace: en un teléfono, el blanco al que apunta
          el pulgar es la banda entera y no un botón de 44px. */}
      {/* SIN aria-label: el nombre del enlace lo pone su propio texto, que ya
          está traducido. Un aria-label escrito aquí sería español duro en un
          sitio bilingüe —este es un componente de servidor y no puede usar el
          hook de traducción— y además taparía "Ver la colección" para quien
          navega escuchando. La foto va con alt vacío para no repetir. */}
      <Link href="/josepha" className="group grid md:grid-cols-[5fr_7fr]">
        {/* ── La foto, en el campo de hueso ──────────────────────────────── */}
        <div
          className="flex h-56 items-center justify-center overflow-hidden md:h-[26rem]"
          style={{ backgroundColor: HUESO }}
        >
          <div
            className="relative h-full"
            style={{
              aspectRatio: foto.width && foto.height ? `${foto.width} / ${foto.height}` : "4 / 5",
              backgroundColor: PLATO,
              isolation: "isolate",
            }}
          >
            <Image
              src={foto.url}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </div>

        {/* ── El texto, en el campo de rosa ──────────────────────────────── */}
        <div
          className="flex flex-col justify-center gap-3 px-6 py-10 md:gap-4 md:px-12 md:py-16"
          style={{ backgroundColor: ROSA, color: BLANCO }}
        >
          <p
            className="font-bold uppercase leading-none tracking-[0.14em]"
            style={{ fontSize: "clamp(1.25rem, 1.6vw, 1.375rem)" }}
          >
            <T k="josepha.eyebrow" />
          </p>

          <p
            className="font-bold uppercase leading-[0.95] tracking-[0.02em]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Josepha
          </p>

          {/* "Negro, pitón o plata. Ninguna de las tres es la discreta." — la
              misma frase con la que cierra su página. */}
          <p
            className="max-w-md leading-snug"
            style={{ fontSize: "clamp(1.5rem, 2.4vw, 1.875rem)" }}
          >
            <T k="josepha.closing" />
          </p>

          {/* El botón: bloque blanco con la letra en rosa, a 20px en negrita.
              Es un <span> y no un enlace porque el enlace es la banda entera;
              dos enlaces anidados no son HTML válido. */}
          <span
            className="mt-2 inline-flex w-fit items-center gap-3 px-6 py-3 font-bold uppercase leading-none tracking-[0.08em] transition-transform duration-[180ms] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            style={{ backgroundColor: BLANCO, color: ROSA, fontSize: "1.25rem" }}
          >
            <T k="josepha.verColeccion" />
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </section>
  )
}
