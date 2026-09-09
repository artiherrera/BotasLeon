import { LocalizedLink as Link } from "@/components/LocalizedLink"
import Image from "next/image"
import { T } from "@/components/T"
import { getAccessories } from "@/lib/shopify"
import type { Product } from "@/lib/shopify/types"

/**
 * BannerCintos — banda a lo ancho para los cintos, al final de la portada.
 *
 * Antes esto era una fila de cuatro columnas con una tarjeta por categoría de
 * accesorio (Cinturones, Sombreros, Carteras, Cuidado del cuero). Como en
 * Shopify solo hay DOS accesorios publicados y los dos son cintos, se pintaba
 * una sola tarjeta con tres cuartos de fila vacíos. Un banner de foto + texto +
 * enlace dice lo mismo sin enseñar el hueco.
 *
 * Server component: un solo fetch en build. Si no hay ningún cinto publicado,
 * la sección no existe.
 */

const CINTURONES = "Cinturones"

export async function BannerCintos() {
  const cintos = await getAccessories(CINTURONES).catch(() => [] as Product[])
  const foto = cintos.find((p) => p.featuredImage)?.featuredImage ?? null

  if (cintos.length === 0) return null

  return (
    <section className="contenedor seccion">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
        {/* Foto de estudio de Shopify: va sobre plato con multiply, igual que
            cualquier foto de producto del sitio. */}
        {/* La foto va con alt vacío y el nombre lo pone el enlace: si no, este
            era un enlace SIN nombre y un lector de pantalla lo anunciaba como
            "enlace" a secas. El texto de al lado ya cuenta lo demás. */}
        {foto ? (
          <Link
            href="/accesorios/cinturones"
            aria-label={CINTURONES}
            className="plato block w-full max-w-sm"
          >
            <Image
              src={foto.url}
              alt=""
              fill
              sizes="(min-width: 768px) 384px, 100vw"
            />
          </Link>
        ) : null}

        <div>
          <p className="eyebrow text-text-muted mb-2">
            <T k="cintos.eyebrow" />
          </p>
          <h2 className="display-m mb-3">
            <T k="cintos.title" />
          </h2>
          <p className="cuerpo-l medida-lectura mb-6 text-text-muted">
            <T k="cintos.desc" />
          </p>
          <Link href="/accesorios/cinturones" className="btn btn-sec">
            <T k="cintos.cta" />
          </Link>
        </div>
      </div>
    </section>
  )
}
