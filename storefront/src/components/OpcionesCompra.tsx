"use client"

import Image from "next/image"
import { useLocale } from "@/lib/i18n/context"
import { tallasDe, nombreCorto, type Pieza } from "@/lib/combos"
import { formatMoney } from "@/lib/utils"

/**
 * QUÉ SE LLEVA: una sola decisión, con todas las salidas a la vista.
 *
 * Antes cada promoción pintaba su propia caja, y cada caja repetía la opción
 * "Solo la bota". Dos cajas, dos veces el mismo precio, y nada impedía marcar
 * cosas contradictorias en cada una. El dueño lo leyó de corrido y lo dijo en
 * tres palabras: "creo que esto es muy confuso". Lo era.
 *
 * Ahora hay UNA caja y UNA elección:
 *
 *     ( ) Solo la bota                            $3,699
 *     ( ) + un cinto a mitad · ahorras $499.50    $4,198.50
 *     ( ) + un segundo par a mitad · ahorras …    $5,548.50
 *
 * Es el mismo patrón de cualquier tienda que vende paquetes, y es el que el
 * dueño enseñó desde el principio: la persona no decide si compra o no, decide
 * QUÉ se lleva. Elegida una fila con extra, debajo aparece lo único que falta:
 * cuál y de qué talla.
 *
 * NINGUNA VIENE MARCADA SALVO "Solo la bota": colar un cinto que nadie pidió y
 * cobrarlo en "Comprar ahora" es la clase de truco que devuelve mercancía.
 *
 * Las promociones salen de Shopify por etiqueta; si una no tiene productos, su
 * fila no existe. Con las dos apagadas, esta caja no se pinta.
 */

export type Eleccion = { grupo: string; handle: string; talla: string | null } | null

export type GrupoOferta = {
  /** Identificador estable: "cinto", "par". */
  id: string
  /** Clave del diccionario para la fila ("+ un cinto a mitad de precio"). */
  etiqueta: string
  /** Clave para la pregunta de abajo ("¿Cuál cinto?"). */
  pregunta: string
  productos: Pieza[]
  /** Lo que descuenta Shopify sobre la pieza añadida. 50 en las dos de hoy. */
  descuentoPct: number
}

export function OpcionesCompra({
  precioBase,
  moneda,
  grupos,
  eleccion,
  onEleccion,
}: {
  precioBase: number
  moneda: string
  grupos: GrupoOferta[]
  eleccion: Eleccion
  onEleccion: (e: Eleccion) => void
}) {
  const { t } = useLocale()

  const conProductos = grupos.filter((g) => g.productos.length > 0)
  if (conProductos.length === 0) return null

  const rebaja = (g: GrupoOferta, p: Pieza) =>
    (parseFloat(p.priceRange.minVariantPrice.amount) * g.descuentoPct) / 100

  /** Lo más barato que puede costar añadir este grupo, para la fila sin elegir. */
  const masBarato = (g: GrupoOferta) =>
    g.productos
      .map((p) => parseFloat(p.priceRange.minVariantPrice.amount) - rebaja(g, p))
      .sort((a, b) => a - b)[0]

  const grupoElegido = conProductos.find((g) => g.id === eleccion?.grupo) ?? null
  const piezaElegida =
    grupoElegido?.productos.find((p) => p.handle === eleccion?.handle) ?? null
  const tallas = tallasDe(piezaElegida)
  const faltaTalla = !!piezaElegida && tallas.length > 0 && !eleccion?.talla

  const fila = (activa: boolean) =>
    `flex w-full cursor-pointer items-center gap-3 border px-3 py-3 text-left transition-colors duration-[180ms] ${
      activa ? "border-text bg-bg" : "border-border hover:border-text-muted"
    }`

  const bolita = (activa: boolean) => (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        activa ? "border-text" : "border-border"
      }`}
    >
      {activa && <span className="h-2.5 w-2.5 rounded-full bg-text" />}
    </span>
  )

  return (
    <section className="mb-6 min-w-0 border-2 border-leather/60 bg-plate/40 p-4">
      <p className="nav-label text-leather">{t("opciones.titulo")}</p>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => onEleccion(null)}
          aria-pressed={!eleccion}
          className={fila(!eleccion)}
        >
          {bolita(!eleccion)}
          <span className="cuerpo min-w-0 flex-1 text-text">{t("opciones.solo")}</span>
          <span className="precio shrink-0 text-text">
            {formatMoney(String(precioBase), moneda)}
          </span>
        </button>

        {conProductos.map((g) => {
          const activa = eleccion?.grupo === g.id
          const extra = activa && piezaElegida
            ? parseFloat(piezaElegida.priceRange.minVariantPrice.amount) -
              rebaja(g, piezaElegida)
            : masBarato(g)
          const ahorro = activa && piezaElegida ? rebaja(g, piezaElegida) : null
          return (
            <button
              key={g.id}
              type="button"
              onClick={() =>
                onEleccion(
                  activa ? null : { grupo: g.id, handle: g.productos[0].handle, talla: null }
                )
              }
              aria-pressed={activa}
              className={fila(activa)}
            >
              {bolita(activa)}
              <span className="min-w-0 flex-1">
                <span className="cuerpo block text-text">{t(g.etiqueta)}</span>
                <span className="nota block text-leather">
                  {ahorro !== null
                    ? `${t("tira.ahorras")} ${formatMoney(String(ahorro), moneda)}`
                    : `${t("tira.ahorrasDesde")} ${formatMoney(
                        String(
                          Math.min(
                            ...g.productos.map((p) => rebaja(g, p))
                          )
                        ),
                        moneda
                      )}`}
                </span>
              </span>
              <span className="precio shrink-0 text-text">
                {formatMoney(String(precioBase + extra), moneda)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Elegida una fila con extra: cuál y de qué talla. Nada más. */}
      {grupoElegido && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="nota mb-2">{t(grupoElegido.pregunta)}</p>
          <div className="flex flex-wrap gap-2">
            {grupoElegido.productos.map((p) => {
              const activo = p.handle === eleccion?.handle
              const precio = parseFloat(p.priceRange.minVariantPrice.amount)
              const mon = p.priceRange.minVariantPrice.currencyCode
              const menos = rebaja(grupoElegido, p)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onEleccion({ grupo: grupoElegido.id, handle: p.handle, talla: null })
                  }
                  aria-pressed={activo}
                  className={`relative w-[132px] shrink-0 cursor-pointer border p-2 text-left transition-colors duration-[180ms] ${
                    activo ? "border-text bg-bg" : "border-border hover:border-text-muted"
                  }`}
                >
                  {activo && (
                    <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-text text-bg">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </span>
                  )}
                  <span className="plato block">
                    {p.featuredImage ? (
                      <Image
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText || p.title}
                        fill
                        sizes="132px"
                      />
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
                      {formatMoney(String(precio - menos), mon)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {tallas.length > 0 && piezaElegida && (
            <div className="mt-4">
              <p className="nota mb-1.5">
                {t("tira.talla")} {nombreCorto(piezaElegida.title)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tallas.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      onEleccion({
                        grupo: grupoElegido.id,
                        handle: piezaElegida.handle,
                        talla: s,
                      })
                    }
                    aria-pressed={eleccion?.talla === s}
                    className={`h-10 min-w-[44px] cursor-pointer border px-2 text-sm transition-colors duration-[180ms] ${
                      eleccion?.talla === s
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
