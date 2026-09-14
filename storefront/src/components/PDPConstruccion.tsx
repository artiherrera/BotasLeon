"use client"

import { useT } from "@/lib/i18n/context"
import { primerValor } from "@/lib/shopify/facets"
import type { Product } from "@/lib/shopify/types"

/**
 * La franja de construcción: de qué está hecha la bota, de un vistazo.
 *
 * Estos datos estaban enterrados en el acordeón "Detalles", que casi nadie
 * abre. Aquí van a la vista, entre las promesas y los acordeones.
 *
 * EL INFORME PEDÍA SEIS: piel, forro, suela, vira, caña y tacón. Medido sobre
 * los 106 productos, solo tres existen en Shopify:
 *
 *   piel   (shopify.footwear-material)   101 de 106 — 95%
 *   caña   (shopify.boot-style)           96 de 106 — 91%
 *   tacón  (shopify.heel-height-type)     12 de 106 — 11%
 *   forro  (shopify.lining-material)       0 ✗
 *   suela  (shopify.outsole-material)      0 ✗
 *   vira                                   no existe ni el campo ✗
 *
 * Así que la franja pinta LO QUE HAY y calla lo que falta, en vez de enseñar
 * seis casillas con tres vacías. En cuanto el dueño llene forro y suela en
 * Shopify aparecen solas en las 106 fichas, sin tocar código; la vira necesita
 * además que se cree la definición del metacampo.
 *
 * Y NO REPITE lo que ya está bajo el nombre. La línea de atributos enseña
 * horma, piel y caña; volver a decir "Piel: Cuero" ochenta píxeles más abajo no
 * informa, ensucia. Así que aquí solo va lo que NO está arriba: hoy, tacón — y
 * mañana forro, suela y vira, en cuanto existan.
 *
 * CONSECUENCIA HONESTA: con los datos de hoy esta franja NO SE PINTA en casi
 * ninguna ficha, porque le queda un solo dato y con menos de dos no hay franja
 * que hacer (una línea suelta ya la hay arriba). Es un hueco preparado, no una
 * sección viva. Se enciende sola el día que se llenen forro y suela en Shopify.
 */
export function PDPConstruccion({ product }: { product: Product }) {
  const t = useT()

  // Piel y caña NO van aquí: ya están en la línea bajo el nombre.
  const datos = [
    { llave: "construccion.tacon", valor: primerValor(product.heelHeight)?.label },
  ].filter((d): d is { llave: string; valor: string } => !!d.valor)

  if (datos.length < 2) return null

  return (
    <dl className="my-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-6 sm:grid-cols-3">
      {datos.map((d) => (
        <div key={d.llave}>
          <dt className="eyebrow text-[11px] text-text-muted">{t(d.llave)}</dt>
          <dd className="cuerpo mt-1 text-text">{d.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
