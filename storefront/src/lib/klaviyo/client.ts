/**
 * Cliente browser-only para Klaviyo. Funciona con el snippet onsite que
 * se carga en layout.tsx.
 *
 * - `identify(email, properties?)` — asocia visitante con un email (crea
 *   o actualiza el profile en Klaviyo). Hoy sin llamadas: quedó libre al
 *   retirar el newsletter, y es la pieza para cuando se capture email en
 *   checkout.
 * - `track(eventName, properties?)` — dispara un custom event en Klaviyo
 *   (útil para triggers de flows como Welcome, Browse abandonment, etc.)
 *
 * Todos los métodos son no-op si el snippet no cargó (ej. ad blocker)
 * — fallamos silenciosamente para no romper la UX del usuario.
 */

type KlaviyoQueue = {
  push: (args: [string, ...unknown[]]) => void
}

declare global {
  interface Window {
    klaviyo?: KlaviyoQueue
    _learnq?: KlaviyoQueue
  }
}

function getKlaviyo(): KlaviyoQueue | null {
  if (typeof window === "undefined") return null
  return window.klaviyo ?? window._learnq ?? null
}

export function identify(email: string, properties: Record<string, unknown> = {}) {
  const k = getKlaviyo()
  if (!k) return
  k.push(["identify", { $email: email, ...properties }])
}

export function track(eventName: string, properties: Record<string, unknown> = {}) {
  const k = getKlaviyo()
  if (!k) return
  k.push(["track", eventName, properties])
}
