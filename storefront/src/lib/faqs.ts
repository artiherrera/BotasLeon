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

/**
 * BILINGÜE (aditivo): question/answer se mantienen EN ESPAÑOL — los consume
 * FAQJsonLd, que emite structured data en español para SEO (no tocar). Los
 * campos questionEn/answerEn traen la versión en inglés; FAQAccordion elige
 * según el idioma activo (useLocale). Público EN = Estados Unidos: sin promesas
 * de envío gratis, sin "meses sin intereses".
 */
export type FAQ = {
  question: string
  answer: string
  questionEn: string
  answerEn: string
}

export const FAQS: FAQ[] = [
  {
    question: "¿Las botas son hechas en México?",
    answer:
      "Sí. Todas las botas que comercializamos son fabricadas en León, Guanajuato — la capital mundial del cuero. Trabajamos directamente con talleres locales, muchos con tres generaciones de experiencia. No vendemos imitaciones ni botas importadas de Asia.",
    questionEn: "Are the boots made in Mexico?",
    answerEn:
      "Yes. Every boot we sell is made in León, Guanajuato — the world capital of leather. We work directly with local workshops, many with three generations of experience. We never sell imitations or boots imported from Asia.",
  },
  {
    question: "¿Qué tipo de piel utilizan?",
    answer:
      "Cada bota lleva piel genuina de origen vacuno como base. Para colecciones exóticas (cocodrilo, avestruz, pitón) trabajamos solo con proveedores certificados que cumplen regulaciones CITES de comercio responsable. La descripción de cada producto indica el tipo exacto de piel.",
    questionEn: "What kind of leather do you use?",
    answerEn:
      "Every boot is built on genuine cowhide as its base. For exotic collections (crocodile, ostrich, python) we work only with certified suppliers that comply with CITES responsible-trade regulations. Each product description lists the exact type of leather.",
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer:
      "Envíos a Estados Unidos: 7-10 días hábiles. Algunas piezas hechas a la medida pueden tomar 2-3 semanas adicionales; lo indicamos claramente en la página del producto.",
    questionEn: "How long will my order take?",
    answerEn:
      "Orders to the United States typically arrive within 7-10 business days. Some made-to-order pieces can take an additional 2-3 weeks, which we note clearly on the product page.",
  },
  {
    question: "¿Aceptan cambios o devoluciones?",
    answer:
      "Solo aceptamos cambios por defecto de fabricación o error en el envío: 1 cambio por pedido, dentro de 7 días naturales, con el producto sin uso y en su empaque original. No hacemos reembolsos por talla, color o modelo mal elegidos, así que te recomendamos revisar la guía de tallas y escribirnos por WhatsApp si tienes dudas antes de comprar. Contamos con garantía de 15 días por defecto de fabricación confirmado.",
    questionEn: "Can I return or exchange my order?",
    answerEn:
      "Orders shipped to the United States are final sale — we don't offer returns or size exchanges. Please check our size guide (Mexican cm, U.S., and EU) before ordering, and message us at contacto@botasleon.com if you're unsure about your size.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Tarjetas de crédito y débito (Visa, MasterCard, Amex), Apple Pay y Shop Pay.",
    questionEn: "What payment methods do you accept?",
    answerEn:
      "Credit and debit cards (Visa, MasterCard, Amex), Apple Pay, and Shop Pay.",
  },
  {
    question: "¿Trabajan con distribuidores o mayoristas?",
    answer:
      "Sí. Si tienes una tienda física o un proyecto de reventa, escríbenos a contacto@botasleon.com con los detalles. Manejamos precios mayoristas a partir de cierto volumen mínimo y enviamos catálogo completo bajo NDA.",
    questionEn: "Do you work with distributors or wholesalers?",
    answerEn:
      "Yes. If you run a brick-and-mortar store or a resale project, email us at contacto@botasleon.com with the details. We offer wholesale pricing above a minimum order volume and share our full catalog under NDA.",
  },
]
