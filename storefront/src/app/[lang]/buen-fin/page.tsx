import { Suspense } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { CategoryHeader } from "@/components/CategoryHeader"
import { T } from "@/components/T"
import { getProducts } from "@/lib/shopify"
import { pageMetadata } from "@/lib/seo"
import { isLocale } from "@/lib/i18n/config"
import { descuentoMaximo } from "@/lib/ofertas/datos"
import { eventoActual, llaveNombreEvento, ROJO_OFERTA } from "@/lib/ofertas/config"

/**
 * /buen-fin — las botas que traen descuento, con el descuento a la vista.
 *
 * El nombre lo puso el dueño: "la página de ofertas se llama buen fin"
 * (2026-11-10). Es el destino del cintillo de arriba, del bloque de la portada
 * y de los anuncios.
 *
 * LA DIRECCIÓN NO CAMBIA CON LA TEMPORADA, aunque el título sí. Una dirección
 * que se llamara /black-friday en diciembre rompería cada enlace compartido,
 * cada anuncio y cada correo que ya salió. El título, en cambio, sigue a la
 * fecha: "El Buen Fin" del 13 al 17 de noviembre, "Black Friday" del 27 al 30,
 * y "Ofertas" el resto del año, que es la palabra honesta — el descuento sigue
 * ahí, lo que se acabó es el nombre de la campaña. Ver lib/ofertas/config.ts.
 *
 * QUÉ LISTA: las botas que traen `oferta`, o sea aquellas en las que Shopify
 * cobró menos al meterlas a un carrito. No se filtra por precio de
 * comparación —que es como filtra /outlet— porque en esta tienda ese campo
 * está vacío en los 110 productos: /outlet lleva año y medio enseñando "sin
 * ofertas por ahora" mientras 41 botas tenían descuento.
 *
 * SIN CUENTA REGRESIVA. La lleva el cintillo de arriba, que se ve en todas las
 * páginas; repetirla aquí sería contar lo mismo dos veces en la misma
 * pantalla.
 *
 * Si el interruptor está apagado (MOSTRAR_DESCUENTO_EN_SITIO), ningún producto
 * trae oferta, la lista sale vacía y la página lo dice en vez de romperse.
 */

export const revalidate = 60

export default async function BuenFinPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "es"

  const res = await getProducts({ first: 250, sortKey: "CREATED_AT", reverse: true }).catch(
    () => null
  )
  // Agotadas fuera: el generador ya las salta, pero una bota que no se puede
  // comprar no pinta nada en una página de ofertas.
  const conOferta = (res?.products ?? []).filter((p) => p.oferta && p.availableForSale)

  const maximo = descuentoMaximo()
  const evento = eventoActual()

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          <CategoryHeader
            eyebrow={llaveNombreEvento(evento)}
            title={
              maximo > 0
                ? `${locale === "en" ? "Up to" : "Hasta"} ${maximo}%${locale === "en" ? " off" : " menos"}`
                : locale === "en"
                  ? "Deals"
                  : "Ofertas"
            }
            description=""
          />

          {conOferta.length > 0 && (
            /* "Descuento ya aplicado, sin código": es la frase que sustituye a
               "el descuento se aplica en tu carrito". Si el precio que se ve
               YA trae el descuento puesto, lo que hay que decirle al cliente no
               es dónde se aplica, sino que no tiene que hacer nada. */
            <p
              className="mb-8 inline-block px-3 py-1.5 text-[13px] font-bold uppercase leading-none tracking-[0.06em] text-bg"
              style={{ backgroundColor: ROJO_OFERTA }}
            >
              <T k="oferta.yaAplicado" />
            </p>
          )}

          {conOferta.length === 0 ? (
            <div className="max-w-2xl border border-border bg-bg-alt p-10">
              <p className="display-s text-text mb-2">
                <T k="oferta.vacia" />
              </p>
              <p className="cuerpo medida-lectura text-text-muted mb-6">
                <T k="oferta.vaciaSub" />
              </p>
              <Link href="/products" className="btn btn-sec">
                <T k="oferta.verCatalogo" />
              </Link>
            </div>
          ) : (
            // Suspense requerido: ProductsListing usa useSearchParams.
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={conOferta} ordenInicial="descuento" />
            </Suspense>
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
  const maximo = descuentoMaximo()
  const evento = eventoActual()
  const nombre =
    evento === "buenfin"
      ? "El Buen Fin"
      : evento === "blackfriday"
        ? "Black Friday"
        : es
          ? "Ofertas"
          : "Deals"
  return pageMetadata({
    locale: lang,
    path: "/buen-fin",
    title: maximo > 0 ? `${nombre} — ${es ? "hasta" : "up to"} ${maximo}%` : nombre,
    description: es
      ? `Botas con descuento ya aplicado, sin código. ${maximo > 0 ? `Hasta ${maximo}% menos.` : ""}`.trim()
      : `Boots with the discount already applied, no code needed. ${maximo > 0 ? `Up to ${maximo}% off.` : ""}`.trim(),
  })
}
