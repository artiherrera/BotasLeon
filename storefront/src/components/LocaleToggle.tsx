"use client"

import { useLocale } from "@/lib/i18n/context"
import { IS_MULTILINGUAL } from "@/lib/i18n/config"

/**
 * LocaleToggle — conmutador 🇲🇽 ES / 🇺🇸 EN con indicador deslizante.
 *
 * Estructura: un contenedor de 2 columnas iguales (grid-cols-2), una celda de
 * tinta posicionada en absoluto que se desliza entre las dos opciones, y los
 * botones encima. Cambia el idioma de la interfaz al instante y persiste la
 * elección.
 *
 * Esquinas RECTAS: la píldora era el único control redondeado que quedaba, y
 * un conmutador no es un círculo. Alto 44px, el mismo objetivo táctil que los
 * botones de la cabecera: se pinta en la barra también en móvil, así que 40px
 * lo dejaba por debajo del mínimo. Se queda en la barra —no baja al pie—
 * porque en botasleon.com es la única puerta de la diáspora que entra en
 * inglés y quiere leer en español.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const isEn = locale === "en"

  // El sitio mexicano publica solo español: un interruptor con una sola opción
  // no es un interruptor. Se apaga aquí y no en el Header para que cualquier
  // otro punto de montaje quede cubierto por la misma regla.
  if (!IS_MULTILINGUAL) return null

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`relative inline-grid h-11 shrink-0 grid-cols-2 items-stretch border border-border bg-plate select-none ${className}`}
    >
      {/* Celda deslizante */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-text transition-transform duration-[180ms] ease-out ${
          isEn ? "translate-x-full" : "translate-x-0"
        }`}
      />

      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-pressed={!isEn}
        aria-label="Español (México)"
        className={`relative z-10 flex items-center justify-center gap-1 px-1.5 text-xs sm:px-2.5 font-medium tracking-[0.08em] transition-colors duration-[180ms] cursor-pointer ${
          !isEn ? "text-bg" : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden className="text-sm leading-none">🇲🇽</span>
        <span className="hidden sm:inline">ES</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={isEn}
        aria-label="English (USA)"
        className={`relative z-10 flex items-center justify-center gap-1 px-1.5 text-xs sm:px-2.5 font-medium tracking-[0.08em] transition-colors duration-[180ms] cursor-pointer ${
          isEn ? "text-bg" : "text-text-muted hover:text-text"
        }`}
      >
        <span aria-hidden className="text-sm leading-none">🇺🇸</span>
        <span className="hidden sm:inline">EN</span>
      </button>
    </div>
  )
}
