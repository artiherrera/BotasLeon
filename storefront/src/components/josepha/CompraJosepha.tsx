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
  tamRotulo,
  tamApoyo,
}: {
  product: Product
  acento: string
  tinta: string
  rosaHondo: string
  tamRotulo: string
  tamApoyo: string
}) {
  const t = useT()
  const { addItem, isPending } = useCart()
  const [talla, setTalla] = useState<string | null>(null)
  // El hover se lleva en estado y NO con `hover:` de Tailwind: estas casillas
  // pintan su color con `style` en línea (lo necesitan, porque la paleta llega
  // por props), y un estilo en línea le gana a cualquier clase. La clase se
  // aplicaba y no se veía nada.
  const [encima, setEncima] = useState<string | null>(null)
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
          const sobre = encima === mx && !puesta
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
              onMouseEnter={() => setEncima(mx)}
              onMouseLeave={() => setEncima((v) => (v === mx ? null : v))}
              onFocus={() => setEncima(mx)}
              onBlur={() => setEncima((v) => (v === mx ? null : v))}
              /* 48px de lado: en esta página el dedo va sobre fondo rosa y sin
                 más referencias, así que el objetivo táctil se cuida más que en
                 una rejilla dentro de una ficha.

                 cursor-pointer NO es adorno: Tailwind v4 dejó de ponérselo a los
                 <button> y el sitio solo lo repone en la clase .btn, que aquí no
                 se usa. Sin esto el puntero es una flecha y la rejilla no parece
                 tocable. El hover rellena la casilla en rosa claro y oscurece el
                 borde: sin eso había transition-colors preparando una transición
                 que nunca ocurría. */
              className="flex h-12 min-w-12 cursor-pointer items-center justify-center px-3 tracking-[0.06em] transition-colors duration-200"
              style={{
                fontSize: tamApoyo,
                // Sin elegir: el borde se oscurece y la casilla se rellena al
                // pasar el dedo o el mouse. Elegida: se invierte del todo.
                border: `1px solid ${puesta || sobre ? tinta : acento}`,
                backgroundColor: puesta ? tinta : sobre ? acento : "transparent",
                color: puesta ? "#FFFFFF" : tinta,
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
        /* Antes solo bajaba la opacidad al pasar el mouse, que es la señal más
           débil que hay: un botón medio transparente se lee como desactivado,
           no como tocable. Ahora sube un pelo y proyecta sombra —se acerca al
           dedo— y el cursor es manita. */
        className="mt-7 h-14 w-full cursor-pointer px-8 lowercase tracking-[0.24em] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-auto"
        style={{ backgroundColor: tinta, color: "#FFFFFF", fontSize: tamApoyo }}
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
