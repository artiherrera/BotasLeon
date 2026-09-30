"use client"

import { isMX } from "@/lib/market"

/**
 * Puente entre los dos sitios.
 *
 * En la .mx ofrece ir a la .com con `?mercado=us`, que es lo que fija la
 * preferencia ALLÁ — las cookies son por dominio y una puesta aquí no evitaría
 * que el proxy de la .com lo devolviera a pesos en la siguiente visita.
 *
 * En la .com no se pinta nada: quien llegó ahí ya está donde quería, o fue
 * traído por la redirección y tiene el enlace de vuelta en la .mx.
 *
 * DESMONTADO DESDE EL 2026-09-30 por encargo del dueño: "quitar Shop in USD ·
 * United States en México". El archivo se queda porque volver a ofrecerlo es
 * montarlo otra vez en Footer.tsx, una línea. La lógica de mercados y la
 * redirección por país no se tocaron.
 */
export function EnlaceOtroMercado({ className = "" }: { className?: string }) {
  if (!isMX) return null

  return (
    <a
      href="https://botasleon.com/en?mercado=us"
      className={`text-xs underline underline-offset-4 hover:text-text transition-colors duration-[180ms] ${className}`}
    >
      Shop in USD · United States
    </a>
  )
}
