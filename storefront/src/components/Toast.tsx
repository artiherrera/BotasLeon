"use client"

import { useEffect, useState } from "react"
import { useCart } from "./CartProvider"

/**
 * Toast — banner fijo bottom-right que renderiza el estado `toast`
 * del CartProvider.
 *
 * Se monta una sola vez en layout.tsx, dentro del CartProvider. Mientras
 * `toast` es null no renderiza nada. Cuando llega un mensaje, anima
 * slide-in desde la derecha. El CartProvider se encarga de auto-limpiar
 * a los 3s, aquí solo escuchamos.
 */

const VARIANT_CLASSES: Record<"success" | "error" | "info", string> = {
  success: "bg-text text-bg",
  error: "bg-bg-alt text-text border border-text border-l-4 font-semibold",
  info: "bg-text text-bg",
}

export function Toast() {
  const { toast } = useCart()
  // Mantén el último mensaje un beat extra mientras animamos fuera
  const [visible, setVisible] = useState(false)
  const [snapshot, setSnapshot] = useState<typeof toast>(null)

  useEffect(() => {
    if (toast) {
      setSnapshot(toast)
      // microtask para que el transition arranque desde estado oculto
      requestAnimationFrame(() => setVisible(true))
      return
    }
    setVisible(false)
    // Limpia el snapshot tras el slide-out (la animación dura 180ms; el margen
    // extra evita que desaparezca a media transición)
    const t = setTimeout(() => setSnapshot(null), 300)
    return () => clearTimeout(t)
  }, [toast])

  if (!snapshot) return null

  const variant = snapshot.variant ?? "info"

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 right-4 md:right-6 z-[60] max-w-sm px-4 py-3 cuerpo leading-snug transition-all duration-[180ms] motion-reduce:transition-none ${
        VARIANT_CLASSES[variant]
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none"}`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {snapshot.msg}
    </div>
  )
}
