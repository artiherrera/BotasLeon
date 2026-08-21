"use client"

import { freeShippingProgress } from "@/lib/shipping-policy"
import { useT } from "@/lib/i18n/context"
import { formatMoney } from "@/lib/utils"

/**
 * Avance hacia el envío gratis, dentro del carrito. Solo renderiza en el
 * despliegue de México: en el de EE.UU. `freeShippingProgress` devuelve
 * applies:false y el componente desaparece del árbol.
 *
 * Recibe el total ya descontado (ver lib/shipping-policy.ts) para no prometer
 * un envío gratis que el checkout luego cobre.
 */
export function FreeShippingProgress({
  amount,
  currency,
}: {
  amount: number
  currency: string
}) {
  const t = useT()
  const { applies, qualifies, remaining, ratio } = freeShippingProgress(amount)

  if (!applies) return null

  return (
    <div className="mb-4">
      <p className="text-xs text-text-muted mb-2">
        {qualifies ? (
          <span className="text-leather font-medium">
            {t("cart.freeShippingQualified")}
          </span>
        ) : (
          <>
            {t("cart.freeShippingRemainingPre")}
            <span className="font-medium text-text">
              {formatMoney(String(remaining), currency)}
            </span>
            {t("cart.freeShippingRemainingPost")}
          </>
        )}
      </p>
      {/* Barra decorativa: el dato ya va en el texto de arriba, que es lo que
          leen los lectores de pantalla. */}
      <div
        aria-hidden
        className="h-1 w-full bg-border overflow-hidden"
      >
        <div
          className="h-full bg-leather transition-[width] duration-500 ease-out"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}
