/**
 * Cliente browser-only para el Meta Pixel. Funciona con el snippet base que
 * inyecta <MetaPixel> SOLO con consentimiento "all" (mismo patrón que Klaviyo:
 * el Pixel no tiene "consent mode", así que gateamos la carga completa).
 *
 * Todos los métodos son no-op si `fbq` no cargó (sin consentimiento o con ad
 * blocker) — fallamos en silencio para no romper la UX.
 *
 * PERO "TODAVÍA NO CARGÓ" NO ES "NO CARGÓ". Medido en producción el
 * 2026-09-16: en una carga completa de la ficha —que es exactamente lo que
 * hace quien llega desde un anuncio— el efecto que dispara ViewContent corre
 * al hidratar, y el snippet del Pixel (<Script afterInteractive>) todavía no
 * ha corrido; `fbq` no existía, y el evento se tiraba en silencio. En
 * navegación interna sí salía, porque ahí el Pixel ya estaba. Resultado:
 * PageView y AddToCart llegaban a Meta, ViewContent casi nunca — y ViewContent
 * es el que alimenta el catálogo dinámico y el retargeting.
 *
 * Por eso, si `fbq` aún no existe, el evento se ENCOLA en window.__blPixelCola
 * y <MetaPixel> la vacía justo después de `fbq('init')`. Solo se encola con
 * consentimiento: sin permiso no se guarda nada, ni para después.
 *
 * Los `content_ids` se alinean con el catálogo de Meta sincronizado desde
 * Shopify: el catálogo usa el ID de variante como item y el ID de producto
 * como item_group. Por eso mandamos IDs numéricos (sin el prefijo GID) para
 * que el retargeting / anuncios dinámicos hagan match.
 */

import { hayConsentimiento } from "@/lib/consentimiento"

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1797797374966698"

type Fbq = (...args: unknown[]) => void

type EventoPendiente = [string, Record<string, unknown> | undefined]

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
    /** Eventos disparados antes de que el snippet del Pixel corriera. */
    __blPixelCola?: EventoPendiente[]
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
  if (typeof window === "undefined") return
  if (typeof window.fbq === "function") {
    window.fbq("track", event, params)
    return
  }
  if (!hayConsentimiento()) return
  ;(window.__blPixelCola ??= []).push([event, params])
}
