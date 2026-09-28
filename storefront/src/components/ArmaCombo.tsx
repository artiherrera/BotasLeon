"use client"

import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/components/CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { tallasDe, lineaDe, nombreCorto } from "@/lib/combos"
import { formatMoney } from "@/lib/utils"
import type { Product } from "@/lib/shopify/types"

/**
 * El armador de combos: dos piezas, elegidas aquí, al carrito de un golpe.
 *
 * Es el hermano mayor de TiraAgregar. En la ficha, una de las dos piezas ya
 * está decidida —la bota que estás mirando— y solo falta elegir la otra. En la
 * página de combos no hay nada decidido, así que se eligen las dos: la bota y
 * el cinto, o los dos pares.
 *
 * NO INVENTA OFERTAS. Los dos combos que arma salen de descuentos que ya
 * existen en Shopify y que el dueño enciende y apaga desde su panel; lo que
 * cambia aquí es solo qué piezas se ofrecen y cómo se cuentan. Si un día quita
 * el descuento y deja las etiquetas, esta página promete lo que la caja no
 * cumple: las etiquetas y el descuento se mueven juntos (ver lib/promocion.ts).
 *
 * El descuento se enseña sobre la SEGUNDA pieza, que es como están armados los
 * dos en Shopify: "compra X, obtén Y al 50%".
 */

export function ArmaCombo({
  insignia,
  titulo,
  nota,
  rotuloA,
  rotuloB,
  piezasA,
  piezasB,
  descuentoPctB = 50,
}: {
  /* Claves del diccionario: la página es de servidor y aquí sí hay idioma. */
  insignia: string
  titulo: string
  nota: string
  rotuloA: string
  rotuloB: string
  piezasA: Product[]
  piezasB: Product[]
  descuentoPctB?: number
}) {
  const { t } = useLocale()
  const { addItems, isPending } = useCart()
  const [a, setA] = useState<string | null>(null)
  const [tallaA, setTallaA] = useState<string | null>(null)
  const [b, setB] = useState<string | null>(null)
  const [tallaB, setTallaB] = useState<string | null>(null)

  if (piezasA.length === 0 || piezasB.length === 0) return null

  const pA = piezasA.find((p) => p.handle === a) ?? null
  const pB = piezasB.find((p) => p.handle === b) ?? null
  const tallasA = tallasDe(pA)
  const tallasB = tallasDe(pB)
  const faltaA = !pA || (tallasA.length > 0 && !tallaA)
  const faltaB = !pB || (tallasB.length > 0 && !tallaB)

  const precioA = pA ? parseFloat(pA.priceRange.minVariantPrice.amount) : 0
  const precioB = pB ? parseFloat(pB.priceRange.minVariantPrice.amount) : 0
  const moneda =
    pA?.priceRange.minVariantPrice.currencyCode ??
    piezasA[0].priceRange.minVariantPrice.currencyCode
  const ahorro = (precioB * descuentoPctB) / 100
  const total = precioA + precioB - ahorro

  const agregar = () => {
    if (!pA || !pB || faltaA || faltaB || isPending) return
    const lA = lineaDe(pA, tallaA)
    const lB = lineaDe(pB, tallaB)
    if (!lA || !lB) return
    addItems([
      { merchandiseId: lA.merchandiseId, quantity: 1, ...(lA.attributes ? { attributes: lA.attributes } : {}) },
      { merchandiseId: lB.merchandiseId, quantity: 1, ...(lB.attributes ? { attributes: lB.attributes } : {}) },
    ])
    setA(null); setTallaA(null); setB(null); setTallaB(null)
  }

  return (
    <section className="border border-dashed border-leather/50 p-5 md:p-6">
      <p className="nav-label text-leather">{t(insignia)}</p>
      <h2 className="display-m mt-2">{t(titulo)}</h2>
      <p className="cuerpo mt-2 max-w-[60ch] text-text-muted">{t(nota)}</p>

      <Lado
        numero={1}
        rotulo={t(rotuloA)}
        piezas={piezasA}
        elegido={a}
        onElegir={(h) => { setA(h === a ? null : h); setTallaA(null) }}
        talla={tallaA}
        onTalla={setTallaA}
        tallas={tallasA}
        pieza={pA}
      />

      <Lado
        numero={2}
        rotulo={t(rotuloB)}
        piezas={piezasB}
        elegido={b}
        onElegir={(h) => { setB(h === b ? null : h); setTallaB(null) }}
        talla={tallaB}
        onTalla={setTallaB}
        tallas={tallasB}
        pieza={pB}
        descuentoPct={descuentoPctB}
      />

      {/* El total, solo cuando hay algo que sumar. */}
      <div className="mt-6 border-t border-border pt-4">
        {pA && pB ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="nota">{t("combos.total")}</p>
              <p className="precio text-xl text-text">{formatMoney(String(total), moneda)}</p>
              <p className="nota text-leather">
                {t("tira.ahorras")} {formatMoney(String(ahorro), moneda)}
              </p>
            </div>
          </div>
        ) : (
          <p className="nota">{t("combos.elige")}</p>
        )}

        <button
          type="button"
          onClick={agregar}
          disabled={isPending || faltaA || faltaB}
          className="btn mt-4 w-full disabled:opacity-40"
        >
          {faltaA || faltaB ? t("combos.completa") : t("combos.agregar")}
        </button>
      </div>
    </section>
  )
}

/** Un lado del combo: su rótulo numerado, sus tarjetas y sus tallas. */
function Lado({
  numero,
  rotulo,
  piezas,
  elegido,
  onElegir,
  talla,
  onTalla,
  tallas,
  pieza,
  descuentoPct,
}: {
  numero: number
  rotulo: string
  piezas: Product[]
  elegido: string | null
  onElegir: (handle: string) => void
  talla: string | null
  onTalla: (t: string) => void
  tallas: string[]
  pieza: Product | null
  descuentoPct?: number
}) {
  const { t } = useLocale()
  return (
    <div className="mt-6">
      {/* El número no es adorno: son dos pasos y en ese orden, porque el
          descuento cae sobre la segunda pieza. */}
      <p className="nav-label text-text">
        <span className="text-text-muted">{numero}.</span> {rotulo}
      </p>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {piezas.map((p) => {
          const activo = p.handle === elegido
          const precio = parseFloat(p.priceRange.minVariantPrice.amount)
          const mon = p.priceRange.minVariantPrice.currencyCode
          const rebaja = descuentoPct ? (precio * descuentoPct) / 100 : 0
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onElegir(p.handle)}
              aria-pressed={activo}
              className={`relative w-[116px] shrink-0 cursor-pointer border p-1.5 text-left transition-colors duration-[180ms] ${
                activo ? "border-text bg-plate" : "border-border hover:border-text-muted"
              }`}
            >
              {activo && (
                <span className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-text text-bg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
              )}
              <span className="plato block">
                {p.featuredImage ? (
                  <Image src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} fill sizes="116px" />
                ) : null}
              </span>
              <span className="nota mt-1.5 block line-clamp-2 leading-snug text-text">
                {nombreCorto(p.title)}
              </span>
              {rebaja > 0 ? (
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

      {pieza && tallas.length > 0 && (
        <div className="mt-3">
          <p className="nota mb-1.5">
            {t("tira.talla")} {nombreCorto(pieza.title)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tallas.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onTalla(s)}
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
        </div>
      )}
    </div>
  )
}
