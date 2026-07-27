"use client"

import { useLocale } from "@/lib/i18n/context"

/**
 * LocaleToggle — interruptor 🇲🇽 ES / 🇺🇸 EN. Control segmentado: la opción
 * activa se resalta en cuero. Cambia el idioma de la INTERFAZ al instante
 * (contexto de React) y persiste la elección.
 *
 * Se usa en el Header (desktop) y dentro del menú móvil. Acepta `className`
 * para ajustar su ubicación/tamaño en cada contexto.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale()

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`inline-flex items-center rounded-full border border-border bg-bg-alt/60 p-0.5 text-xs font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
        aria-label="Español (México)"
        className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors cursor-pointer ${
          locale === "es"
            ? "bg-leather text-bg"
            : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden>🇲🇽</span>
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English (USA)"
        className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors cursor-pointer ${
          locale === "en"
            ? "bg-leather text-bg"
            : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  )
}
