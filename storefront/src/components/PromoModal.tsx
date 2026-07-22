"use client"

import { useEffect, useState } from "react"
import { PROMO } from "@/lib/promo"
import { setPendingDiscount } from "@/lib/discount/client"

/**
 * PromoModal — ventana emergente de la promo temporal + auto-aplicación a TODOS.
 *
 * - Al cargar, siembra el código de la promo como "pendiente" en localStorage;
 *   el CartDrawer lo valida y aplica solo (misma mecánica del link mágico). Esto
 *   corre SIEMPRE, aunque la ventana ya se haya cerrado.
 * - La ventana (estilo modal, como el de cookies) se muestra UNA vez por sesión
 *   y solo DESPUÉS de que el usuario resolvió el aviso de cookies, para no
 *   encimarse con él.
 *
 * Para apagar todo: PROMO.active = false en @/lib/promo.
 */
const CONSENT_KEY = "botasleon:cookies-accepted"
const DISMISS_KEY = "botasleon:promo-seen"

export function PromoModal() {
  const [open, setOpen] = useState(false)

  // Siembra el código para TODOS (corre aunque la ventana no se muestre).
  useEffect(() => {
    if (!PROMO.active || !PROMO.code) return
    setPendingDiscount(PROMO.code)
  }, [])

  // Muestra la ventana una vez por sesión, después del aviso de cookies.
  useEffect(() => {
    if (!PROMO.active) return
    try {
      if (sessionStorage.getItem(`${DISMISS_KEY}:${PROMO.code}`) === "1") return
    } catch {}

    let timer: ReturnType<typeof setTimeout>
    const reveal = () => {
      timer = setTimeout(() => setOpen(true), 700)
    }

    // ¿Ya decidió cookies? Muéstrala pronto; si no, espera a que decida.
    let hasConsent = false
    try {
      hasConsent = !!localStorage.getItem(CONSENT_KEY)
    } catch {}

    if (hasConsent) {
      reveal()
      return () => clearTimeout(timer)
    }
    const onConsent = () => reveal()
    window.addEventListener("botasleon:consent-change", onConsent, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener("botasleon:consent-change", onConsent)
    }
  }, [])

  // Bloquea el scroll mientras la ventana está abierta.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const close = () => {
    try {
      sessionStorage.setItem(`${DISMISS_KEY}:${PROMO.code}`, "1")
    } catch {}
    setOpen(false)
  }

  if (!PROMO.active || !open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Promoción de inauguración"
      className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center p-4"
    >
      {/* Backdrop — clic para cerrar. */}
      <button
        type="button"
        aria-label="Cerrar promoción"
        onClick={close}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />

      {/* Tarjeta */}
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-bg text-text shadow-2xl">
        {/* Cabecera de color con el gancho del descuento. */}
        <div className="relative bg-terracotta text-bg px-6 pt-7 pb-6 text-center">
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-2 top-2 rounded p-1.5 text-bg/90 hover:bg-black/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="eyebrow text-gold mb-2">{PROMO.eyebrow}</p>
          <p className="font-display text-5xl leading-none">15%</p>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-bg/90">
            de descuento
          </p>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-6 text-center">
          <h2 className="font-heading text-xl text-text mb-2">{PROMO.title}</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            {PROMO.message}
          </p>

          {/* Solo cierra y deja al usuario donde estaba (menos rebote). El 15%
              ya se auto-aplicó; la ventana solo informa. */}
          <button
            type="button"
            onClick={close}
            className="block w-full py-3.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider font-medium hover:bg-text transition-colors"
          >
            {PROMO.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
