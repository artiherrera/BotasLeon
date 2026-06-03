"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { useCart } from "./CartProvider"
import { formatSizeWithUs } from "@/lib/sizes"
import { formatMoney } from "@/lib/utils"
import type { Product } from "@/lib/shopify/types"

const SIZE_OPTION_NAMES = ["Talla", "Talla del calzado", "Size"]

/**
 * ProductOptions — selector de variantes + botón Agregar al carrito.
 *
 * Incluye una barra sticky mobile que aparece cuando el CTA principal
 * sale del viewport (IntersectionObserver). La barra se renderiza vía
 * createPortal a document.body para escapar cualquier containing block
 * de transform/backdrop-filter en los ancestros del PDP. Solo md:hidden.
 *
 * Lógica de matching: cuando el usuario elige una talla buscamos la
 * variante exacta. Si no hay match exacto (combinación inexistente),
 * el botón queda deshabilitado.
 */

type Props = {
  product: Product
}

export function ProductOptions({ product }: Props) {
  const { addItem, isPending } = useCart()

  const isDefaultOnly =
    product.variants.length === 1 &&
    product.variants[0].selectedOptions.every(
      (o) => o.value.toLowerCase() === "default title"
    )

  const initialSelection = useMemo(() => {
    if (isDefaultOnly) return {}
    const firstAvailable =
      product.variants.find((v) => v.availableForSale) ?? product.variants[0]
    return Object.fromEntries(
      firstAvailable.selectedOptions.map((o) => [o.name, o.value])
    )
  }, [product.variants, isDefaultOnly])

  const [selection, setSelection] = useState<Record<string, string>>(initialSelection)

  const activeVariant = useMemo(() => {
    if (isDefaultOnly) return product.variants[0]
    return (
      product.variants.find((v) =>
        v.selectedOptions.every((o) => selection[o.name] === o.value)
      ) ?? null
    )
  }, [product.variants, selection, isDefaultOnly])

  const isAvailable = activeVariant?.availableForSale ?? false
  const isUnknownCombo = !activeVariant

  // Handle del metaobject de "Sexo objetivo" — para conversión MX→US.
  // Solo aplica al option de Talla; otros options se muestran tal cual.
  const genderHandle = product.targetGender?.references?.edges?.[0]?.node?.handle ?? null

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
    if (activeVariant && isAvailable) addItem(activeVariant.id, 1)
  }

  const ctaLabel = isPending
    ? "Agregando..."
    : isUnknownCombo
      ? "Combinación no disponible"
      : !isAvailable
        ? "Agotado"
        : "Agregar al carrito"

  const stickyCtaLabel = isPending
    ? "..."
    : isUnknownCombo
      ? "Elige talla"
      : !isAvailable
        ? "Agotado"
        : "Agregar"

  const price = product.priceRange.minVariantPrice

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
          disabled={!isAvailable || isPending || isUnknownCombo}
          aria-label={ctaLabel}
          className="px-5 py-3 bg-leather text-bg text-xs uppercase tracking-wider font-medium hover:bg-text disabled:bg-text-subtle disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {stickyCtaLabel}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {!isDefaultOnly &&
        product.options.map((option) => {
          const isSizeOption = SIZE_OPTION_NAMES.includes(option.name)
          return (
            <div key={option.id}>
              <p className="eyebrow text-text-muted text-xs mb-3">
                {isSizeOption ? "Talla" : option.name}
                {selection[option.name] && (
                  <span className="ml-2 text-text normal-case tracking-normal font-medium">
                    {isSizeOption
                      ? formatSizeWithUs(selection[option.name], genderHandle)
                      : selection[option.name]}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const candidateSel = { ...selection, [option.name]: value }
                  const matchVariant = product.variants.find((v) =>
                    v.selectedOptions.every((o) => candidateSel[o.name] === o.value)
                  )
                  const candidateAvailable = matchVariant?.availableForSale ?? false
                  const isActive = selection[option.name] === value
                  const label = isSizeOption
                    ? formatSizeWithUs(value, genderHandle)
                    : value

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelection(candidateSel)}
                      aria-pressed={isActive}
                      className={`min-w-[3rem] px-4 py-2 text-sm border transition-all whitespace-nowrap ${
                        isActive
                          ? "border-leather bg-leather text-bg"
                          : candidateAvailable
                            ? "border-border text-text hover:border-leather"
                            : "border-border text-text-subtle line-through cursor-not-allowed"
                      }`}
                      disabled={!candidateAvailable && !isActive}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {isSizeOption && genderHandle && (
                <p className="text-xs text-text-subtle mt-2">
                  MX · US ·{" "}
                  <a href="/guia-tallas" className="underline hover:text-leather">
                    Guía de tallas
                  </a>
                </p>
              )}
            </div>
          )
        })}

      {activeVariant && (
        <div className="text-sm">
          {isAvailable ? (
            <span className="text-emerald-700 inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-700 rounded-full inline-block" />
              Disponible
            </span>
          ) : (
            <span className="text-text-subtle inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-text-subtle rounded-full inline-block" />
              Agotado
            </span>
          )}
        </div>
      )}

      <button
        ref={ctaRef}
        type="button"
        onClick={handleAdd}
        disabled={!isAvailable || isPending || isUnknownCombo}
        className="w-full py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text disabled:bg-text-subtle disabled:cursor-not-allowed transition-colors"
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
