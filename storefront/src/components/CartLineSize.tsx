"use client"

import { useState } from "react"
import { useCart } from "@/components/CartProvider"
import { useT } from "@/lib/i18n/context"
import { formatSizeWithUs } from "@/lib/sizes"
import { lineGender, lineSize, lineSizes } from "@/lib/cart/line-size"
import type { Cart } from "@/lib/shopify/types"

/**
 * CartLineSize — elegir o cambiar la talla SIN salir del carrito.
 *
 * Existe porque se puede agregar desde la tarjeta sin pasar por la ficha: la
 * talla es un atributo de línea (ver lib/cart/line-size.ts), así que se decide
 * aquí. Cada opción muestra las dos escalas ("28 · US 9") con la conversión que
 * corresponde al sexo del producto.
 *
 * Sin talla, la línea se ve incompleta A PROPÓSITO (borde y texto de acento):
 * es la misma señal que bloquea el botón de pagar.
 */
export function CartLineSize({
  line,
  compact = false,
}: {
  line: Cart["lines"][number]
  compact?: boolean
}) {
  const { setLineSize, isPending } = useCart()
  const t = useT()
  const sizes = lineSizes(line)
  const current = lineSize(line)
  const gender = lineGender(line)
  const [open, setOpen] = useState(false)

  // Producto sin tallas (accesorios): no hay nada que elegir.
  if (sizes.length === 0) return null

  if (current && !open) {
    return (
      <p className={compact ? "text-xs text-text-muted" : "text-sm text-text-muted"}>
        {t("filters.size")}:{" "}
        <span className="text-text">{formatSizeWithUs(current, gender)}</span>{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline underline-offset-2 hover:text-leather transition-colors"
        >
          {t("cart.changeSize")}
        </button>
      </p>
    )
  }

  return (
    <div className={current ? "" : "border-l-2 border-leather pl-2"}>
      <p
        className={`${compact ? "text-xs" : "text-sm"} font-medium ${
          current ? "text-text-muted" : "text-leather"
        } mb-1.5`}
      >
        {current ? t("cart.changeSizeTitle") : t("cart.chooseSize")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => {
          const active = size === current
          return (
            <button
              key={size}
              type="button"
              disabled={isPending}
              aria-pressed={active}
              onClick={() => {
                setLineSize(line.id, size)
                setOpen(false)
              }}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                active
                  ? "border-leather bg-text text-bg"
                  : "border-border text-text hover:border-leather"
              }`}
            >
              {formatSizeWithUs(size, gender)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
