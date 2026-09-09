import { isMX } from "@/lib/market"

/** Dónde se guarda la respuesta. La leen Klaviyo, el pixel y Analytics. */
export const CLAVE_CONSENTIMIENTO = "botasleon:cookies-accepted"

/** Evento en la misma pestaña: `storage` solo avisa a las OTRAS pestañas. */
export const EVENTO_CONSENTIMIENTO = "botasleon:consent-change"

/**
 * ¿Este mercado pide permiso antes de medir?
 *
 * México sí: la LFPDPPP exige aviso y opción, y el aviso se da en una barra al
 * pie con dos botones. No exige opt-in estricto como el RGPD, así que la barra
 * cumple sin bloquear la navegación.
 *
 * Estados Unidos no. Allá no hay ley federal de consentimiento previo, así que
 * un banner solo resta: interrumpe al comprador y, si no lo acepta, apaga el
 * pixel con el que está optimizada la campaña de Meta.
 *
 * OJO, lo que sí aplica en Estados Unidos: California (CPRA) pide un enlace
 * "Do Not Sell or Share My Personal Information" cuando se comparten datos
 * para publicidad dirigida —y el pixel de Meta cuenta como eso—. No es un
 * banner de consentimiento, es un enlace en el pie. Hoy no está; conviene
 * ponerlo antes de anunciar fuerte en California.
 */
export const PIDE_CONSENTIMIENTO = isMX

/**
 * ¿Se puede medir? Solo en el navegador.
 *
 * En el mercado que no pide permiso devuelve true siempre: si no hay a quién
 * preguntarle, esperar una respuesta que nunca llega dejaría el sitio sin
 * medición ninguna.
 */
export function hayConsentimiento(): boolean {
  if (!PIDE_CONSENTIMIENTO) return true
  try {
    return window.localStorage.getItem(CLAVE_CONSENTIMIENTO) === "all"
  } catch {
    // Safari en modo privado puede negar localStorage: sin respuesta, no se mide.
    return false
  }
}
