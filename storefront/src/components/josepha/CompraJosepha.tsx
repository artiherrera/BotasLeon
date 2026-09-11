"use client"

import { useRef, useState } from "react"
import { useCart } from "@/components/CartProvider"
import { useT } from "@/lib/i18n/context"
import { extractTaxonomyValues, primerHandle } from "@/lib/shopify/facets"
import { etiquetaTallaFiltro } from "@/lib/sizes"
import { SIZE_ATTR } from "@/lib/cart/line-size"
import type { Product } from "@/lib/shopify/types"

/**
 * Elegir talla y agregar al carrito SIN salir de la página de Josepha.
 *
 * Lo pidió el dueño con esas palabras: "que se pueda hacer la compra desde esa
 * página, sin que te redirija". Antes cada botín mandaba a su ficha, y en una
 * landing de tres piezas eso es tres clics de más.
 *
 * LO QUE VIAJA ES LA TALLA MEXICANA, siempre — igual que en la ficha
 * (ProductOptions). En este catálogo la talla NO es variante: los productos
 * son de variante única y la talla vive en el metacampo shopify.shoe-size, así
 * que se manda como ATRIBUTO de línea con la clave "Talla", que es lo que lee
 * el taller para surtir. En el sitio en dólares el botón ENSEÑA "US 7" pero
 * manda "24": si viajara el rótulo, el taller surtiría tres números de más.
 *
 * No hay "Comprar ahora" aquí a propósito: en esta página el gesto es probarse
 * los tres, no salir corriendo al pago. Agregar abre el cajón del carrito, que
 * es la confirmación (CartProvider.addItem lo abre solo).
 */
export function CompraJosepha({
  product,
  acento,
  tinta,
  rosaHondo,
  rosaBoton,
  tamRotulo,
  tamApoyo,
}: {
  product: Product
  acento: string
  tinta: string
  rosaHondo: string
  /** El rosa de marca oscurecido hasta que el blanco encima pasa AA (4.53:1). */
  rosaBoton: string
  tamRotulo: string
  tamApoyo: string
}) {
  const t = useT()
  const { addItem, isPending } = useCart()
  const [talla, setTalla] = useState<string | null>(null)
  const [falta, setFalta] = useState(false)
  const [listo, setListo] = useState(false)
  const rejilla = useRef<HTMLDivElement>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // El valor CRUDO es la talla mexicana; la etiqueta es lo que se enseña.
  const sexo = primerHandle(product.targetGender)
  const tallas = extractTaxonomyValues(product.shoeSizes)
    .map((v) => v.label)
    .sort((a, b) => parseFloat(a) - parseFloat(b))

  const variante = product.variants?.[0]
  const sePuede = !!variante && product.availableForSale && tallas.length > 0

  function agregar() {
    if (!variante) return
    if (!talla) {
      // Sin talla no se agrega, y hay que decirlo donde el ojo ya está: en la
      // rejilla, no en un mensaje al pie que nadie ve.
      setFalta(true)
      rejilla.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    addItem(variante.id, 1, [{ key: SIZE_ATTR, value: talla }])
    // Confirmación inmediata en el propio botón, antes de que Shopify conteste:
    // el cajón tarda su ida y vuelta y sin esto el clic se siente muerto.
    setListo(true)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setListo(false), 2000)
  }

  if (!sePuede) return null

  return (
    <div className="mt-10">
      <p
        className="mb-4 lowercase tracking-[0.28em]"
        style={{ color: falta ? tinta : rosaHondo, fontSize: tamRotulo }}
      >
        {falta ? t("pdp.selectSize") : t("josepha.pickSize")}
      </p>

      <div
        ref={rejilla}
        role="radiogroup"
        aria-label={t("josepha.sizes")}
        className="flex flex-wrap gap-2.5 justify-center md:justify-start"
      >
        {tallas.map((mx) => {
          const puesta = talla === mx
          return (
            <button
              key={mx}
              type="button"
              role="radio"
              aria-checked={puesta}
              onClick={() => {
                setTalla(mx)
                setFalta(false)
              }}
              /* 48px de lado: en esta página el dedo va sobre fondo rosa y sin
                 más referencias, así que el objetivo táctil se cuida más que en
                 una rejilla dentro de una ficha. */
              className="flex h-12 min-w-12 items-center justify-center px-3 tracking-[0.06em] transition-colors duration-300"
              style={{
                fontSize: tamApoyo,
                border: `1px solid ${puesta ? rosaBoton : acento}`,
                backgroundColor: puesta ? rosaBoton : "transparent",
                color: puesta ? "#FFFFFF" : tinta,
                fontWeight: puesta ? 600 : 400,
              }}
            >
              {etiquetaTallaFiltro(mx, sexo, product.productType)}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={agregar}
        disabled={isPending}
        className="mt-7 h-14 w-full px-8 lowercase tracking-[0.24em] transition-opacity duration-300 hover:opacity-85 disabled:opacity-50 md:w-auto"
        /* Rosa de marca, no tinta: es el único gesto de compra de la página y
           en una landing de anuncio el botón tiene que cantar. Va el tono
           oscurecido porque con el #E72B5E tal cual el texto blanco se queda en
           4.28:1, por debajo de AA. */
        style={{
          backgroundColor: rosaBoton,
          color: "#FFFFFF",
          fontSize: tamApoyo,
          fontWeight: 600,
        }}
      >
        {listo ? t("pdp.added") : t("pdp.addToCart")}
      </button>

      {/* La rejilla de arriba ya es la que se enciende cuando falta la talla;
          este renglón es para quien usa lector de pantalla, que no ve el
          borde cambiar de color. */}
      <span aria-live="polite" className="sr-only">
        {falta ? t("pdp.sizeError") : listo ? t("pdp.added") : ""}
      </span>
    </div>
  )
}
