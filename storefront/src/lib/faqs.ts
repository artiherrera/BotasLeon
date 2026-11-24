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
import {
  DIAS_AVISO_CAMBIO,
  DIAS_REEMBOLSO_BANCO,
  DIAS_RETRACTO,
  HAY_REEMBOLSO,
} from "@/lib/exchange"

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
    question: "¿Aceptan cambios de talla o devoluciones?",
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
    answer: HAY_REEMBOLSO
      ? `Sí, en todos nuestros modelos. Tienes ${DIAS_RETRACTO} días hábiles desde la entrega para cancelar la compra y recuperar tu dinero, sin darnos ningún motivo: es tu derecho por el artículo 56 de la Ley Federal de Protección al Consumidor y lo respetamos aunque hayas comprado en oferta. Y tienes ${DIAS_AVISO_CAMBIO} días naturales para pedir un cambio de talla, que aplica en el catálogo entero y ya no modelo por modelo, sujeto a existencias de tu talla en ese modelo: si no la tenemos, te ofrecemos otro modelo o un saldo a favor. En los dos casos la bota vuelve sin estrenar y en su empaque, y el envío de regreso corre por tu cuenta; en el cambio, nosotros pagamos el envío de la talla nueva. El reembolso sale al método con el que pagaste y puede tardar hasta ${DIAS_REEMBOLSO_BANCO} días hábiles en reflejarse, según tu banco. Además hay garantía de 15 días por defecto de fabricación confirmado, y ahí los envíos los pagamos nosotros.`
      : `Sí, cambio de talla en todos nuestros modelos: avísanos dentro de ${DIAS_AVISO_CAMBIO} días naturales desde la entrega. Lo que vence en ese plazo es el aviso, no el cambio, y está sujeto a existencias de tu talla en ese modelo: si no la tenemos, te ofrecemos otro modelo o un saldo a favor. Va 1 cambio por pedido, con la bota sin estrenar y en su empaque original; nosotros pagamos el envío de la talla nueva, pero el regreso desde Estados Unidos es un envío internacional de más de 100 dólares y lo paga el cliente, así que conviene escribirnos por WhatsApp antes de comprar. Lo que no hacemos en pedidos a Estados Unidos es devolver el dinero: el paquete cruzaría la aduana dos veces. Si algo llega defectuoso o equivocado, escríbenos dentro de los 7 días siguientes a la entrega con fotos.`,
    questionEn: "Can I return or exchange my order?",
    answerEn: HAY_REEMBOLSO
      ? `Yes, on every model we sell. You have ${DIAS_RETRACTO} business days from delivery to cancel the purchase and get your money back, with no reason needed: that is your right under article 56 of Mexico's consumer protection law and it applies even if you bought on sale. You also have ${DIAS_AVISO_CAMBIO} calendar days to request a size exchange, which now covers the whole catalog rather than model by model, subject to stock in your size for that model: if we don't have it, we'll offer another model or store credit. Either way the boots come back unworn and in their box, and return shipping is on you; on an exchange we pay to ship the new size. A refund goes back to whatever you paid with and can take up to ${DIAS_REEMBOLSO_BANCO} business days to show, depending on your bank. Confirmed manufacturing defects are covered for 15 days, and there we pay the shipping both ways.`
      : `Yes — size exchanges on every model we sell. Tell us within ${DIAS_AVISO_CAMBIO} calendar days of delivery; what expires in that window is the notice, not the exchange, and it is subject to stock in your size for that model: if we don't have it, we'll offer another model or store credit. One exchange per order, unworn and in its original box. We pay to ship the new size, but the return from the United States is an international shipment costing over $100 and the customer covers it, so it is worth messaging us on WhatsApp before you order. What we don't do on U.S. orders is refund money: the parcel would have to clear customs twice. If something arrives defective or incorrect, email us within 7 days of delivery with photos.`,
  },
  // ARANCELES — SOLO EN EL MERCADO AMERICANO. Se mete con un spread
  // condicional en vez de un `isMX` dentro de la respuesta porque en México
  // la pregunta misma no tiene sentido: ahí no hay aduana que cruzar, y una
  // respuesta del tipo "no aplica" en el acordeón y en el JSON-LD es peor que
  // no tener la pregunta. Lo que se emite como structured data tiene que
  // coincidir con /envios de ESE despliegue (ver la nota de arriba).
  //
  // La redacción dice lo que se promete Y lo que no: el arancel es 0 por el
  // T-MEC, pero la cuota de gestión de la paquetería y el impuesto estatal no
  // son aranceles. Esa distinción vive aquí y en /envios, no en la ficha:
  // quien llega a esta pregunta quiere el detalle, quien está viendo la bota
  // quiere saber si le van a cobrar al recibirla.
  ...(isMX
    ? []
    : [
        {
          question: "¿Tengo que pagar aranceles o impuestos de importación?",
          answer:
            "No. Nuestras botas se fabrican en León, Guanajuato, y una mercancía originaria de México entra a Estados Unidos libre de arancel bajo el T-MEC (USMCA). Cada pedido sale con su certificado de origen T-MEC, su factura comercial y la clasificación arancelaria del par, así que la documentación de aduana va completa desde que el paquete sale del taller. El Tax ID que te pedimos en el carrito es para esa entrada: el paquete se declara a tu nombre y la aduana no lo libera sin un número de contribuyente. Dos cosas que el T-MEC no cubre: la paquetería puede cobrar su propia cuota de gestión aduanal, y hay estados que cobran impuesto sobre la venta. Ninguno de los dos es un arancel y ninguno lo cobramos nosotros.",
          questionEn: "Will I have to pay tariffs or import duties?",
          answerEn:
            "No. Our boots are made in León, Guanajuato, and goods originating in Mexico enter the United States duty-free under the USMCA (T-MEC). Every order ships with its USMCA certificate of origin, its commercial invoice and the tariff classification for the pair, so the customs paperwork is complete before the parcel leaves the workshop. The Tax ID we ask for in the cart is for that entry: the parcel is declared in your name and customs won't release it without a taxpayer number. Two things the USMCA does not cover: the carrier may bill its own customs brokerage fee, and some states charge sales tax. Neither one is a tariff, and neither is charged by us.",
        },
      ]),
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
