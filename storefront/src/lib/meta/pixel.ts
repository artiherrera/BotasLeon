/**
 * Cliente browser-only para el Meta Pixel. Funciona con el snippet base que
 * inyecta <MetaPixel> SOLO con consentimiento "all" (mismo patrón que Klaviyo:
 * el Pixel no tiene "consent mode", así que gateamos la carga completa).
 *
 * Todos los métodos son no-op si `fbq` no cargó (sin consentimiento o con ad
 * blocker) — fallamos en silencio para no romper la UX.
 *
 * Los `content_ids` se alinean con el catálogo de Meta sincronizado desde
 * Shopify: el catálogo usa el ID de variante como item y el ID de producto
 * como item_group. Por eso mandamos IDs numéricos (sin el prefijo GID) para
 * que el retargeting / anuncios dinámicos hagan match.
 */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1797797374966698"

type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/** Convierte "gid://shopify/ProductVariant/45151854100662" → "45151854100662". */
export function toContentId(gid: string): string {
  return gid.split("/").pop() ?? gid
}

export function pixelTrack(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  window.fbq("track", event, params)
}
