"use client"

import { useLocale } from "@/lib/i18n/context"

/**
 * FreeShippingBar — aviso de envío gratis en el carrito.
 *
 * El envío es GRATIS siempre y a todos los destinos (México y EE.UU.), así que
 * ya no hay progreso hacia un umbral: mostramos un aviso fijo y positivo, justo
 * arriba del subtotal (Cart + CartDrawer). Conserva las props por compatibilidad
 * con quien lo monta, aunque hoy no dependemos de ellas.
 */

type Props = {
  subtotal?: number
  threshold?: number
  currency?: string
}

export function FreeShippingBar(_props: Props) {
  const { locale } = useLocale()
  const label = locale === "en" ? "Free shipping on your order" : "Tu pedido tiene envío gratis"

  return (
    <div className="py-2 text-xs text-leather font-medium flex items-center gap-2">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{label}</span>
    </div>
  )
}
