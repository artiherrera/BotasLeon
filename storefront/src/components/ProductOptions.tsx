"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { usePDPVariant } from "./PDPVariantContext"
import { ColorSwatch } from "./ColorSwatch"
import { SizeFinder } from "./SizeFinder"
import { formatSizeWithUs } from "@/lib/sizes"
import { formatMoney } from "@/lib/utils"
import { COLOR_OPTION_NAMES, findVariantBySelection } from "@/lib/pdp/variants"
import type { Product } from "@/lib/shopify/types"
import { useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"
import { LocalizedLink as Link } from "@/components/LocalizedLink"

const SIZE_OPTION_NAMES = ["Talla", "Talla del calzado", "Size"]

/**
 * ProductOptions — selector de Color + Talla + Agregar al carrito.
 *
 * Talla "indistinta": la muestra tanto si es VARIANTE (opción del producto)
 * como si viene del metacampo de categoría `shopify.shoe-size` (cuando la
 * talla NO se cargó como variante). En el segundo caso, al agregar al carrito
 * la talla elegida se guarda como ATRIBUTO de la línea/pedido para que la
 * tienda sepa qué talla surtir.
 *
 * No pre-seleccionamos talla: el cliente debe elegirla. Si toca "Agregar" sin
 * talla, se le avisa y hacemos scroll al selector.
 */

type Props = {
  product: Product
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

function isColorOption(name: string): boolean {
  return COLOR_OPTION_NAMES.includes(normalize(name))
}

function isSizeOption(name: string): boolean {
  return SIZE_OPTION_NAMES.includes(name) || normalize(name).includes("talla")
}

export function ProductOptions({ product }: Props) {
  const t = useT()
  const { addItem, buyNow, isPending } = useCart()
  const { selection, setOption, activeVariant } = usePDPVariant()

  // Handle del metaobject "Sexo objetivo" — para conversión MX→US.
  const genderHandle =
    product.targetGender?.references?.edges?.[0]?.node?.handle ?? null

  // ¿La talla viene como VARIANTE (opción del producto)?
  const sizeOption = product.options.find((o) => isSizeOption(o.name)) ?? null

  // Si NO, leemos las tallas del metacampo shopify.shoe-size (labels), en
  // orden numérico (22, 22.5, 23, …).
  const metaSizes = useMemo<string[]>(() => {
    if (sizeOption) return []
    const refs = product.shoeSizes?.references?.edges ?? []
    const labels = refs
      .map((e) => e.node.fields.find((f) => f.key === "label")?.value ?? null)
      .filter((v): v is string => !!v)
    return [...labels].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
  }, [sizeOption, product.shoeSizes])

  const hasSizes = !!sizeOption || metaSizes.length > 0

  // Talla elegida cuando viene del metacampo (estado local, no es variante).
  const [metaSize, setMetaSize] = useState<string | null>(null)
  const [showSizeError, setShowSizeError] = useState(false)
  const sizeRef = useRef<HTMLDivElement>(null)

  const sizeSelected = sizeOption ? !!selection[sizeOption.name] : metaSize !== null
  const needsSize = hasSizes && !sizeSelected

  // Producto de una sola variante SIN tallas de ningún tipo → nada que elegir.
  const isDefaultOnly =
    !hasSizes &&
    product.variants.length === 1 &&
    product.variants[0].selectedOptions.every(
      (o) => o.value.toLowerCase() === "default title"
    )

  // Variante a comprar: si la talla es variante → la que resuelve la selección;
  // si no → la única variante del producto (la talla va como atributo).
  const purchaseVariant = sizeOption ? activeVariant : product.variants[0] ?? null
  const isAvailable = purchaseVariant?.availableForSale ?? false
  // "Combinación no disponible": aplica solo a productos con talla-variante,
  // cuando ya se eligió talla pero esa combinación no existe.
  const isUnknownCombo = !!sizeOption && sizeSelected && !activeVariant

  // Opciones de variante que NO son talla (color, etc.) ni la "Title" default.
  const variantOptions = product.options.filter(
    (o) => o !== sizeOption && normalize(o.name) !== "title"
  )

  const selectMetaSize = (value: string) => {
    setMetaSize(value)
    setShowSizeError(false)
  }

  // === Sticky mobile bar ===
  const ctaRef = useRef<HTMLButtonElement>(null)
  const [showSticky, setShowSticky] = useState(false)
  // Confirmación optimista: el botón dice "✓ Agregado" en el mismo clic. La
  // ida y vuelta a Shopify tarda ~800 ms y ese silencio era lo que hacía dudar
  // si el clic entró. Si Shopify falla, el toast rojo lo dice igual.
  const [justAdded, setJustAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Clic sin talla: además del aviso junto al selector, el propio botón tocado
  // dice "Selecciona tu talla" un momento. Antes la única respuesta era una
  // frase chica tres elementos más arriba, y el clic parecía no hacer nada.
  const [sizeNudge, setSizeNudge] = useState(false)
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current)
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current)
  }, [])

  // Un solo gesto para los dos botones: enciende el selector, lo trae al
  // frente (start, no center: en escritorio "center" apenas movía 16 px) y
  // hace que el botón responda.
  const pedirTalla = () => {
    setShowSizeError(true)
    setSizeNudge(true)
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current)
    nudgeTimer.current = setTimeout(() => setSizeNudge(false), 1600)
    sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -10px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleAdd = () => {
    if (isPending) return
    if (needsSize) { pedirTalla(); return }
    const marcar = () => {
      setJustAdded(true)
      if (addedTimer.current) clearTimeout(addedTimer.current)
      addedTimer.current = setTimeout(() => setJustAdded(false), 2000)
    }
    if (sizeOption) {
      if (activeVariant?.availableForSale) { marcar(); addItem(activeVariant.id, 1) }
    } else if (metaSizes.length > 0 && metaSize) {
      // Talla de metacampo → guardarla como atributo de la línea del pedido.
      const v = product.variants[0]
      if (v) { marcar(); addItem(v.id, 1, [{ key: "Talla", value: metaSize }]) }
    } else if (purchaseVariant?.availableForSale) {
      marcar(); addItem(purchaseVariant.id, 1)
    }
  }

  // Comprar ahora — mismo guardia de talla y misma resolución de línea que
  // handleAdd; lo único distinto es a dónde va el par (checkout, no carrito).
  const handleBuyNow = () => {
    if (isPending) return
    if (needsSize) { pedirTalla(); return }
    if (sizeOption) {
      if (activeVariant?.availableForSale) buyNow(activeVariant.id)
    } else if (metaSizes.length > 0 && metaSize) {
      const v = product.variants[0]
      if (v) buyNow(v.id, [{ key: "Talla", value: metaSize }])
    } else if (purchaseVariant?.availableForSale) {
      buyNow(purchaseVariant.id)
    }
  }

  // Rótulos fijos aunque falte talla: con dos botones, repetir "Selecciona tu
  // talla" en ambos no distingue nada, y el clic ya avisa y hace scroll. El
  // aviso como rótulo se conserva solo en la barra pegajosa (un solo botón).
  const buyLabel = sizeNudge
    ? t("pdp.selectSize")
    : isPending
    ? t("pdp.buying")
    : isUnknownCombo
      ? t("pdp.comboUnavailable")
      : !needsSize && !isAvailable
        ? t("card.soldOut")
        : t("pdp.buyNow")

  const ctaLabel = sizeNudge
    ? t("pdp.selectSize")
    : justAdded
    ? t("pdp.added")
    : isPending
    ? t("pdp.adding")
    : isUnknownCombo
      ? t("pdp.comboUnavailable")
      : !needsSize && !isAvailable
        ? t("card.soldOut")
        : t("pdp.addToCart")

  const stickyCtaLabel = sizeNudge
    ? t("pdp.selectSize")
    : isPending
    ? "…"
    : needsSize
      ? t("pdp.chooseSize")
      : isUnknownCombo
        ? t("pdp.unavailable")
        : !isAvailable
          ? t("card.soldOut")
          : t("pdp.buyNow")

  // El botón se deshabilita solo cuando NO falta talla y aun así no se puede
  // comprar (agotado / combinación inexistente). Si falta talla lo dejamos
  // habilitado para poder avisar al hacer clic.
  const ctaDisabled =
    isPending || (!needsSize && (!isAvailable || isUnknownCombo))

  const price = product.priceRange.minVariantPrice

  // Botón de talla reusable (variante o metacampo comparten estilo).
  //
  // Rectángulo de 44px de lado, que es el objetivo táctil mínimo: la píldora
  // de antes medía 36 y en móvil se fallaba el toque. En México la etiqueta
  // llega como "24 · US 7" y se parte en dos renglones —MX arriba, US abajo—
  // porque la conversión es justo lo que el comprador está buscando; en el
  // build de Estados Unidos formatSizeWithUs devuelve solo "US 7" y entonces
  // el chip queda de un renglón, sin hueco. Un cinturón no pasa por la escala
  // de calzado (usaEscalaDeCalzado), así que ahí tampoco hay segundo renglón.
  const sizeButton = (
    value: string,
    active: boolean,
    available: boolean,
    onClick: () => void
  ) => {
    const [arriba, abajo] = formatSizeWithUs(
      value,
      genderHandle,
      product.productType
    ).split(" · ")
    return (
      <button
        key={value}
        type="button"
        onClick={onClick}
        aria-pressed={active}
        disabled={!available && !active}
        className={`flex min-h-[44px] min-w-[3.25rem] flex-col items-center justify-center gap-0.5 border px-3 py-1.5 leading-none whitespace-nowrap transition-colors duration-[180ms] ${
          active
            ? "border-text bg-text text-bg"
            : available
              ? "border-border text-text hover:border-text"
              : "border-border text-text-muted line-through cursor-not-allowed"
        }`}
      >
        <span className="text-sm font-medium">{arriba}</span>
        {abajo && (
          <span className={`nota ${active ? "text-bg/75" : ""}`}>{abajo}</span>
        )}
      </button>
    )
  }

  const stickyBar = (
    <div
      role="region"
      aria-label={t("pdp.actionsLabel")}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-bg border-t border-border transition-transform duration-[180ms] ${
        showSticky ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 p-3">
        {product.featuredImage ? (
          <div className="plato w-12 h-12 flex-shrink-0">
            <Image src={product.featuredImage.url} alt="" fill sizes="48px" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text font-medium truncate leading-tight">
            {product.title}
          </p>
          <p className="precio text-sm text-text mt-0.5">
            {formatMoney(price.amount, price.currencyCode)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={ctaDisabled}
          aria-busy={isPending}
          aria-label={buyLabel}
          className="btn whitespace-nowrap"
        >
          {stickyCtaLabel}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Opciones de variante que NO son talla (color, etc.) */}
      {variantOptions.map((option) => {
        const isColor = isColorOption(option.name)
        const labelTitle = isColor ? t("filters.color") : option.name
        const currentValue = selection[option.name]

        return (
          <div key={option.id}>
            <p className="eyebrow text-text-muted text-xs mb-3">
              {labelTitle}
              {currentValue && (
                <span className="ml-2 text-text normal-case tracking-normal font-medium">
                  {currentValue}
                </span>
              )}
            </p>
            <div className={`flex flex-wrap ${isColor ? "gap-4" : "gap-2"}`}>
              {option.values.map((value) => {
                const candidateSel = { ...selection, [option.name]: value }
                const matchVariant = findVariantBySelection(product, candidateSel)
                const candidateAvailable = matchVariant?.availableForSale ?? false
                const isActive = currentValue === value

                if (isColor) {
                  return (
                    <ColorSwatch
                      key={value}
                      value={value}
                      isActive={isActive}
                      isAvailable={candidateAvailable}
                      onClick={() => setOption(option.name, value)}
                    />
                  )
                }
                return sizeButton(value, isActive, candidateAvailable, () =>
                  setOption(option.name, value)
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Selector de TALLA unificado (variante o metacampo shopify.shoe-size) */}
      {hasSizes && (
        // scroll-mt = alto del cromo fijo más aire. Es a donde salta el aviso
        // de talla, y si se queda corto el rótulo "TALLA" aterriza DEBAJO de la
        // cabecera: el comprador ve el aviso rojo pero no lo que se le quería
        // enseñar. En escritorio el cromo mide 108px (36 de avisos + 72 de
        // cabecera); en un teléfono de 360-390 el aviso se parte en dos
        // renglones y sube a ~140, medido en el navegador.
        <div ref={sizeRef} className="scroll-mt-[156px] md:scroll-mt-[124px]">
          <p className={`eyebrow text-xs mb-3 ${showSizeError && needsSize ? "text-terracotta" : "text-text-muted"}`}>
            {t("filters.size")}
            {sizeOption && selection[sizeOption.name] && (
              <span className="ml-2 text-text normal-case tracking-normal font-medium">
                {formatSizeWithUs(selection[sizeOption.name], genderHandle, product.productType)}
              </span>
            )}
            {!sizeOption && metaSize && (
              <span className="ml-2 text-text normal-case tracking-normal font-medium">
                {formatSizeWithUs(metaSize, genderHandle, product.productType)}
              </span>
            )}
          </p>
          {showSizeError && needsSize && (
            <p className="text-base font-semibold text-terracotta mb-3" role="alert">
              {t("pdp.sizeError")} ↓
            </p>
          )}
          <div className={`flex flex-wrap gap-2 rounded-sm transition-shadow ${showSizeError && needsSize ? "ring-2 ring-terracotta ring-offset-4 ring-offset-bg" : ""}`}>
            {sizeOption
              ? sizeOption.values.map((value) => {
                  const candidateSel = { ...selection, [sizeOption.name]: value }
                  const matchVariant = findVariantBySelection(product, candidateSel)
                  const candidateAvailable = matchVariant?.availableForSale ?? false
                  const isActive = selection[sizeOption.name] === value
                  return sizeButton(value, isActive, candidateAvailable, () => {
                    setOption(sizeOption.name, value)
                    setShowSizeError(false)
                  })
                })
              : metaSizes.map((value) =>
                  sizeButton(value, metaSize === value, true, () =>
                    selectMetaSize(value)
                  )
                )}
          </div>
          {genderHandle && (
            <p className="nota mt-2">
              {isMX ? "MX · US" : "US"} ·{" "}
              <Link
                href="/guia-tallas"
                className="text-leather underline underline-offset-4 transition-colors duration-[180ms] hover:text-text"
              >
                {t("help.sizeGuide")}
              </Link>
            </p>
          )}

          {/* Buscador de talla (marca conocida / medir el pie) */}
          <SizeFinder genderHandle={genderHandle} />
        </div>
      )}

      {/* Región viva: anuncia Disponible/Agotado. */}
      {/* El verde esmeralda venía de otra paleta; el punto ya dice "disponible"
          sin necesidad de un quinto color. */}
      <div className="cuerpo empty:hidden" role="status" aria-live="polite">
        {(sizeSelected || isDefaultOnly) &&
          (isAvailable ? (
            <span className="text-text inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-text rounded-full inline-block" />
              {t("pdp.available")}
            </span>
          ) : (
            <span className="text-text-muted inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-text-muted rounded-full inline-block" />
              {t("card.soldOut")}
            </span>
          ))}
      </div>

      {/* Siguen siendo dos caminos, pero ya no pesan lo mismo: agregar es el
          sólido y comprar ahora el de contorno. Antes eran dos botones de
          ancho completo casi idénticos y ninguno mandaba. La lógica de los dos
          (guardia de talla, talla como atributo de línea) no cambia.
          El observador de la barra pegajosa se cuelga del primario. */}
      <button
        ref={ctaRef}
        type="button"
        onClick={handleAdd}
        disabled={ctaDisabled}
        aria-busy={isPending}
        className="btn w-full"
      >
        {ctaLabel}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={ctaDisabled}
        aria-busy={isPending}
        className="btn btn-sec w-full"
      >
        {buyLabel}
      </button>

      {mounted ? createPortal(stickyBar, document.body) : null}
    </div>
  )
}
