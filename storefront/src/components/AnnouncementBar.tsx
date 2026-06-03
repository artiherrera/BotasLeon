"use client"

import { useEffect, useState } from "react"

/**
 * AnnouncementBar — barra slim de promo arriba de TODA la página.
 *
 * Captura email/atención de quien entra. Dismissible con localStorage
 * (no vuelve a aparecer una vez cerrado en ese device). Acción default:
 * scroll suave al form Newsletter del home, o nav directo a /products
 * si no estamos en home (link funciona en cualquier ruta).
 *
 * Click en el mensaje → scroll suave a #newsletter (si la sección existe
 * en la página actual) o nav a /?scroll=newsletter (no implementado —
 * por ahora solo scroll en home; otras rutas el click no hace nada
 * visible pero igual oculta la barra al "cerrar").
 */

const STORAGE_KEY = "botasleon:announcement-dismissed"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {}
    setDismissed(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Scroll a newsletter section si existe en la página actual.
    const el = document.getElementById("newsletter")
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // Mientras hidrata, NO render — evita flash que luego se oculta.
  if (dismissed !== false) return null

  return (
    <div
      role="region"
      aria-label="Promoción de bienvenida"
      className="bg-leather text-bg relative"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-2 md:py-2.5 flex items-center justify-center gap-3">
        <a
          href="/#newsletter"
          onClick={handleClick}
          className="flex-1 text-center text-[12px] md:text-sm tracking-wide hover:text-gold transition-colors"
        >
          <span className="hidden sm:inline">🎁 </span>
          Suscríbete y recibe{" "}
          <span className="font-semibold text-gold">10% en tu primera compra</span>{" "}
          <span className="hidden md:inline">— sin spam, prometido</span>
          <span aria-hidden className="ml-2">→</span>
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar promoción"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-bg/10 rounded transition-colors text-bg/80 hover:text-bg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
