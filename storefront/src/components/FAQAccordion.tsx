"use client"

import { useState } from "react"
import { FAQS } from "@/lib/faqs"
import { useLocale } from "@/lib/i18n/context"

// Re-export para compatibilidad con imports existentes.
// La data canónica vive en @/lib/faqs (módulo plano sin "use client")
// para evitar problemas de RSC boundary al cruzarla a server components.
export { FAQS } from "@/lib/faqs"
export type { FAQ } from "@/lib/faqs"

/**
 * FAQAccordion — preguntas frecuentes de la portada.
 *
 * Se queda en el home a propósito: el <FAQJsonLd> de la página declara estas
 * mismas preguntas a Google, y datos estructurados sin el contenido a la vista
 * es justo lo que se penaliza.
 *
 * Patrón estándar: acordeón vertical, una pregunta abierta a la vez. La
 * pregunta va en sans de 15px (.acordeon-fila), no en serif: repetida siete
 * veces seguidas, la serif deja de leerse como jerarquía y se vuelve textura.
 */

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const { locale, t } = useLocale()
  const isEn = locale === "en"

  return (
    <section className="contenedor seccion">
      <div className="max-w-3xl">
        <div className="mb-8 border-b border-border pb-4">
          <p className="eyebrow text-text-muted mb-2">{t("faq.home.eyebrow")}</p>
          <h2 className="display-m">{t("faq.home.title")}</h2>
        </div>

        <div className="border-t border-border">
          {FAQS.map((faq, idx) => {
            const isOpen = idx === openIdx
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="acordeon-fila cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <h3 className="cuerpo font-medium">
                    {isEn ? faq.questionEn : faq.question}
                  </h3>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center text-text transition-transform duration-[180ms] ${
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
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  className={`grid transition-all duration-[180ms] ${
                    isOpen
                      ? "grid-rows-[1fr] pb-6 opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="cuerpo medida-lectura pt-3 text-text-muted">
                      {isEn ? faq.answerEn : faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="cuerpo mt-8 text-text-muted">
          {t("faq.home.notFound")}{" "}
          <a
            href="mailto:contacto@botasleon.com"
            className="text-leather underline-offset-4 transition-colors duration-[180ms] hover:underline"
          >
            {t("faq.home.writeUs")}
          </a>
        </p>
      </div>
    </section>
  )
}
