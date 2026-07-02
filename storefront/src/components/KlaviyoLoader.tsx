"use client"

import { useSyncExternalStore } from "react"
import Script from "next/script"

/**
 * KlaviyoLoader — carga el snippet onsite de Klaviyo SOLO con consentimiento.
 *
 * A diferencia de GA (que usa Consent Mode y carga siempre), Klaviyo no tiene
 * modo de consentimiento, así que directamente NO inyectamos el script hasta
 * que el usuario acepta "todas" en el CookiesBanner. Como `track`/`identify`
 * del cliente Klaviyo son no-op sin el snippet, gatear la carga aquí también
 * apaga el tracking onsite (ProductViewedTracker, etc.) sin consentimiento.
 *
 * El newsletter (`subscribe`) usa fetch directo a la API pública de Klaviyo,
 * no el snippet, así que sigue funcionando: ahí el consentimiento es explícito
 * (el usuario tecleó su email y pulsó "Suscribirme").
 *
 * Usa useSyncExternalStore para sincronizar con localStorage + el evento
 * `botasleon:consent-change` sin setState-en-effect.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY
const CONSENT_KEY = "botasleon:cookies-accepted"

function subscribe(onChange: () => void) {
  window.addEventListener("botasleon:consent-change", onChange)
  // `storage` cubre el cambio de consentimiento hecho en otra pestaña.
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener("botasleon:consent-change", onChange)
    window.removeEventListener("storage", onChange)
  }
}

function isAllowed(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "all"
  } catch {
    return false
  }
}

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
