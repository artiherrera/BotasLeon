"use client"

import { ENVIO_GRATIS_SIEMPRE, freeShippingProgress } from "@/lib/shipping-policy"
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

  // Sin condición: no hay avance que mostrar, solo el hecho. Una barra llena al
  // 100% en todos los carritos es ruido.
  if (ENVIO_GRATIS_SIEMPRE) {
    return (
      <p className="mb-4 nota font-medium text-text">
        {t("cart.freeShippingAlways")}
      </p>
    )
  }

  if (!applies) return null

  return (
    <div className="mb-4">
      <p className="nota mb-2">
        {qualifies ? (
          <span className="text-text font-medium">
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
          className="h-full bg-text transition-[width] duration-[180ms] ease-out motion-reduce:transition-none"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}
