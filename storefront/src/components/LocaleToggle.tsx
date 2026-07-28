"use client"

import { useLocale } from "@/lib/i18n/context"

/**
 * LocaleToggle — interruptor 🇲🇽 ES / 🇺🇸 EN con indicador DESLIZANTE animado.
 *
 * Estructura: un contenedor con 2 columnas iguales (grid-cols-2), una píldora
 * de cuero posicionada en absoluto que se desliza (translate-x) entre las dos
 * opciones, y los botones encima. Cambia el idioma de la interfaz al instante
 * y persiste la elección.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const isEn = locale === "en"

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`relative inline-grid grid-cols-2 items-center rounded-full border border-border bg-bg-alt p-1 text-sm font-semibold select-none ${className}`}
    >
      {/* Píldora deslizante */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-leather shadow-sm transition-transform duration-300 ease-out ${
          isEn ? "translate-x-full" : "translate-x-0"
        }`}
      />

      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-pressed={!isEn}
        aria-label="Español (México)"
        className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors duration-200 cursor-pointer ${
          !isEn ? "text-bg" : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden className="text-base leading-none">🇲🇽</span>
        <span className="tracking-wide">ES</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={isEn}
        aria-label="English (USA)"
        className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors duration-200 cursor-pointer ${
          isEn ? "text-bg" : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden className="text-base leading-none">🇺🇸</span>
        <span className="tracking-wide">EN</span>
      </button>
    </div>
  )
}
