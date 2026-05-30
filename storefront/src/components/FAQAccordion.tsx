"use client"

import { useState } from "react"

/**
 * FAQAccordion — sección de preguntas frecuentes en el home.
 *
 * Patrón estándar: acordeón vertical, una pregunta abierta a la vez.
 * Click expande/colapsa. Iconos +/- para affordance visual.
 *
 * Las 6 preguntas están elegidas para responder las dudas más comunes
 * antes de la compra (origen, materiales, envíos, cambios) — reducen
 * fricción y aumentan conversión.
 */

type FAQ = {
  question: string
  answer: string
}

const FAQS: FAQ[] = [
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

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="bg-bg-alt py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <p className="eyebrow text-leather mb-3">Antes de comprar</p>
          <h2 className="font-heading text-3xl md:text-4xl text-text">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((faq, idx) => {
            const isOpen = idx === openIdx
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 py-6 text-left group"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <h3 className="font-heading text-lg md:text-xl text-text group-hover:text-leather transition-colors">
                    {faq.question}
                  </h3>
                  <span
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-leather transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  className={`grid transition-all duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 pb-6"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-text-muted leading-relaxed pr-8">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-text-muted mt-10">
          ¿Tu duda no está aquí?{" "}
          <a
            href="mailto:hola@botasleon.com"
            className="text-leather hover:text-terracotta transition-colors font-medium"
          >
            Escríbenos
          </a>
        </p>
      </div>
    </section>
  )
}
