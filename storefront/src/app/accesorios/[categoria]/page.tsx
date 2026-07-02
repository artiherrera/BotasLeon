import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductsListing } from "@/components/ProductsListing"
import { EmptyProductsState } from "@/components/EmptyState"
import { getAccessories } from "@/lib/shopify"
import { ACCESSORY_SLUG_TO_TYPE, ACCESSORY_SLUGS } from "@/lib/shopify/taxonomy"
import { pageMetadata } from "@/lib/seo"

/**
 * /accesorios/[categoria] — sub-rutas estáticas long-tail.
 *
 * Slugs válidos: cinturones, sombreros, carteras, cuidado-del-cuero.
 * Cada uno mapea a un productType exacto vía ACCESSORY_SLUG_TO_TYPE.
 *
 * generateStaticParams pre-renderiza las rutas en build (compatible con
 * Amplify static export). notFound() evita crashes en slugs arbitrarios.
 */

export const revalidate = 60

const CATEGORIA_META: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  cinturones: {
    eyebrow: "Accesorios · Cinturones",
    title: "Cinturones piteados y vaqueros",
    description:
      "Cinturones de piel auténtica con piteado, herrajes y hebillas trabajadas a mano. Los mismos talleres que hacen nuestras botas.",
  },
  sombreros: {
    eyebrow: "Accesorios · Sombreros",
    title: "Sombreros vaqueros",
    description:
      "Sombreros vaqueros tradicionales en lana, fieltro y palma. Para complementar el look completo con identidad mexicana.",
  },
  carteras: {
    eyebrow: "Accesorios · Carteras",
    title: "Carteras y billeteras de piel",
    description:
      "Carteras y billeteras de piel grabada y lisa. Construcción duradera para uso diario.",
  },
  "cuidado-del-cuero": {
    eyebrow: "Accesorios · Cuidado",
    title: "Cuidado del cuero",
    description:
      "Cremas, ceras, betunes y cepillos para mantener tus botas y accesorios de piel en óptimo estado por años.",
  },
}

export async function generateStaticParams() {
  return ACCESSORY_SLUGS.map((categoria) => ({ categoria }))
}

type Props = { params: Promise<{ categoria: string }> }

export default async function AccesorioCategoriaPage({ params }: Props) {
  const { categoria } = await params
  const productType = ACCESSORY_SLUG_TO_TYPE[categoria]
  if (!productType) notFound()

  const meta = CATEGORIA_META[categoria]
  const products = await getAccessories(productType)

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-8">
            <p className="eyebrow text-leather mb-2">{meta.eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl text-text mb-3">
              {meta.title}
            </h1>
            <p className="text-text-muted max-w-xl">{meta.description}</p>
          </div>

          {products.length === 0 ? (
            <EmptyProductsState
              title="Próximamente"
              description={
                process.env.NODE_ENV === "development"
                  ? `Aún no hay productos con productType = "${productType}". Sube alguno desde Shopify Admin.`
                  : "Estamos curando los primeros productos de esta categoría."
              }
            />
          ) : (
            <Suspense fallback={<div className="min-h-[400px]" />}>
              <ProductsListing products={products} />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: Props) {
  const { categoria } = await params
  if (!ACCESSORY_SLUG_TO_TYPE[categoria]) return {}
  const meta = CATEGORIA_META[categoria]
  return pageMetadata({
    path: `/accesorios/${categoria}`,
    title: meta.title,
    description: meta.description,
  })
}
