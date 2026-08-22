"use client"

import { useEffect } from "react"
import { COOKIE_MERCADO, equivalenteMx, esRastreador, pareceMexico } from "@/lib/geo"
import { isMX } from "@/lib/market"

/**
 * Respaldo en el navegador de la redirección por mercado.
 *
 * El proxy solo puede actuar si el CDN manda el país, y la distribución que
 * administra Amplify no garantiza esa cabecera. Esto cubre el hueco leyendo la
 * zona horaria — que además acierta más: un mexicano de viaje en Texas sigue
 * queriendo ver pesos.
 *
 * Se ejecuta una vez y con `replace`, para no dejar la .com en el historial y
 * que el botón de atrás rebote entre los dos sitios.
 */
export function RedireccionMercado() {
  useEffect(() => {
    if (isMX) return
    if (document.cookie.includes(COOKIE_MERCADO)) return
    if (esRastreador(navigator.userAgent)) return
    if (!pareceMexico()) return

    window.location.replace(
      equivalenteMx(window.location.pathname, window.location.search)
    )
  }, [])

  return null
}
