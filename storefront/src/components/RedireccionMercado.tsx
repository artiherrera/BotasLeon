"use client"

import { useEffect } from "react"
import {
  COOKIE_MERCADO,
  equivalenteMx,
  esRastreador,
  esSitioPublicado,
  pareceMexico,
} from "@/lib/geo"
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
 *
 * Y solo desde los dominios publicados: desde una copia local o una vista
 * previa, el destino sigue siendo el sitio en vivo, así que redirigir ahí
 * significa sacar de su pantalla a quien estaba revisando. Ver esSitioPublicado.
 */
export function RedireccionMercado() {
  useEffect(() => {
    if (isMX) return
    if (!esSitioPublicado(window.location.hostname)) return
    if (document.cookie.includes(COOKIE_MERCADO)) return
    if (esRastreador(navigator.userAgent)) return
    if (!pareceMexico()) return

    window.location.replace(
      equivalenteMx(window.location.pathname, window.location.search)
    )
  }, [])

  return null
}
