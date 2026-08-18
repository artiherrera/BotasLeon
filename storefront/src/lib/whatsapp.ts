/**
 * Config + helpers para los enlaces de WhatsApp (soporte/dudas).
 *
 * NO hay botón flotante: se retiró porque competía con el CTA de compra y la
 * gente escribía en vez de comprar. WhatsApp vive ahora solo donde el visitante
 * lo busca a propósito: footer, /contacto y el CTA de agendar visita.
 *
 * El número va en formato wa.me: internacional, solo dígitos, sin `+` ni
 * espacios. México = 52 + 10 dígitos (ya no hace falta el 1 de móvil).
 * Configurable vía NEXT_PUBLIC_WHATSAPP_NUMBER, con fallback al número real
 * (es público por diseño — es un botón de contacto).
 *
 * Los MENSAJES precargados van en el idioma del sitio (ES/EN): el visitante
 * gringo no debe llegar al chat con un texto en español que no escribió. Cada
 * llamada recibe el locale explícito para que TypeScript no deje pasar ningún
 * enlace sin idioma.
 */

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "524793032457"

type Message = Record<Locale, string>

/** Elige la variante del idioma; si llega algo raro, cae al idioma por defecto. */
function pick(message: Message, locale: Locale): string {
  return message[locale] ?? message[DEFAULT_LOCALE]
}

// "Me interesa" convierte más que "duda" (pasivo) o "quiero comprar" (muy
// comprometido — espanta al que aún decide). La pregunta por talla+envío mueve
// hacia la venta y le da al vendedor lo que necesita para cerrar.
const GENERIC_MESSAGE: Message = {
  es: "¡Hola! 👋 Me interesan sus botas. ¿Me pueden ayudar con tallas, precios y envío?",
  en: "Hi! 👋 I'm interested in your boots. Could you help me with sizing, prices and shipping to the US?",
}

/** Mensaje genérico (footer y página de contacto) en el idioma del sitio. */
export function genericWhatsappMessage(locale: Locale): string {
  return pick(GENERIC_MESSAGE, locale)
}

/** Mensaje del CTA "agendar visita" de /visitanos (tienda física en León). */
export function storeVisitWhatsappMessage(locale: Locale): string {
  return pick(
    {
      es: "¡Hola! 👋 Me gustaría agendar una visita a su tienda en León para ver y probarme sus botas. ¿Qué día y horario me recomiendan?",
      en: "Hi! 👋 I'd like to visit your store in León to see and try on your boots. What day and time would you recommend?",
    },
    locale
  )
}

/**
 * Construye el link wa.me con el mensaje ya codificado. Sin `message` usa el
 * genérico del idioma indicado.
 */
export function whatsappHref(locale: Locale, message?: string): string {
  const text = message ?? genericWhatsappMessage(locale)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
