"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { usePDPVariant } from "./PDPVariantContext"
import { ColorSwatch } from "./ColorSwatch"
import { formatSizeWithUs } from "@/lib/sizes"
import { formatMoney } from "@/lib/utils"
import { COLOR_OPTION_NAMES, findVariantBySelection } from "@/lib/pdp/variants"
import type { Product } from "@/lib/shopify/types"

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
  const { addItem, isPending } = useCart()
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
    // Obligar a elegir talla — si falta, avisamos y hacemos scroll al selector.
    if (needsSize) {
      setShowSizeError(true)
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    if (sizeOption) {
      if (activeVariant?.availableForSale) addItem(activeVariant.id, 1)
    } else if (metaSizes.length > 0 && metaSize) {
      // Talla de metacampo → guardarla como atributo de la línea del pedido.
      const v = product.variants[0]
      if (v) addItem(v.id, 1, [{ key: "Talla", value: metaSize }])
    } else if (purchaseVariant?.availableForSale) {
      addItem(purchaseVariant.id, 1)
    }
  }

  const ctaLabel = isPending
    ? "Agregando..."
    : needsSize
      ? "Selecciona tu talla"
      : isUnknownCombo
        ? "Combinación no disponible"
        : !isAvailable
          ? "Agotado"
          : "Agregar al carrito"

  const stickyCtaLabel = isPending
    ? "..."
    : needsSize
      ? "Elige talla"
      : isUnknownCombo
        ? "No disponible"
        : !isAvailable
          ? "Agotado"
          : "Agregar"

  // El botón se deshabilita solo cuando NO falta talla y aun así no se puede
  // comprar (agotado / combinación inexistente). Si falta talla lo dejamos
  // habilitado para poder avisar al hacer clic.
  const ctaDisabled =
    isPending || (!needsSize && (!isAvailable || isUnknownCombo))

  const price = product.priceRange.minVariantPrice

  // Botón de talla reusable (variante o metacampo comparten estilo).
  const sizeButton = (
    value: string,
    active: boolean,
    available: boolean,
    onClick: () => void
  ) => (
    <button
      key={value}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={!available && !active}
      className={`min-w-[3rem] px-4 py-2 rounded-full text-sm border transition-all whitespace-nowrap ${
        active
          ? "border-leather bg-leather text-bg"
          : available
            ? "border-border text-text hover:border-leather"
            : "border-border text-text-subtle line-through cursor-not-allowed"
      }`}
    >
      {formatSizeWithUs(value, genderHandle)}
    </button>
  )

  const stickyBar = (
    <div
      role="region"
      aria-label="Acciones del producto"
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-bg/95 backdrop-blur-xl backdrop-saturate-200 border-t border-border/60 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] transition-transform duration-300 ${
        showSticky ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 p-3">
        {product.featuredImage ? (
          <div className="relative w-12 h-12 flex-shrink-0 bg-bg-alt overflow-hidden rounded-sm">
            <Image
              src={product.featuredImage.url}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text font-medium truncate leading-tight">
            {product.title}
          </p>
          <p className="text-sm font-medium text-leather mt-0.5">
            {formatMoney(price.amount, price.currencyCode)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={ctaDisabled}
          aria-busy={isPending}
          aria-label={ctaLabel}
          className="px-5 py-3 rounded-full bg-leather text-bg text-xs uppercase tracking-wider font-medium hover:bg-text disabled:bg-text-subtle disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
        const labelTitle = isColor ? "Color" : option.name
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
        <div ref={sizeRef} className="scroll-mt-24">
          <p className="eyebrow text-text-muted text-xs mb-3">
            Talla
            {sizeOption && selection[sizeOption.name] && (
              <span className="ml-2 text-text normal-case tracking-normal font-medium">
                {formatSizeWithUs(selection[sizeOption.name], genderHandle)}
              </span>
            )}
            {!sizeOption && metaSize && (
              <span className="ml-2 text-text normal-case tracking-normal font-medium">
                {formatSizeWithUs(metaSize, genderHandle)}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
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
            <p className="text-xs text-text-subtle mt-2">
              MX · US ·{" "}
              <a href="/guia-tallas" className="underline hover:text-leather">
                Guía de tallas
              </a>
            </p>
          )}
          {showSizeError && needsSize && (
            <p className="text-sm text-terracotta font-medium mt-2" role="alert">
              Por favor selecciona tu talla.
            </p>
          )}
        </div>
      )}

      {/* Región viva: anuncia Disponible/Agotado. */}
      <div className="text-sm empty:hidden" role="status" aria-live="polite">
        {(sizeSelected || isDefaultOnly) &&
          (isAvailable ? (
            <span className="text-emerald-700 inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-700 rounded-full inline-block" />
              Disponible
            </span>
          ) : (
            <span className="text-text-subtle inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-text-subtle rounded-full inline-block" />
              Agotado
            </span>
          ))}
      </div>

      <button
        ref={ctaRef}
        type="button"
        onClick={handleAdd}
        disabled={ctaDisabled}
        aria-busy={isPending}
        className="w-full py-4 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text disabled:bg-text-subtle disabled:cursor-not-allowed transition-colors"
      >
        {ctaLabel}
      </button>

      <p className="text-xs text-text-muted text-center">
        Envío MX 3-5 días · Cambio de talla sin costo
      </p>

      {mounted ? createPortal(stickyBar, document.body) : null}
    </div>
  )
}
