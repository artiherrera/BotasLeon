"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"

/**
 * El taller, arriba del nombre del producto.
 *
 * Era un chip con pastilla, borde, logo en círculo y un "Ver todas →" en el
 * color propio de cada marca: catorce identidades distintas peleando con el
 * nombre de la bota justo donde el ojo aterriza. Ahora es lo que dice el
 * sistema — eyebrow en cuero (uno de sus cinco usos) y el enlace al lado.
 *
 * Sin página de marca (dos vendors del catálogo no tienen metaobjeto) queda
 * solo el nombre: un enlace a /marcas/undefined sería un 404.
 */
export function PDPMarca({
  vendor,
  brandHandle,
  brandName,
}: {
  vendor: string
  brandHandle?: string
  brandName?: string
}) {
  const t = useT()
  if (!vendor) return null

  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p className="eyebrow text-leather">{vendor}</p>
      {brandHandle && (
        <Link
          href={`/marcas/${brandHandle}`}
          className="nota text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
        >
          {t("pdp.seeAllFrom").replace("{marca}", brandName || vendor)}
        </Link>
      )}
    </div>
  )
}
