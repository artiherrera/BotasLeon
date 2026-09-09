"use client"

import { useSyncExternalStore } from "react"
import Script from "next/script"
import { hayConsentimiento } from "@/lib/consentimiento"

/**
 * KlaviyoLoader — carga el snippet onsite de Klaviyo SOLO con consentimiento.
 *
 * A diferencia de GA (que usa Consent Mode y carga siempre), Klaviyo no tiene
 * modo de consentimiento, así que directamente NO inyectamos el script hasta
 * que el usuario acepta "todas" en el CookiesBanner. Como `track`/`identify`
 * del cliente Klaviyo son no-op sin el snippet, gatear la carga aquí también
 * apaga el tracking onsite (ProductViewedTracker, etc.) sin consentimiento.
 *
 * Usa useSyncExternalStore para sincronizar con localStorage + el evento
 * `botasleon:consent-change` sin setState-en-effect.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY

function subscribe(onChange: () => void) {
  window.addEventListener("botasleon:consent-change", onChange)
  // `storage` cubre el cambio de consentimiento hecho en otra pestaña.
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener("botasleon:consent-change", onChange)
    window.removeEventListener("storage", onChange)
  }
}

// El permiso lo decide lib/consentimiento: en el mercado sin banner devuelve
// true, porque no hay a quién preguntarle.
const isAllowed = hayConsentimiento

export function KlaviyoLoader() {
  // getServerSnapshot = false: en SSR no hay consentimiento todavía.
  const allowed = useSyncExternalStore(subscribe, isAllowed, () => false)

  if (!PUBLIC_KEY || !allowed) return null

  return (
    <Script
      id="klaviyo-onsite"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${PUBLIC_KEY}`}
      strategy="lazyOnload"
    />
  )
}
