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
  const [elegido, setElegido] = useState<string | null>(null)
  const [talla, setTalla] = useState<string | null>(null)

  if (productos.length === 0) return null

  const producto = productos.find((p) => p.handle === elegido) ?? null
  const tallas = tallasDe(producto)
  const faltaTalla = !!producto && tallas.length > 0 && !talla
  const faltaTallaBase = !!base?.requiereTalla && !base.talla

  const elegir = (p: Pieza) => {
    setElegido(p.handle === elegido ? null : p.handle)
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
    <section className="mb-6 border border-dashed border-leather/50 p-4">
      <p className="nav-label text-leather">{t(insignia)}</p>
      <p className="cuerpo mt-1.5 text-text">{t(titulo)}</p>
      <p className="nota mt-1">{t(nota)}</p>
      {/* La instrucción, en una línea y solo mientras no hay nada elegido: el
          dueño seguía viendo confuso cómo se agregan estas piezas, y un paso
          escrito vale más que un botón bonito. Desaparece al elegir, cuando ya
          manda el conjunto armado. */}
      {!elegido && <p className="nota mt-2 text-text">{t(instruccion)}</p>}

      {/* CADA TARJETA ES EL COMBO, no una pieza suelta.
          Antes eran cinco cintos y, al tocar uno, aparecía abajo el conjunto
          armado. El dueño lo cortó: "en lugar de agregar cinto, que sea tipo
          Bota + Cinto y el ahorro". Y es mejor: así no hay que imaginarse nada
          ni tocar para enterarse de cuánto sale la pareja — cada tarjeta ya
          enseña las dos fotos, el precio de los dos juntos y lo que se ahorra.
          En un teléfono se arrastran; en escritorio caben las que haya. */}
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {productos.map((p) => {
          const activo = p.handle === elegido
          const precio = parseFloat(p.priceRange.minVariantPrice.amount)
          const mon = p.priceRange.minVariantPrice.currencyCode
          const rebaja = descuentoPct ? (precio * descuentoPct) / 100 : 0
          const conBase = !!base
          const totalPareja = conBase ? parseFloat(base!.precio.amount) + precio - rebaja : precio - rebaja
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => elegir(p)}
              aria-pressed={activo}
              className={`relative shrink-0 cursor-pointer border p-2 text-left transition-colors duration-[180ms] ${
                conBase ? "w-[164px]" : "w-[108px]"
              } ${activo ? "border-text bg-plate" : "border-border hover:border-text-muted"}`}
            >
              {/* La palomita: sin ella, el único aviso de que la tarjeta quedó
                  elegida era un borde un poco más oscuro. */}
              {activo && (
                <span className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-text text-bg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
              )}

              {conBase ? (
                <span className="flex items-center gap-1.5">
                  <span className="plato block w-[62px] shrink-0">
                    {base!.imagen ? (
                      <Image
                        src={base!.imagen.url}
                        alt={base!.imagen.altText || base!.titulo}
                        fill
                        sizes="62px"
                      />
                    ) : null}
                  </span>
                  <span className="precio text-sm text-text-muted" aria-hidden>+</span>
                  <span className="plato block w-[62px] shrink-0">
                    {p.featuredImage ? (
                      <Image
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText || p.title}
                        fill
                        sizes="62px"
                      />
                    ) : null}
                  </span>
                </span>
              ) : (
                <span className="plato block">
                  {p.featuredImage ? (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText || p.title}
                      fill
                      sizes="108px"
                    />
                  ) : null}
                </span>
              )}

              <span className="nota mt-1.5 block line-clamp-2 leading-snug text-text">
                {conBase ? `${t(conjunto)} · ${nombreCorto(p.title)}` : nombreCorto(p.title)}
              </span>

              {conBase ? (
                <>
                  <span className="precio mt-0.5 block text-sm text-text">
                    {formatMoney(String(totalPareja), mon)}
                  </span>
                  {rebaja > 0 && (
                    <span className="nota block leading-tight text-leather">
                      {t("tira.ahorras")} {formatMoney(String(rebaja), mon)}
                    </span>
                  )}
                </>
              ) : rebaja > 0 ? (
                <>
                  <span className="precio mt-0.5 block text-[11px] text-text-muted line-through">
                    {formatMoney(String(precio), mon)}
                  </span>
                  <span className="precio block text-xs text-text">
                    {formatMoney(String(precio - rebaja), mon)}
                  </span>
                </>
              ) : (
                <span className="precio mt-0.5 block text-xs text-text-muted">
                  {formatMoney(String(precio), mon)}
                </span>
              )}
            </button>
          )
        })}
      </div>

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
