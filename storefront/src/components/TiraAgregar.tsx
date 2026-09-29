"use client"

import Image from "next/image"
import { useLocale } from "@/lib/i18n/context"
import { tallasDe, lineaDe, nombreCorto, type Pieza } from "@/lib/combos"
import { formatMoney } from "@/lib/utils"

/**
 * La oferta, como SELECTOR — sin botón propio.
 *
 * Empezó siendo una línea de texto con un enlace, pasó por una fila con todas
 * las combinaciones y acabó aquí, y el camino lo marcó el dueño en tres golpes:
 * "que se vean ahí directamente los botines", "en vez de mostrar todas las
 * combinaciones", y al final el que lo ordena todo:
 *
 *     "Todo debe ser a la comprar ahora, lo principal. No hay que poner tantos
 *      botones. Se vuelve extremadamente confuso."
 *
 * Y tenía razón: la ficha llegó a tener CUATRO botones compitiendo —comprar,
 * agregar, y uno por cada oferta— y ninguno mandaba. Ahora las ofertas no
 * compran nada: se MARCAN, y lo marcado viaja con el botón de siempre, que
 * enseña el total actualizado. Un producto, un botón.
 *
 * EL AHORRO SE VE SIN TOCAR NADA, que es lo que el dueño repitió: mientras no
 * hay nada marcado, el encabezado dice desde cuánto se ahorra; al marcar, se
 * arma el conjunto con la foto de la bota, la de la pieza elegida y el total.
 *
 * Marcar es un interruptor: tocar la pieza marcada la desmarca. Sin eso el
 * combo sería una trampa — entras y no sales sin recargar la página.
 *
 * LAS OPCIONES VAN EN VARIAS LÍNEAS (flex-wrap), nunca en una fila que se
 * arrastra: una fila de una sola línea fija un ancho mínimo igual a la suma de
 * sus tarjetas, y eso le robó 300px a la foto del producto el 2026-09-28.
 */

export type SeleccionOferta = { handle: string; talla: string | null } | null

export function TiraAgregar({
  insignia,
  titulo,
  nota,
  instruccion,
  conjunto,
  productos,
  descuentoPct,
  base,
  seleccion,
  onSeleccion,
}: {
  /* Claves del diccionario: la ficha es de servidor y aquí sí hay idioma. */
  insignia: string
  titulo: string
  nota: string
  instruccion: string
  conjunto: string
  productos: Pieza[]
  /** Lo que descuenta Shopify sobre la pieza elegida (50 en las dos de hoy). */
  descuentoPct?: number
  /** La pieza que ya se está viendo en la ficha, para armar el conjunto. */
  base?: {
    titulo: string
    imagen?: { url: string; altText?: string | null } | null
    precio: { amount: string; currencyCode: string }
  }
  seleccion: SeleccionOferta
  onSeleccion: (s: SeleccionOferta) => void
}) {
  const { t } = useLocale()
  if (productos.length === 0) return null

  const producto = productos.find((p) => p.handle === seleccion?.handle) ?? null
  const tallas = tallasDe(producto)
  const faltaTalla = !!producto && tallas.length > 0 && !seleccion?.talla

  const moneda = productos[0].priceRange.minVariantPrice.currencyCode
  const rebajaDe = (p: Pieza) =>
    descuentoPct ? (parseFloat(p.priceRange.minVariantPrice.amount) * descuentoPct) / 100 : 0
  const ahorroMinimo = Math.min(...productos.map(rebajaDe))

  const precioElegido = producto ? parseFloat(producto.priceRange.minVariantPrice.amount) : 0
  const ahorro = producto ? rebajaDe(producto) : 0
  const total = base
    ? parseFloat(base.precio.amount) + precioElegido - ahorro
    : precioElegido - ahorro

  const marcar = (p: Pieza) => {
    if (p.handle === seleccion?.handle) onSeleccion(null)
    else onSeleccion({ handle: p.handle, talla: null })
  }

  const precioBase = base ? parseFloat(base.precio.amount) : 0
  const conCinto = !!producto

  return (
    <section className="mb-6 min-w-0 border-2 border-leather/60 bg-plate/40 p-4">
      <p className="nav-label text-leather">{t(insignia)}</p>
      <p className="cuerpo mt-1.5 text-text">{t(titulo)}</p>

      {/* LA DECISIÓN, EN DOS OPCIONES A LA VISTA.
          Ese es el punto entero de esta pieza, y lo dijo el dueño con todas las
          letras: "la idea es que la persona deje de pensar entre comprar una
          bota o no, sino entre comprar una bota CON O SIN CINTO". Una oferta
          escondida detrás de un "Elegir" —como la dejé un rato— no provoca esa
          comparación: la esconde. Las dos opciones van juntas, con sus precios
          enfrentados, y la del combo enseña lo que se ahorra.

          NO viene marcada la del combo: sería meterle al cliente un cinto que
          no pidió y cobrárselo. Se ofrece, no se cuela. */}
      {base && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onSeleccion(null)}
            aria-pressed={!conCinto}
            className={`flex w-full cursor-pointer items-center gap-3 border px-3 py-3 text-left transition-colors duration-[180ms] ${
              !conCinto ? "border-text bg-bg" : "border-border hover:border-text-muted"
            }`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${!conCinto ? "border-text" : "border-border"}`}>
              {!conCinto && <span className="h-2.5 w-2.5 rounded-full bg-text" />}
            </span>
            <span className="min-w-0 flex-1 cuerpo text-text">{t("tira.soloBota")}</span>
            <span className="precio shrink-0 text-text">
              {formatMoney(String(precioBase), moneda)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!conCinto) onSeleccion({ handle: productos[0].handle, talla: null })
            }}
            aria-pressed={conCinto}
            className={`flex w-full cursor-pointer items-start gap-3 border px-3 py-3 text-left transition-colors duration-[180ms] ${
              conCinto ? "border-text bg-bg" : "border-border hover:border-text-muted"
            }`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${conCinto ? "border-text" : "border-border"}`}>
              {conCinto && <span className="h-2.5 w-2.5 rounded-full bg-text" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="cuerpo block text-text">{t(conjunto)}</span>
              <span className="nota block text-leather">
                {conCinto
                  ? `${t("tira.ahorras")} ${formatMoney(String(ahorro), moneda)}`
                  : `${t("tira.ahorrasDesde")} ${formatMoney(String(ahorroMinimo), moneda)}`}
              </span>
            </span>
            <span className="precio shrink-0 text-text">
              {formatMoney(
                String(
                  conCinto
                    ? total
                    : precioBase +
                        parseFloat(productos[0].priceRange.minVariantPrice.amount) -
                        rebajaDe(productos[0]),
                ),
                moneda,
              )}
            </span>
          </button>
        </div>
      )}

      {/* Elegido el combo, lo que falta: cuál y de qué medida. */}
      {conCinto && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="nota mb-2">{t(instruccion)}</p>
          <div className="flex flex-wrap gap-2">
            {productos.map((p) => {
              const activo = p.handle === seleccion?.handle
              const precio = parseFloat(p.priceRange.minVariantPrice.amount)
              const mon = p.priceRange.minVariantPrice.currencyCode
              const rebaja = rebajaDe(p)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSeleccion({ handle: p.handle, talla: null })}
                  aria-pressed={activo}
                  className={`relative w-[132px] shrink-0 cursor-pointer border p-2 text-left transition-colors duration-[180ms] ${
                    activo ? "border-text bg-bg" : "border-border hover:border-text-muted"
                  }`}
                >
                  {activo && (
                    <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-text text-bg">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </span>
                  )}
                  <span className="plato block">
                    {p.featuredImage ? (
                      <Image src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} fill sizes="132px" />
                    ) : null}
                  </span>
                  <span className="nota mt-2 block line-clamp-2 leading-snug text-text">
                    {nombreCorto(p.title)}
                  </span>
                  <span className="mt-0.5 block">
                    <span className="precio text-[11px] text-text-muted line-through">
                      {formatMoney(String(precio), mon)}
                    </span>{" "}
                    <span className="precio text-sm text-text">
                      {formatMoney(String(precio - rebaja), mon)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {tallas.length > 0 && (
            <div className="mt-4">
              <p className="nota mb-1.5">
                {t("tira.talla")} {nombreCorto(producto.title)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tallas.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSeleccion({ handle: producto.handle, talla: s })}
                    aria-pressed={seleccion?.talla === s}
                    className={`h-10 min-w-[44px] cursor-pointer border px-2 text-sm transition-colors duration-[180ms] ${
                      seleccion?.talla === s
                        ? "border-text bg-text text-bg"
                        : "border-border text-text hover:border-text"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {faltaTalla && (
                <p className="nota mt-1.5 font-medium text-text">{t("tira.eligeTalla")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/** La línea de carrito de lo elegido, o null si falta la talla. */
export function lineaDeSeleccion(
  productos: Pieza[],
  seleccion: SeleccionOferta
): { merchandiseId: string; attributes?: Array<{ key: string; value: string }> } | null {
  if (!seleccion) return null
  const p = productos.find((x) => x.handle === seleccion.handle)
  if (!p) return null
  if (tallasDe(p).length > 0 && !seleccion.talla) return null
  return lineaDe(p, seleccion.talla)
}

/** Lo que suma al precio lo elegido, ya con su rebaja aplicada. */
export function importeDeSeleccion(
  productos: Pieza[],
  seleccion: SeleccionOferta,
  descuentoPct = 50
): number {
  if (!seleccion) return 0
  const p = productos.find((x) => x.handle === seleccion.handle)
  if (!p) return 0
  const precio = parseFloat(p.priceRange.minVariantPrice.amount)
  return precio - (precio * descuentoPct) / 100
}

/** ¿Hay algo elegido a lo que le falte la talla? Lo usa el botón principal. */
export function faltaTallaDeSeleccion(
  productos: Pieza[],
  seleccion: SeleccionOferta
): boolean {
  if (!seleccion) return false
  const p = productos.find((x) => x.handle === seleccion.handle)
  if (!p) return false
  return tallasDe(p).length > 0 && !seleccion.talla
}
