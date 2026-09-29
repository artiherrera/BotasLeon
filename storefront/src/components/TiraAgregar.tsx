"use client"

import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/components/CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { SIZE_ATTR } from "@/lib/cart/line-size"
import { tallasDe, lineaDe, nombreCorto, type Pieza } from "@/lib/combos"
import { formatMoney } from "@/lib/utils"

/**
 * La oferta con los productos DENTRO y armada como CONJUNTO: "bota + cinto".
 *
 * Nació como una línea de texto con un "Ver los botines" al final. El dueño la
 * cortó en seco (2026-09-27): "no quiero que se vea esto, sino que se vean ahí
 * directamente los botines… que no tengan que cambiar la página". Luego pidió
 * el precio a mitad a la vista, y por último la forma: "quiero que se vea algo
 * tipo BOTA + CINTO". Las tres cosas apuntan a lo mismo: que la oferta se
 * entienda sin leer, mirando.
 *
 * Así que al elegir una pieza se arma el conjunto —la bota que estás viendo, un
 * "+", lo que elegiste— con el TOTAL de los dos y el ahorro debajo, y un solo
 * botón que mete las dos cosas al carrito. Sin el conjunto, el comprador tenía
 * que sumar de cabeza dos cifras que estaban en sitios distintos de la página.
 *
 * VA ENTRE LA TALLA Y EL BOTÓN DE COMPRA (lo monta ProductOptions). Primero la
 * puse encima de la talla: interrumpía lo que el comprador vino a hacer.
 * Después, debajo del botón: ahí no la veía nadie, y el dueño lo dijo —"las
 * tarjetas se ven después del agregar al carrito". Entre las dos cosas es donde
 * cae la mirada de quien ya eligió talla y aún no ha pulsado.
 *
 * MISMO COMPONENTE PARA LAS DOS PROMOCIONES —el 2º al 50% y el cinto a mitad—
 * porque es el mismo gesto: mira, elige, agrega. Cambian los textos y qué
 * productos entran, que llegan por etiqueta desde Shopify.
 *
 * LA TALLA, SI LA PIEZA LA TIENE: las botas la exigen (un pedido sin talla es
 * un pedido inservible, ver lib/cart/line-size) y los cintos no, así que para un
 * cinto el paso desaparece solo.
 *
 * LAS DOS LÍNEAS ENTRAN EN UNA SOLA LLAMADA (addItems). Dos llamadas seguidas
 * se pisan: leen el mismo id de carrito antes de que la primera lo guarde.
 */

export function TiraAgregar({
  insignia,
  titulo,
  nota,
  instruccion,
  conjunto,
  boton,
  productos,
  descuentoPct,
  base,
}: {
  /* Llegan CLAVES del diccionario, no texto ya traducido: la ficha es un
     componente de servidor y ahí no hay `t`. Traduce esta tira, que sí vive en
     el navegador y conoce el idioma de la URL. */
  insignia: string
  titulo: string
  nota: string
  /** El paso, escrito: "Toca el cinto que quieras…". */
  instruccion: string
  /** Cómo se llama el conjunto ya armado: "Bota + cinto", "Los dos pares". */
  conjunto: string
  /** Qué dice el botón cuando el conjunto está armado. */
  boton: string
  productos: Pieza[]
  /**
   * Porcentaje que descuenta Shopify sobre la pieza elegida (50 en las dos
   * promociones de hoy). Con él se enseña el precio tachado, lo que queda y
   * cuánto se ahorra.
   */
  descuentoPct?: number
  /**
   * La pieza que ya se está viendo en la ficha, para armar el conjunto y
   * meterla al carrito junto con la elegida. La talla y el aviso de "elige tu
   * talla" viven en ProductOptions, así que llegan de ahí.
   */
  base?: {
    titulo: string
    imagen?: { url: string; altText?: string | null } | null
    precio: { amount: string; currencyCode: string }
    variantId?: string
    talla: string | null
    requiereTalla: boolean
    pedirTalla: () => void
  }
}) {
  const { t } = useLocale()
  const { addItem, addItems, isPending } = useCart()
  // Arranca con la primera elegida: así el combo se ve armado y con su precio
  // sin tocar nada. Un selector vacío obliga a adivinar qué pasa al tocar.
  const [elegido, setElegido] = useState<string | null>(productos[0]?.handle ?? null)
  const [talla, setTalla] = useState<string | null>(null)

  if (productos.length === 0) return null

  const producto = productos.find((p) => p.handle === elegido) ?? null
  const tallas = tallasDe(producto)
  const faltaTalla = !!producto && tallas.length > 0 && !talla
  const faltaTallaBase = !!base?.requiereTalla && !base.talla

  const elegir = (p: Pieza) => {
    setElegido(p.handle)
    setTalla(null)
  }

  const bruto = producto ? parseFloat(producto.priceRange.minVariantPrice.amount) : 0
  const moneda = producto?.priceRange.minVariantPrice.currencyCode ?? "MXN"
  const ahorro = descuentoPct ? (bruto * descuentoPct) / 100 : 0
  const totalConjunto = base ? parseFloat(base.precio.amount) + bruto - ahorro : bruto - ahorro

  const agregar = () => {
    if (!producto || isPending || faltaTalla) return
    const linea = lineaDe(producto, talla)
    if (!linea) return

    // Sin la pieza base (o sin su talla) se agrega solo lo elegido; el aviso de
    // talla lo enciende ProductOptions, que es quien lo sabe pintar.
    if (!base?.variantId) {
      addItem(linea.merchandiseId, 1, linea.attributes)
    } else if (faltaTallaBase) {
      base.pedirTalla()
      return
    } else {
      addItems([
        {
          merchandiseId: base.variantId,
          quantity: 1,
          ...(base.talla ? { attributes: [{ key: SIZE_ATTR, value: base.talla }] } : {}),
        },
        { merchandiseId: linea.merchandiseId, quantity: 1, ...(linea.attributes ? { attributes: linea.attributes } : {}) },
      ])
    }
    setElegido(null)
    setTalla(null)
  }

  const etiquetaBoton = faltaTallaBase
    ? t("pdp.selectSize")
    : faltaTalla
      ? t("tira.eligeTalla")
      : base?.variantId
        ? t(boton)
        : t("tira.agregar")

  return (
    <section className="mb-6 min-w-0 border border-dashed border-leather/50 p-4">
      <p className="nav-label text-leather">{t(insignia)}</p>
      <p className="cuerpo mt-1.5 text-text">{t(titulo)}</p>
      <p className="nota mt-1">{t(nota)}</p>

      {/* UN SOLO COMBO A LA VISTA, y miniaturas para cambiar la segunda pieza.
          Antes se pintaban las cinco combinaciones completas, una al lado de
          otra. Dos problemas: el dueño lo vio recargado —"en vez de mostrar
          todas las combinaciones"— y, en escritorio, esa fila de tarjetas de
          164px fijaba un ancho mínimo de 886px que le robaba el sitio a la foto
          del producto (quedaba en 334px de 1440: "las imágenes están muy
          pequeñas"). Un combo y un puñado de miniaturas dicen lo mismo, ocupan
          un tercio y dejan respirar a la foto. */}
      {producto && (
        <div className="mt-3 flex items-center gap-2">
          <span className="plato block w-[72px] shrink-0">
            {base?.imagen ? (
              <Image src={base.imagen.url} alt={base.imagen.altText || base.titulo} fill sizes="72px" />
            ) : null}
          </span>
          {base && (
            <span className="precio text-sm text-text-muted" aria-hidden>+</span>
          )}
          <span className="plato block w-[72px] shrink-0">
            {producto.featuredImage ? (
              <Image
                src={producto.featuredImage.url}
                alt={producto.featuredImage.altText || producto.title}
                fill
                sizes="72px"
              />
            ) : null}
          </span>
          <span className="ml-1 min-w-0 flex-1">
            <span className="nota block leading-tight text-text">
              {base ? `${t(conjunto)} · ${nombreCorto(producto.title)}` : nombreCorto(producto.title)}
            </span>
            <span className="precio block text-base text-text">
              {formatMoney(String(totalConjunto), moneda)}
            </span>
            {ahorro > 0 && (
              <span className="nota block leading-tight text-leather">
                {t("tira.ahorras")} {formatMoney(String(ahorro), moneda)}
              </span>
            )}
          </span>
        </div>
      )}

      {/* LAS OTRAS OPCIONES, CON SU NOMBRE Y SU PRECIO. Primero las puse en
          miniaturas de 48px peladas y el dueño lo cortó: "muy pequeñas, sin el
          nombre visible". Tenía razón — "Piel Granulada Café" y "Piel Granulada
          Negra" son dos fotos de cinto casi idénticas a ese tamaño, y encima
          cuestan distinto, así que sin nombre ni precio se elige a ciegas.

          VAN EN VARIAS LÍNEAS (flex-wrap), no en una fila que se arrastra: así
          el ancho mínimo de este bloque es el de UNA tarjeta y no el de las
          cinco. Esa fila de una sola línea fue justo lo que le robó 300px a la
          foto del producto. */}
      {productos.length > 1 && (
        <div className="mt-4">
          <p className="nota mb-2">{t(instruccion)}</p>
          <div className="flex flex-wrap gap-2">
            {productos.map((p) => {
              const activo = p.handle === elegido
              const precio = parseFloat(p.priceRange.minVariantPrice.amount)
              const mon = p.priceRange.minVariantPrice.currencyCode
              const rebaja = descuentoPct ? (precio * descuentoPct) / 100 : 0
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegir(p)}
                  aria-pressed={activo}
                  className={`w-[104px] shrink-0 cursor-pointer border p-1.5 text-left transition-colors duration-[180ms] ${
                    activo ? "border-text bg-plate" : "border-border hover:border-text-muted"
                  }`}
                >
                  <span className="plato block">
                    {p.featuredImage ? (
                      <Image
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText || p.title}
                        fill
                        sizes="104px"
                      />
                    ) : null}
                  </span>
                  <span className="nota mt-1.5 block line-clamp-2 leading-snug text-text">
                    {nombreCorto(p.title)}
                  </span>
                  <span className="precio block text-xs text-leather">
                    {formatMoney(String(precio - rebaja), mon)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {producto && (
        <div className="mt-4">
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
            {etiquetaBoton}
          </button>
        </div>
      )}
    </section>
  )
}
