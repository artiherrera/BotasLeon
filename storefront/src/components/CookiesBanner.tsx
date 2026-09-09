"use client"

import { useEffect, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"

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
  const t = useT()
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
      aria-label={t("cookies.dialogLabel")}
      className={`fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4 transition-opacity duration-[180ms] ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop — atenúa y bloquea la página detrás. */}
      <div aria-hidden className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Tarjeta */}
      <div
        className={`relative w-full max-w-md bg-bg text-text rounded-lg border border-border p-6 sm:p-8 transition-transform duration-[180ms] ${
          open ? "translate-y-0" : "translate-y-4"
        }`}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-text text-bg">
            <CookieIcon />
          </span>
          {/* Un modal es interfaz, no un titular: el título va en sans 500, no
              en la serif de display. */}
          <h2 className="font-body font-medium text-base text-text">{t("cookies.title")}</h2>
        </div>

        <p className="cuerpo text-text-muted mb-6">
          {t("cookies.body")}{" "}
          <Link
            href="/privacidad"
            className="text-leather underline underline-offset-4 hover:no-underline"
          >
            {t("cookies.privacyLink")}
          </Link>
          .
        </p>

        {/* "Aceptar todas" es el CTA dominante. */}
        <button
          type="button"
          onClick={() => accept("all")}
          className="btn flex w-full"
        >
          {t("cookies.acceptAll")}
        </button>

        {/* Opción secundaria, discreta pero presente (cumple LFPDPPP). */}
        <button
          type="button"
          onClick={() => accept("necessary")}
          className="btn btn-ter flex w-full mt-3 py-4"
        >
          {t("cookies.necessary")}
        </button>
      </div>
    </div>
  )
}

function CookieIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" />
      <path d="M16 15.5v.01" />
      <path d="M12 12v.01" />
      <path d="M11 17v.01" />
      <path d="M7 14v.01" />
    </svg>
  )
}
