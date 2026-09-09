import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getBrands, getProducts } from "@/lib/shopify"
import { pageMetadata } from "@/lib/seo"

export const revalidate = 60

/**
 * /marcas — listado completo de marcas que comercializamos.
 *
 * Si hay metaobjects "brand" definidos, los usa con su logo, orden y
 * is_active. Si no, hace fallback al listado de vendors únicos del
 * catálogo. Cada card lleva a /marcas/[handle].
 */
export default async function MarcasPage() {
  const brands = await getBrands()

  // Para cada brand, contamos cuántos productos del catálogo tienen
  // ese vendor. Una sola query para todos los productos para no hacer
  // N+1 fetches.
  const products = brands.length > 0
    ? await getProducts({ first: 200 })
        .then((r) => r.products)
        .catch(() => [])
    : []

  // Contamos por vendor NORMALIZADO (sin acentos, minúsculas, trim): el `name`
  // del metaobject de marca y el `vendor` del producto pueden diferir en
  // mayúsculas/acentos (ej. marca "FORAJIDAS" vs vendor "Forajidas"), y un
  // match exacto dejaba el contador en 0 aunque sí hubiera productos.
  const normalizeVendor = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

  const productCountByVendor = new Map<string, number>()
  for (const p of products) {
    if (!p.vendor) continue
    const key = normalizeVendor(p.vendor)
    productCountByVendor.set(key, (productCountByVendor.get(key) ?? 0) + 1)
  }

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="contenedor seccion">
          <div className="mb-12">
            <p className="eyebrow text-xs text-text-muted mb-2">Curaduría</p>
            <h1 className="display-l text-text mb-3">
              Las marcas que comercializamos
            </h1>
            <p className="cuerpo-l medida-lectura text-text-muted">
              Trabajamos directamente con talleres y casas de León. Cada marca
              pasa nuestro filtro de calidad antes de entrar al catálogo.
            </p>
          </div>

          {brands.length === 0 ? (
            <ConfigBanner />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {brands.map((b) => {
                const count = productCountByVendor.get(normalizeVendor(b.name)) ?? 0
                return (
                  <Link
                    key={b.handle}
                    href={`/marcas/${b.handle}`}
                    aria-label={b.name}
                    className="group block"
                  >
                    {/* El logo es el CONTENIDO de esta página, así que no se
                        recorta: caja de plato y `object-contain`. Va con
                        .plato-foto porque un logo no es una toma de estudio
                        sobre fondo claro — con multiply, uno de fondo oscuro
                        se ensuciaría. */}
                    {b.logo ? (
                      <div className="plato plato-foto">
                        <Image
                          src={b.logo.url}
                          alt={b.logo.altText || b.name}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-contain p-4"
                        />
                      </div>
                    ) : (
                      <div className="plato flex items-center justify-center bg-text p-2">
                        {/* La tarjeta mide ~100px de ancho en móvil y .plato
                            recorta lo que se salga: a 22px fijos un nombre como
                            "FORAJIDAS" se cortaba contra el borde. El tamaño
                            vuelve a escalar con la tarjeta. */}
                        <h3 className="display-s text-base md:text-lg leading-tight break-words text-bg text-center">
                          {b.name}
                        </h3>
                      </div>
                    )}

                    {/* El rótulo baja bajo la caja: encima del plato, el
                        degradado negro de antes tapaba parte del logo. */}
                    <div className="mt-3">
                      <p className="nombre-producto text-sm truncate">{b.name}</p>
                      <p className="nota">
                        {count} {count === 1 ? "producto" : "productos"}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ConfigBanner() {
  return (
    <div className="border border-amber-300 bg-amber-50 p-8 max-w-2xl">
      <p className="eyebrow text-xs text-amber-900 mb-2">Configuración pendiente</p>
      <h2 className="display-s text-text mb-3">
        Aún sin marcas definidas
      </h2>
      <p className="cuerpo text-text-muted mb-4">
        Para mostrar tus marcas con logo y orden controlado, crea un
        metaobject tipo <code className="bg-bg px-1.5 py-0.5 text-leather">brand</code> en Shopify admin →
        Settings → Custom data → Metaobjects → Add definition.
      </p>
      <p className="cuerpo text-text-muted">
        Mientras tanto, las marcas de tus productos aparecen automáticamente en
        el catálogo (ver{" "}
        <Link href="/products" className="text-leather hover:underline underline-offset-4">
          todas las botas
        </Link>{" "}
        y usa el filtro "Marca" del sidebar).
      </p>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata({
    locale: lang,
  path: "/marcas",
  title: "Marcas",
  description:
    "Casas de calzado de León que comercializamos. Cada taller pasa nuestra curaduría — material, construcción y reputación.",
  })
}
