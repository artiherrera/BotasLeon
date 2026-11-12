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

import { isMX } from "@/lib/market"
import { PLAZO_ENTREGA } from "@/lib/entrega"
import { DIAS_AVISO_CAMBIO } from "@/lib/exchange"

/**
 * BILINGÜE (aditivo): question/answer se mantienen EN ESPAÑOL — los consume
 * FAQJsonLd, que emite structured data en español para SEO (no tocar). Los
 * campos questionEn/answerEn traen la versión en inglés; FAQAccordion elige
 * según el idioma activo (useLocale).
 *
 * DOS MERCADOS: el español se lee en botasleon.mx (pedido mexicano) y en
 * botasleon.com/es (pedido estadounidense), y las políticas difieren. Las
 * respuestas que dependen del mercado se eligen con `isMX` en tiempo de
 * build; lo que se emite como JSON-LD es lo que Google indexa, así que tiene
 * que coincidir con /envios y /devoluciones de ese mismo despliegue. En
 * EE.UU. no se promete envío gratis ni meses sin intereses; en México sí,
 * porque ahí lo son.
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
    // La CIFRA sale de lib/entrega.ts, que es de donde la toman también el
    // carrito, la ficha y la página de envíos. Esto es lo que Google indexa
    // (FAQJsonLd), así que tiene que decir lo mismo que el resto del sitio.
    answer: isMX
      ? `Envío gratis a toda la República: una vez despachado, tu pedido llega normalmente en ${PLAZO_ENTREGA.es} según el destino. El plazo empieza a contar desde que el paquete sale, no desde que confirmas la compra. Las piezas bajo pedido toman más tiempo; lo indicamos claramente en la página del producto.`
      : `Envíos a Estados Unidos: la entrega toma de ${PLAZO_ENTREGA.es} una vez despachado el pedido. El plazo empieza a contar desde que el paquete sale, no desde que confirmas la compra. Algunas piezas hechas a la medida pueden tomar 2-3 semanas adicionales; lo indicamos claramente en la página del producto.`,
    questionEn: "How long will my order take?",
    // También por mercado: en inglés este texto decía "Orders to the United
    // States" incluso en botasleon.mx/en, que vende dentro de México.
    answerEn: isMX
      ? `Free shipping anywhere in Mexico: once dispatched, your order normally arrives in ${PLAZO_ENTREGA.en} depending on the destination. Transit time starts when the package leaves, not when you place the order. Made-to-order pieces take longer, which we note clearly on the product page.`
      : `Orders to the United States arrive in ${PLAZO_ENTREGA.en} once dispatched. Transit time starts when the package leaves, not when you place the order. Some made-to-order pieces can take an additional 2-3 weeks, which we note clearly on the product page.`,
  },
  {
    question: "¿Aceptan cambios o devoluciones?",
    // POR MERCADO, NO POR IDIOMA, y aquí importa más que en ninguna otra
    // pregunta. El cambio de talla volvió el 2026-11-12 pero SOLO en México:
    // publicar la respuesta mexicana en el español de botasleon.com le
    // prometería a la diáspora un cambio que cruza la aduana dos veces y que
    // no vamos a hacer. Antes las dos respuestas eran la misma —la de venta
    // final— y por eso daba igual; ahora ya no da igual. Ese es el caso
    // real y vivo: botasleon.com/es existe y lo lee la diáspora.
    //
    // La rama de INGLÉS mexicano no se pinta hoy —la .mx publica solo
    // español y /en redirige con 308— y se escribe de todos modos, para que
    // la regla sea una sola y no haya que acordarse de esta el día que la
    // .mx publique inglés.
    answer: isMX
      ? `Aceptamos cambio de talla en los modelos que lo indican en su página, además de los cambios por defecto de fabricación o error en el envío. Avísanos dentro de ${DIAS_AVISO_CAMBIO} días naturales desde que te entregan el paquete: lo que vence en ese plazo es el aviso, no el cambio. Va 1 cambio por pedido, con la bota sin estrenar y en su empaque original; el envío de regreso lo paga el cliente y nosotros pagamos el de la talla nueva. No hacemos reembolsos de dinero por talla, color o modelo mal elegidos. Contamos con garantía de 15 días por defecto de fabricación confirmado.`
      : `Los pedidos con envío a Estados Unidos son venta final: no aceptamos devoluciones ni cambios de talla, porque el paquete cruzaría la aduana dos veces y los aranceles que ya pagaste a la entrada no se recuperan. Revisa la guía de tallas (mexicana en cm, estadounidense y europea) antes de comprar y escríbenos a contacto@botasleon.com si tienes dudas con tu talla. Si algo llega defectuoso o equivocado, escríbenos dentro de los 7 días siguientes a la entrega con fotos.`,
    questionEn: "Can I return or exchange my order?",
    answerEn: isMX
      ? `We accept size exchanges on the models that say so on their page, plus exchanges for manufacturing defects or a wrong item shipped. Tell us within ${DIAS_AVISO_CAMBIO} calendar days of delivery: what expires in that window is the notice, not the exchange. One exchange per order, unworn and in its original box; you cover return shipping and we cover shipping the new size. We don't refund money for the wrong size, color or model. Manufacturing defects are covered for 15 days.`
      : `Orders shipped to the United States are final sale — we don't offer returns or size exchanges, because the package would clear customs twice and the duties you already paid on the way in aren't refundable. Please check our size guide (Mexican cm, U.S., and EU) before ordering, and message us at contacto@botasleon.com if you're unsure about your size. If something arrives defective or incorrect, email us within 7 days of delivery with photos.`,
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
