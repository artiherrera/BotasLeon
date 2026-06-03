/**
 * FAQs — data plana usada tanto por FAQAccordion (client) como por
 * FAQJsonLd (server JSON-LD).
 *
 * Vive aquí (no en FAQAccordion.tsx) porque ese archivo es "use client",
 * y cuando un server component como app/page.tsx importa un valor
 * exportado desde un módulo client, Next 16 RSC lo serializa de forma
 * que no preserva el array (rompe FAQJsonLd con "items.map is not a
 * function" en prerender). Mantener la data en un módulo plano evita
 * ese cruce de boundary RSC.
 */

export type FAQ = {
  question: string
  answer: string
}

export const FAQS: FAQ[] = [
  {
    question: "¿Las botas son hechas en México?",
    answer:
      "Sí. Todas las botas que comercializamos son fabricadas en León, Guanajuato — la capital mundial del cuero. Trabajamos directamente con talleres locales, muchos con tres generaciones de experiencia. No vendemos imitaciones ni botas importadas de Asia.",
  },
  {
    question: "¿Qué tipo de piel utilizan?",
    answer:
      "Cada bota lleva piel genuina de origen vacuno como base. Para colecciones exóticas (cocodrilo, avestruz, pitón) trabajamos solo con proveedores certificados que cumplen regulaciones CITES de comercio responsable. La descripción de cada producto indica el tipo exacto de piel.",
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer:
      "Envíos dentro de México: 3-5 días hábiles. Envíos a Estados Unidos: 7-10 días hábiles. Algunas piezas hechas a la medida pueden tomar 2-3 semanas adicionales; lo indicamos claramente en la página del producto.",
  },
  {
    question: "¿Puedo cambiar la talla si no me queda?",
    answer:
      "Sí. Tienes 30 días desde que recibes tu bota para solicitar cambio de talla sin costo, dentro de México. La bota debe estar sin uso, sin marcas, en su caja original. Para envíos internacionales aplica una tarifa logística reducida.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Tarjetas de crédito y débito (Visa, MasterCard, Amex), Mercado Pago, OXXO, SPEI, transferencia bancaria, y meses sin intereses con bancos participantes. En USA aceptamos también Apple Pay y Shop Pay.",
  },
  {
    question: "¿Trabajan con distribuidores o mayoristas?",
    answer:
      "Sí. Si tienes una tienda física o un proyecto de reventa, escríbenos a hola@botasleon.com con los detalles. Manejamos precios mayoristas a partir de cierto volumen mínimo y enviamos catálogo completo bajo NDA.",
  },
]
