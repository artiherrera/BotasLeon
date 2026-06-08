"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "botasleon:cookies-accepted"

/**
 * CookiesBanner — consentimiento LFPDPPP (Ley Federal de Protección de
 * Datos Personales en Posesión de los Particulares).
 *
 * Lógica:
 *  - Lee localStorage al montar. Si ya hay consent (cualquier valor),
 *    no muestra nada.
 *  - Si no hay consent, espera 1s antes de animar slide-up para no
 *    pelearse con el LCP.
 *  - Ambos botones persisten el valor ("all" | "necessary") y ocultan
 *    el banner.
 *
 * No bloqueamos scripts (Klaviyo) en base al consent porque la ley
 * mexicana solo exige aviso + opción, no opt-in estricto como GDPR.
 *
 * GA4 con Consent Mode v2: cuando el usuario acepta/declina, dispatcheamos
 * el evento `botasleon:consent-change` que GoogleAnalytics escucha para
 * promover analytics_storage a 'granted' o mantenerlo 'denied'.
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
      // localStorage puede fallar en Safari modo privado.
      // En ese caso mostramos el banner igual.
    }
    setHasConsent(false)
    const timer = window.setTimeout(() => setOpen(true), 1000)
    return () => window.clearTimeout(timer)
  }, [])

  function accept(value: "all" | "necessary") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignorar si localStorage no disponible
    }
    // Notifica a GoogleAnalytics + cualquier otro consumer del consent.
    // Custom event vs storage event: storage solo dispara entre tabs,
    // necesitamos uno que viaje en la misma pestaña.
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
      aria-label="Aviso de cookies"
      aria-live="polite"
      className={`fixed bottom-0 inset-x-0 z-40 bg-leather text-bg shadow-2xl transition-transform duration-500 ease-out ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          Usamos cookies para análisis y mejorar tu experiencia. Lee nuestro{" "}
          <Link
            href="/privacidad"
            className="underline underline-offset-2 hover:text-gold"
          >
            aviso de privacidad
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => accept("necessary")}
            className="px-4 py-2 border border-bg text-bg text-xs uppercase tracking-wider hover:bg-bg/10 transition-colors"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => accept("all")}
            className="px-4 py-2 bg-bg text-leather text-xs uppercase tracking-wider font-medium hover:bg-bg/90 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
