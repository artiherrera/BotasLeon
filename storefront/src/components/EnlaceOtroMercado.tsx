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
 */
export function EnlaceOtroMercado({ className = "" }: { className?: string }) {
  if (!isMX) return null

  return (
    <a
      href="https://botasleon.com/en?mercado=us"
      className={`text-xs underline underline-offset-4 hover:text-bg transition-colors ${className}`}
    >
      Shop in USD · United States
    </a>
  )
}
