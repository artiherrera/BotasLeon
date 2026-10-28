"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { GuiaMedidaCinto } from "./GuiaMedidaCinto"
import { useT } from "@/lib/i18n/context"
import { loadProductsByQuery, loadProductsByHandles } from "@/lib/search/client"
import { PROMO_CINTO } from "@/lib/promocion"
import { aPieza, tallasDe, lineaDe, nombreCorto, type Pieza } from "@/lib/combos"
import { formatMoney } from "@/lib/utils"
import type { Cart, Product } from "@/lib/shopify/types"

/**
 * EL CINTO QUE VA CON LA BOTA, dentro del carrito.
 *
 * Lo pidió el dueño: "que en el carrito sugiera algo, tipo otros compradores
 * también llevaron esto, como cinturones que hagan juego con la bota".
 *
 * NO DICE "OTROS COMPRADORES TAMBIÉN LLEVARON". Esa frase necesita datos de
 * compra conjunta —miles de pedidos— y esta tienda todavía no los tiene: sería
 * inventarse una multitud. La semana pasada hubo que borrar del sitio una
 * frase que afirmaba que había una persona en fotos donde no había nadie; esta
 * sería la misma clase de error con otro disfraz. El día que haya pedidos
 * suficientes, la frase se vuelve verdad y se cambia en una línea.
 *
 * LO QUE SÍ ES VERDAD, y vende más: el cinto sale a MITAD DE PRECIO llevando
 * botas. Es una promoción viva de Shopify —automática, sin código— y hoy es la
 * única que queda en pie. Eso es lo que dice el bloque.
 *
 * "QUE HAGAN JUEGO" SE RESUELVE CON DATOS, no a ojo: el metacampo de color de
 * la bota contra el del cinto. Cuando coinciden, ese cinto va primero y lleva
 * su rótulo. Solo dos de los cinco cintos tienen el color capturado, así que
 * para el resto no se afirma nada: salen igual, sin rótulo de tono.
 *
 * CUÁNDO APARECE: hay botas en el carrito y todavía no hay cinto. Si ya lleva
 * uno, el descuento ya está aplicado —es uno por pedido— y repetir la oferta
 * sería ruido.
 */

/** El handle del color del producto, si Shopify lo tiene capturado. */
function colorDe(p: { color?: Product["color"] } | null | undefined): string | null {
  return p?.color?.references?.edges?.[0]?.node?.handle ?? null
}

const esCinto = (tipo: string | undefined) =>
  (tipo ?? "").toLowerCase().includes("cintur")

export function SugerenciaCinto({ cart }: { cart: Cart | null }) {
  const t = useT()
  const { addItem, isPending } = useCart()
  const [cintos, setCintos] = useState<Pieza[]>([])
  const [colorBota, setColorBota] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [talla, setTalla] = useState<string | null>(null)
  const [faltaTalla, setFaltaTalla] = useState(false)

  const lineas = cart?.lines ?? []
  const handlesBota = lineas
    .filter((l) => !esCinto(l.merchandise.product.productType))
    .map((l) => l.merchandise.product.handle)
  const yaLlevaCinto = lineas.some((l) => esCinto(l.merchandise.product.productType))
  const hayBotas = handlesBota.length > 0
  const llaveBotas = handlesBota.join(",")

  // Los cintos de la promoción. Una vez por sesión (loadProductsByTag memoriza).
  useEffect(() => {
    if (!hayBotas || yaLlevaCinto) return
    let vigente = true
    // Por TIPO de producto, no por la etiqueta de la promoción: los cintos
    // siguen siendo cintos aunque la promoción esté apagada.
    loadProductsByQuery("product_type:Cinturones").then((ps) => {
      if (vigente) setCintos(ps.map(aPieza))
    })
    return () => {
      vigente = false
    }
  }, [hayBotas, yaLlevaCinto])

  // El color de la bota del carrito, para saber cuál cinto le va.
  useEffect(() => {
    if (!llaveBotas) return
    let vigente = true
    loadProductsByHandles(llaveBotas.split(","))
      .then((ps) => {
        if (vigente) setColorBota(ps.map(colorDe).find(Boolean) ?? null)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [llaveBotas])

  if (!hayBotas || yaLlevaCinto || cintos.length === 0) return null

  // El que hace juego primero; el resto detrás, del más barato al más caro.
  const ordenados = [...cintos].sort((a, b) => {
    const ja = colorBota && colorDe(a) === colorBota ? 1 : 0
    const jb = colorBota && colorDe(b) === colorBota ? 1 : 0
    if (ja !== jb) return jb - ja
    return (
      parseFloat(a.priceRange.minVariantPrice.amount) -
      parseFloat(b.priceRange.minVariantPrice.amount)
    )
  })
  const aEnseñar = ordenados.slice(0, 2)
  const pieza = aEnseñar.find((p) => p.handle === elegido) ?? null
  const tallas = tallasDe(pieza)

  const agregar = () => {
    if (!pieza) return
    if (tallas.length > 0 && !talla) {
      setFaltaTalla(true)
      return
    }
    const linea = lineaDe(pieza, talla)
    if (!linea) return
    addItem(linea.merchandiseId, 1, linea.attributes)
    setElegido(null)
    setTalla(null)
    setFaltaTalla(false)
  }

  return (
    <section className="mt-5 border border-leather/40 bg-bg p-3.5">
      <p className="cuerpo font-medium text-text">
        {t(PROMO_CINTO.activa ? "sugerencia.titulo" : "sugerencia.tituloSolo")}
      </p>
      {PROMO_CINTO.activa && <p className="nota mt-0.5">{t("sugerencia.nota")}</p>}

      <div className="mt-3 space-y-2">
        {aEnseñar.map((c) => {
          const activo = c.handle === elegido
          const lista = parseFloat(c.priceRange.minVariantPrice.amount)
          const moneda = c.priceRange.minVariantPrice.currencyCode
          const juego = !!colorBota && colorDe(c) === colorBota
          return (
            <button
              key={c.handle}
              type="button"
              onClick={() => {
                setElegido(activo ? null : c.handle)
                setTalla(null)
                setFaltaTalla(false)
              }}
              aria-pressed={activo}
              className={`flex w-full items-center gap-3 border p-2 text-left transition-colors duration-[180ms] ${
                activo ? "border-text bg-plate/40" : "border-border hover:border-text-muted"
              }`}
            >
              <span className="plato block w-[72px] shrink-0">
                {c.featuredImage ? (
                  <Image
                    src={c.featuredImage.url}
                    alt={c.featuredImage.altText || c.title}
                    fill
                    sizes="72px"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="cuerpo block text-text">{nombreCorto(c.title)}</span>
                {/* El rótulo del tono SOLO cuando los dos colores existen y
                    coinciden de verdad. Sin dato, no se dice nada. */}
                {juego && <span className="nota block text-leather">{t("sugerencia.juego")}</span>}
                {/* El precio partido SOLO si la promoción está viva. Con el
                    descuento retirado de Shopify, enseñar "$649.50" sería
                    cobrar $1,299 en la caja. */}
                <span className="precio mt-0.5 block text-sm">
                  {PROMO_CINTO.activa ? (
                    <>
                      <span className="text-leather">
                        {formatMoney(String(lista / 2), moneda)}
                      </span>{" "}
                      <span className="font-normal text-text-subtle line-through">
                        {formatMoney(String(lista), moneda)}
                      </span>
                    </>
                  ) : (
                    <span className="text-text">{formatMoney(String(lista), moneda)}</span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {pieza && (
        <div className="mt-3 border-t border-border pt-3">
          {tallas.length > 0 && (
            <>
              <p className="nota mb-1.5">{t("sugerencia.medida")}</p>
              <GuiaMedidaCinto className="mb-2.5" />
              <div className="flex flex-wrap gap-1.5">
                {tallas.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTalla(s)
                      setFaltaTalla(false)
                    }}
                    aria-pressed={talla === s}
                    className={`h-11 min-w-[44px] border px-2 text-sm transition-colors duration-[180ms] ${
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
          {faltaTalla && (
            <p className="nota mt-1.5 font-semibold text-text">{t("sugerencia.eligeMedida")}</p>
          )}
          <button
            type="button"
            onClick={agregar}
            disabled={isPending}
            className="btn btn-sec mt-3 w-full"
          >
            {t("sugerencia.agregar")}
          </button>
        </div>
      )}
    </section>
  )
}
