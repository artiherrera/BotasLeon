"use client"

import { lookupColor } from "@/lib/pdp/colorLut"

/**
 * ColorSwatch — botón circular con relleno del HEX correspondiente al color.
 *
 * Reemplaza el botón-texto genérico cuando la opción es "Color". Funciona
 * con cualquier color del LUT (negro, café, tabaco, cognac, etc.). Si el
 * color no está mapeado, fallback a gris neutro + label.
 *
 * Estados visuales:
 *   - Default: círculo lleno con HEX, borde sutil
 *   - Active: anillo grueso color leather rodeando
 *   - Unavailable: opacity reducida + diagonal slash overlay
 *   - Light colors (blanco, hueso): borde interno extra para contraste sobre fondo claro
 *
 * Accesibilidad: aria-label = nombre del color + estado, aria-pressed para selección.
 * Tooltip nativo (title) para hover desktop.
 */

type Props = {
  value: string
  isActive: boolean
  isAvailable: boolean
  onClick: () => void
}

export function ColorSwatch({ value, isActive, isAvailable, onClick }: Props) {
  const colorEntry = lookupColor(value)
  const hex = colorEntry?.hex ?? "#B0B0B0"
  const isLight = colorEntry?.isLight ?? false

  const ariaLabel = `Color ${value}${
    isActive ? " (seleccionado)" : ""
  }${!isAvailable ? " (no disponible)" : ""}`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable && !isActive}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      title={value}
      className={`relative inline-flex items-center justify-center transition-all ${
        isActive
          ? "scale-110"
          : isAvailable
            ? "hover:scale-105 cursor-pointer"
            : "opacity-40 cursor-not-allowed"
      }`}
    >
      {/* Outer ring — visible solo en estado activo */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full transition-all ${
          isActive ? "ring-2 ring-leather ring-offset-2 ring-offset-bg" : ""
        }`}
      />

      {/* Círculo de color */}
      <span
        aria-hidden
        className={`block w-10 h-10 md:w-11 md:h-11 rounded-full border ${
          isLight ? "border-border-strong/40" : "border-black/20"
        } ${isLight && !isActive ? "shadow-inner" : ""}`}
        style={{ backgroundColor: hex }}
      />

      {/* Slash overlay si no disponible */}
      {!isAvailable && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span
            className="block w-12 h-[2px] bg-text/60 -rotate-45"
            style={{ transformOrigin: "center" }}
          />
        </span>
      )}
    </button>
  )
}
