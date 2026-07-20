"use client"

import { useState } from "react"
import { FAQS } from "@/lib/faqs"

// Re-export para compatibilidad con imports existentes.
// La data canónica vive en @/lib/faqs (módulo plano sin "use client")
// para evitar problemas de RSC boundary al cruzarla a server components.
export { FAQS } from "@/lib/faqs"
export type { FAQ } from "@/lib/faqs"

/**
 * FAQAccordion — sección de preguntas frecuentes en el home.
 *
 * Patrón estándar: acordeón vertical, una pregunta abierta a la vez.
 * Click expande/colapsa. Iconos +/- para affordance visual.
 */

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
            href="mailto:contacto@botasleon.com"
            className="text-leather hover:text-terracotta transition-colors font-medium"
          >
            Escríbenos
          </a>
        </p>
      </div>
    </section>
  )
}
