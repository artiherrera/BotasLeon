"use client"

import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/components/CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { SIZE_ATTR } from "@/lib/cart/line-size"
import { formatMoney } from "@/lib/utils"
import type { Product } from "@/lib/shopify/types"

/**
 * La oferta con los productos DENTRO, no con un enlace a otra página.
 *
 * Hasta hoy la promoción del segundo par era una línea de texto con un "Ver los
 * botines" al final. El dueño lo cortó en seco (2026-09-27): "no quiero que se
 * vea esto, sino que se vean ahí directamente los botines… que no tengan que
 * cambiar la página". Tiene razón y es lo que hace cualquier tienda que vende
 * paquetes: la segunda unidad se elige donde se está decidiendo la primera, no
 * dos clics más allá. Un enlace, en este punto de la ficha, es una fuga.
 *
 * MISMO COMPONENTE PARA LAS DOS PROMOCIONES. Los botines del "2º al 50%" y los
 * cintos a mitad son el mismo gesto: mira una foto, elige, agrega. Lo único que
 * cambia son los textos y qué productos entran, y eso llega por props. Cuando
 * mañana haya otra promoción, no hay componente nuevo que escribir.
 *
 * LA TALLA, SI EL PRODUCTO LA TIENE. Las botas la exigen —un pedido sin talla
 * es un pedido inservible, ver lib/cart/line-size— y los cintos no tienen, así
 * que para un cinto el paso desaparece solo y se agrega de un toque. La talla
 * viaja como atributo de línea, igual que en la ficha.
 *
 * NO SE PROMETE EL PRECIO CON DESCUENTO EN CADA TARJETA, y es deliberado: el
 * 50% lo aplica Shopify cuando hay DOS en el carrito, así que una tarjeta que
 * dijera "$1,850" mentiría a quien agrega solo esa. Se dice dónde se aplica,
 * con esas palabras, y el carrito lo enseña cumplido.
 */

export function TiraAgregar({
  insignia,
  titulo,
  nota,
  productos,
}: {
  /* Llegan CLAVES del diccionario, no texto ya traducido: la ficha es un
     componente de servidor y ahí no hay `t`. Traduce esta tira, que sí vive en
     el navegador y conoce el idioma de la URL. */
  insignia: string
  titulo: string
  nota: string
  productos: Product[]
}) {
  const { t } = useLocale()
  const { addItem, isPending } = useCart()
  const [elegido, setElegido] = useState<string | null>(null)
  const [talla, setTalla] = useState<string | null>(null)

  if (productos.length === 0) return null

  const producto = productos.find((p) => p.handle === elegido) ?? null
  const tallas = tallasDe(producto)
  const faltaTalla = !!producto && tallas.length > 0 && !talla

  const elegir = (p: Product) => {
    setElegido(p.handle === elegido ? null : p.handle)
    setTalla(null)
  }

  const agregar = () => {
    if (!producto || isPending || faltaTalla) return
    const v = producto.variants[0]
    if (!v) return
    addItem(v.id, 1, talla ? [{ key: SIZE_ATTR, value: talla }] : undefined)
    setElegido(null)
    setTalla(null)
  }

  return (
    <section className="mb-6 border border-dashed border-leather/50 p-4">
      <p className="nav-label text-leather">{t(insignia)}</p>
      <p className="cuerpo mt-1.5 text-text">{t(titulo)}</p>
      <p className="nota mt-1">{t(nota)}</p>

      {/* Las fotos, en fila. En un teléfono se arrastran; en escritorio caben
          las tres o cuatro que hay. */}
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {productos.map((p) => {
          const activo = p.handle === elegido
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => elegir(p)}
              aria-pressed={activo}
              className={`w-[96px] shrink-0 cursor-pointer border p-1.5 text-left transition-colors duration-[180ms] ${
                activo ? "border-text bg-plate" : "border-border hover:border-text-muted"
              }`}
            >
              <span className="plato block">
                {p.featuredImage ? (
                  <Image
                    src={p.featuredImage.url}
                    alt={p.featuredImage.altText || p.title}
                    fill
                    sizes="96px"
                  />
                ) : null}
              </span>
              <span className="nota mt-1.5 block line-clamp-2 leading-snug text-text">
                {nombreCorto(p.title)}
              </span>
              <span className="precio mt-0.5 block text-xs text-text-muted">
                {formatMoney(
                  p.priceRange.minVariantPrice.amount,
                  p.priceRange.minVariantPrice.currencyCode,
                )}
              </span>
            </button>
          )
        })}
      </div>

      {producto && (
        <div className="mt-3">
          {tallas.length > 0 && (
            <>
              <p className="nota mb-1.5">
                {t("tira.talla")} {nombreCorto(producto.title)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tallas.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTalla(s)}
                    aria-pressed={talla === s}
                    className={`h-10 min-w-[44px] cursor-pointer border px-2 text-sm transition-colors duration-[180ms] ${
                      talla === s
                        ? "border-text bg-text text-bg"
                        : "border-border text-text hover:border-text"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={agregar}
            disabled={isPending || faltaTalla}
            className="btn btn-sec mt-3 w-full disabled:opacity-40"
          >
            {faltaTalla ? t("tira.eligeTalla") : t("tira.agregar")}
          </button>
        </div>
      )}
    </section>
  )
}

/** Tallas del producto, en orden numérico. Mismo campo que usa la ficha. */
function tallasDe(p: Product | null): string[] {
  const refs = p?.shoeSizes?.references?.edges ?? []
  return refs
    .map((e) => e.node.fields.find((f) => f.key === "label")?.value ?? null)
    .filter((v): v is string => !!v)
    .sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
}

/**
 * "El Elegante en Venado Café" → "Venado Café" en la tarjeta chica: el modelo
 * ya se está viendo en grande arriba, y lo que distingue al segundo par es el
 * color. Si el título no trae "en", se deja tal cual.
 */
function nombreCorto(titulo: string): string {
  const i = titulo.indexOf(" en ")
  return i > 0 ? titulo.slice(i + 4) : titulo
}
