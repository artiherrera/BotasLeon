/**
 * Eventos de e-commerce para GA4 (gtag). Complementan el `page_view` que
 * dispara <GoogleAnalytics>. GA4 usa Consent Mode v2 (el script carga siempre
 * y el consentimiento gobierna el USO del dato, no el envío), así que estos
 * eventos pueden dispararse sin gatear la carga — a diferencia de Klaviyo/Meta.
 *
 * No-op si `gtag` aún no está definido (carga afterInteractive). Sigue el
 * esquema de e-commerce recomendado por GA4: currency + value + items[].
 */

export type GaItem = {
  item_id: string
  item_name: string
  item_brand?: string
  price?: number
  quantity?: number
}

export function gaEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", name, params)
}
