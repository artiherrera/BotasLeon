/**
 * Config + helpers para el botón de WhatsApp (soporte/dudas).
 *
 * El número va en formato wa.me: internacional, solo dígitos, sin `+` ni
 * espacios. México = 52 + 10 dígitos (ya no hace falta el 1 de móvil).
 * Configurable vía NEXT_PUBLIC_WHATSAPP_NUMBER, con fallback al número real
 * (es público por diseño — es un botón de contacto).
 */

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "524793032457"

// "Me interesa" convierte más que "duda" (pasivo) o "quiero comprar" (muy
// comprometido — espanta al que aún decide). La pregunta por talla+envío mueve
// hacia la venta y le da al vendedor lo que necesita para cerrar.
const GENERIC_MESSAGE =
  "¡Hola! 👋 Me interesan sus botas. ¿Me pueden ayudar con tallas, precios y envío?"

/**
 * Mensaje contextual para el PDP: incluye nombre + link de la bota para que
 * quien atiende el chat sepa de inmediato de qué producto se trata, y cierra
 * con la pregunta de talla+envío que empuja la conversión.
 */
export function productWhatsappMessage(title: string, url: string): string {
  return `¡Hola! 👋 Me interesa esta bota: ${title}\n${url}\n¿Tienen mi talla y cómo es el envío?`
}

/** Construye el link wa.me con el mensaje ya codificado. */
export function whatsappHref(message: string = GENERIC_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
