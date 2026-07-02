/**
 * Config + helpers para el botón de WhatsApp (soporte/dudas).
 *
 * El número va en formato wa.me: internacional, solo dígitos, sin `+` ni
 * espacios. México = 52 + 10 dígitos (ya no hace falta el 1 de móvil).
 * Configurable vía NEXT_PUBLIC_WHATSAPP_NUMBER, con fallback al número real
 * (es público por diseño — es un botón de contacto).
 */

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "524777608064"

const GENERIC_MESSAGE = "¡Hola! 👋 Tengo una duda sobre las botas de BotasLeón."

/**
 * Mensaje contextual para el PDP: incluye nombre + link de la bota para que
 * quien atiende el chat sepa de inmediato de qué producto se trata.
 */
export function productWhatsappMessage(title: string, url: string): string {
  return `¡Hola! 👋 Tengo una duda sobre estas botas: ${title}\n${url}`
}

/** Construye el link wa.me con el mensaje ya codificado. */
export function whatsappHref(message: string = GENERIC_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
