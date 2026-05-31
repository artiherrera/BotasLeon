/**
 * Cliente browser-only para Klaviyo. Funciona con el snippet onsite que
 * se carga en layout.tsx.
 *
 * - `identify(email, properties?)` — asocia visitante con un email (crea
 *   o actualiza el profile en Klaviyo)
 * - `track(eventName, properties?)` — dispara un custom event en Klaviyo
 *   (útil para triggers de flows como Welcome, Browse abandonment, etc.)
 * - `subscribe(email)` — llama al endpoint público Client Subscriptions API
 *   para que el email entre como "subscribed to email" (no solo profile)
 *
 * Todos los métodos son no-op si el snippet no cargó (ej. ad blocker)
 * — fallamos silenciosamente para no romper la UX del usuario.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY

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

/**
 * Suscribe email a Klaviyo via Client Subscriptions API (público).
 * No requiere list_id — el email queda como subscribed y queda elegible
 * para cualquier Flow trigger "Profile subscribed to email marketing".
 *
 * Si quieres agregarlo a una list específica, configura un Flow en
 * Klaviyo con trigger "Subscribed to Email Marketing" → action "Add to List".
 */
export async function subscribe(email: string): Promise<void> {
  if (!PUBLIC_KEY) throw new Error("Klaviyo public key no configurado")
  const res = await fetch(
    `https://a.klaviyo.com/client/subscriptions/?company_id=${PUBLIC_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        revision: "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "subscription",
          attributes: {
            custom_source: "BotasLeón Newsletter",
            profile: {
              data: {
                type: "profile",
                attributes: { email },
              },
            },
          },
        },
      }),
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Klaviyo subscribe falló (HTTP ${res.status}): ${text}`)
  }
}
