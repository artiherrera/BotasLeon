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
  success: "bg-emerald-700 text-white",
  error: "bg-terracotta-dark text-white",
  info: "bg-leather text-bg",
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
    // Limpia el snapshot tras el slide-out (ver duration-300 abajo)
    const t = setTimeout(() => setSnapshot(null), 300)
    return () => clearTimeout(t)
  }, [toast])

  if (!snapshot) return null

  const variant = snapshot.variant ?? "info"

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-[60] max-w-sm px-4 py-3 shadow-2xl text-sm leading-snug transition-all duration-300 ${
        VARIANT_CLASSES[variant]
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none"}`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {snapshot.msg}
    </div>
  )
}
