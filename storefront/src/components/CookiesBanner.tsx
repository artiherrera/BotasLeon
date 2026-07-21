"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "botasleon:cookies-accepted"

/**
 * CookiesBanner — consentimiento LFPDPPP (Ley Federal de Protección de Datos
 * Personales en Posesión de los Particulares).
 *
 * Formato MODAL bloqueante (centrado + backdrop) en vez de barra al pie: es más
 * visible y sube la tasa de "Aceptar todas", lo que mejora la cobertura del
 * pixel/Klaviyo (que solo cargan con consent "all") y por lo tanto la medición
 * de AddToCart hacia Meta. "Aceptar todas" es el botón dominante; "Solo
 * necesarias" sigue disponible (la ley mexicana exige aviso + opción, no opt-in
 * estricto como GDPR, así que un modal con ambas opciones cumple).
 *
 * GA4 Consent Mode v2: al elegir, dispatcheamos `botasleon:consent-change` que
 * GoogleAnalytics escucha para promover analytics_storage.
 */
export function CookiesBanner() {
  // hasConsent === null mientras leemos localStorage (evita flash en SSR).
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHasConsent(true)
        return
      }
    } catch {
      // localStorage puede fallar en Safari modo privado; mostramos el modal.
    }
    setHasConsent(false)
    // Aparece rápido para no perder la decisión, pero deja respirar el LCP.
    const timer = window.setTimeout(() => setOpen(true), 500)
    return () => window.clearTimeout(timer)
  }, [])

  // Bloquea el scroll del body mientras el modal está abierto (más invasivo:
  // el usuario decide antes de seguir navegando).
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function accept(value: "all" | "necessary") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignorar si localStorage no disponible
    }
    // Notifica a GoogleAnalytics + cualquier otro consumer del consent. Custom
    // event (no storage) porque necesitamos que viaje en la misma pestaña.
    try {
      window.dispatchEvent(
        new CustomEvent("botasleon:consent-change", { detail: { value } })
      )
    } catch {
      // CustomEvent no soportado (navegadores muy viejos) — falla silencioso.
    }
    setOpen(false)
    setHasConsent(true)
  }

  if (hasConsent !== false) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aviso de cookies"
      className={`fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop — atenúa y bloquea la página detrás. */}
      <div aria-hidden className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Tarjeta */}
      <div
        className={`relative w-full max-w-md bg-bg text-text rounded-lg shadow-2xl border border-border p-6 sm:p-8 transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-4"
        }`}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leather text-bg">
            <CookieIcon />
          </span>
          <h2 className="font-heading text-lg text-text">Usamos cookies 🍪</h2>
        </div>

        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Nos ayudan a mostrarte mejores botas, recordar tu carrito y mejorar la
          tienda. Al aceptar todas, nos das una mano para seguir mejorando tu
          experiencia. Lee nuestro{" "}
          <Link
            href="/privacidad"
            className="underline underline-offset-2 text-leather hover:text-terracotta"
          >
            aviso de privacidad
          </Link>
          .
        </p>

        {/* "Aceptar todas" es el CTA dominante. */}
        <button
          type="button"
          onClick={() => accept("all")}
          className="block w-full py-3.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider font-medium hover:bg-text transition-colors"
        >
          Aceptar todas las cookies
        </button>

        {/* Opción secundaria, discreta pero presente (cumple LFPDPPP). */}
        <button
          type="button"
          onClick={() => accept("necessary")}
          className="block w-full mt-3 text-xs uppercase tracking-wider text-text-subtle hover:text-text transition-colors"
        >
          Solo las necesarias
        </button>
      </div>
    </div>
  )
}

function CookieIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" />
      <path d="M16 15.5v.01" />
      <path d="M12 12v.01" />
      <path d="M11 17v.01" />
      <path d="M7 14v.01" />
    </svg>
  )
}
