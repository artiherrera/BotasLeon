"use client"

import { useEffect, useState } from "react"
import { PROMO } from "@/lib/promo"
import { setPendingDiscount } from "@/lib/discount/client"

/**
 * PromoBar — barra de anuncio + auto-aplicación de la promo temporal a TODOS.
 *
 * Al cargar, siembra el código de la promo como "pendiente" en localStorage; el
 * CartDrawer lo valida y aplica solo cuando el cliente abre el carrito (misma
 * mecánica del link mágico /discount). Así el descuento llega a todos sin que
 * nadie escriba nada. La barra se puede cerrar por sesión SIN perder el
 * descuento (la siembra corre aunque la barra esté oculta).
 *
 * Para apagar todo: PROMO.active = false en @/lib/promo.
 */
const DISMISS_KEY = "botasleon:promo-dismissed"

export function PromoBar() {
  const [visible, setVisible] = useState(false)

  // Siembra el código para TODOS (corre aunque la barra esté cerrada).
  useEffect(() => {
    if (!PROMO.active || !PROMO.code) return
    setPendingDiscount(PROMO.code)
  }, [])

  // Visibilidad de la barra — cerrable por sesión, sin afectar el descuento.
  useEffect(() => {
    if (!PROMO.active) return
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(`${DISMISS_KEY}:${PROMO.code}`) === "1"
    } catch {}
    if (!dismissed) setVisible(true)
  }, [])

  if (!PROMO.active || !visible) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(`${DISMISS_KEY}:${PROMO.code}`, "1")
    } catch {}
    setVisible(false)
  }

  return (
    <div className="relative bg-terracotta text-bg">
      <p className="mx-auto max-w-6xl px-10 py-2 text-center text-sm font-medium tracking-wide">
        🎉 {PROMO.headline}{" "}
        <span className="text-bg/80">· se aplica solo al pagar</span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso de promoción"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 hover:bg-black/10 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
