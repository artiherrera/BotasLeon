import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { T } from "@/components/T"
import { getBrands } from "@/lib/shopify"
import { logoNecesitaInvertirse } from "@/lib/logos-talleres"

type Brand = Awaited<ReturnType<typeof getBrands>>[number]

/**
 * BrandGrid — la frase de marca de la portada: "Las mejores casas de León,
 * bajo un mismo techo", con los logos de los talleres debajo.
 *
 * Antes era un cintillo animado de logos a color repetidos hasta llenar la
 * pantalla, que se leía como un directorio. Aquí no se está listando a los
 * proveedores: se está diciendo qué hace la tienda, que es escoger entre esas
 * casas. Por eso es la ÚNICA sección centrada de la página — y por eso se nota.
 *
 * Los logos van en fila estática con .logos-talleres (40px, escala de grises,
 * multiply sobre la crema) para que se lean como una sola firma y no como once
 * identidades peleando entre sí.
 *
 * Se omite si no hay marcas (mejor cero que una sección vacía).
 */
export async function BrandGrid() {
  const brands = await getBrands()
  if (brands.length === 0) return null

  return (
    <section className="contenedor seccion text-center">
      <p className="eyebrow text-leather mb-3">
        <T k="brand.phraseEyebrow" />
      </p>
      {/* whitespace-pre-line: la llave trae el salto de renglón para que la
          frase caiga en dos líneas donde el autor quiso. */}
      <h2 className="display-m mx-auto max-w-3xl whitespace-pre-line">
        <T k="brand.headline" />
      </h2>

      <ul className="logos-talleres mt-10 flex list-none flex-wrap items-center justify-center gap-x-8 gap-y-6 p-0 md:mt-12 md:gap-x-12">
        {brands.map((b) => (
          <li key={b.handle}>
            <BrandLogo brand={b} />
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/marcas"
          className="cuerpo -my-3 inline-block py-3 text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
        >
          <T k="nav.brands.all" />
          <span className="ml-1.5" aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

function BrandLogo({ brand: b }: { brand: Brand }) {
  if (!b.logo) {
    // Marca sin logo cargado: el nombre en su lugar, a la misma altura de
    // renglón que los logos para que la fila no se descuadre.
    return (
      <Link
        href={`/marcas/${b.handle}`}
        className="nav-label flex min-h-11 items-center text-text-muted transition-colors duration-[180ms] hover:text-text"
      >
        {b.name}
      </Link>
    )
  }
  return (
    <Link
      href={`/marcas/${b.handle}`}
      aria-label={`Ver botas de ${b.name}`}
      // .logos-talleres deja el logo en 40px de alto; min-h-11 sube el objetivo
      // táctil a los 44 de móvil sin agrandar la imagen.
      className="flex min-h-11 items-center"
    >
      {/* Los logos del metaobjeto son cuadrados (1:1), no apaisados: a 40px de
          alto medirían 40 de ancho y el nombre de dentro no se leería. Por eso
          la franja va a 56px (44 en móvil).
          Seis de los catorce vienen sobre fondo oscuro o de color y el multiply
          los dejaría como cuadros negros; a esos se les invierte primero (ver
          lib/logos-talleres.ts, con la medición). */}
      <Image
        src={b.logo.url}
        alt={b.logo.altText || b.name}
        width={b.logo.width ?? 120}
        height={b.logo.height ?? 120}
        sizes="120px"
        className={logoNecesitaInvertirse(b.handle) ? "logo-invertido" : undefined}
      />
    </Link>
  )
}
