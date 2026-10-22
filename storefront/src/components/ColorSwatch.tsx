"use client"

import { lookupColor } from "@/lib/pdp/colorLut"

/**
 * ColorSwatch — botón cuadrado con relleno del HEX correspondiente al color.
 *
 * Reemplaza el botón-texto genérico cuando la opción es "Color". Funciona
 * con cualquier color del LUT (negro, café, tabaco, cognac, etc.). Si el
 * color no está mapeado, fallback a gris neutro + label.
 *
 * Estados visuales:
 *   - Default: cuadro lleno con HEX, borde sutil
 *   - Active: anillo de tinta rodeando
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
  /** Tono propio de esta ficha (custom.colores). Gana sobre el LUT. */
  hex?: string
  /**
   * "ficha" son los 44px del selector, que se tocan con el pulgar. "tarjeta"
   * son 20px: ahí el cuadrito no es el control principal —la tarjeta entera
   * lleva a la ficha— y cuatro cuadros de 44px taparían el nombre de la bota.
   */
  tamano?: "ficha" | "tarjeta"
}

/** Claro = necesita borde extra sobre el fondo crema. */
function esClaro(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.78
}

export function ColorSwatch({
  value,
  isActive,
  isAvailable,
  onClick,
  hex: propio,
  tamano = "ficha",
}: Props) {
  const chico = tamano === "tarjeta"
  const colorEntry = propio ? null : lookupColor(value)
  const hex = propio ?? colorEntry?.hex ?? "#B0B0B0"
  const isLight = propio ? esClaro(propio) : (colorEntry?.isLight ?? false)

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
      className={`relative inline-flex items-center justify-center transition-colors duration-[180ms] ${
        isAvailable || isActive ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
      }`}
    >
      {/* REDONDO, por pedido del dueño (2026-10-21). Es la segunda esquina
          curva del sistema —la primera son los 6px de los botones—: el resto
          del sitio es cuadrado a propósito (--radius: 0). Un círculo de color
          se lee como muestra de pintura y se distingue de los cuadros de
          talla, que siguen siendo cuadrados. */}
      {/* Outer ring — visible solo en estado activo */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full transition-colors duration-[180ms] ${
          isActive
            ? chico
              ? "ring-1 ring-text ring-offset-2 ring-offset-bg"
              : "ring-2 ring-text ring-offset-2 ring-offset-bg"
            : ""
        }`}
      />

      {/* Cuadro de color */}
      <span
        aria-hidden
        className={`block rounded-full ${chico ? "w-5 h-5" : "w-11 h-11"} border ${
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
            className={`block ${chico ? "w-6" : "w-12"} h-[2px] bg-text/60 -rotate-45`}
            style={{ transformOrigin: "center" }}
          />
        </span>
      )}
    </button>
  )
}
