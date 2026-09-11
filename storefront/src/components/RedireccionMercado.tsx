"use client"

import { useEffect } from "react"
import {
  COOKIE_MERCADO,
  equivalenteCom,
  equivalenteMx,
  esRastreador,
  esSitioPublicado,
  estaFueraDeMexico,
  pareceMexico,
} from "@/lib/geo"
import { isMX } from "@/lib/market"

/**
 * Cada quien en el sitio de su moneda, decidido en el navegador.
 *
 * Va en los DOS sentidos: quien está en México y cae en la .com se va a la .mx,
 * y quien está fuera de México y cae en la .mx se va a la .com. El segundo
 * caso no es hipotético — pasa con un enlace compartido por WhatsApp, un
 * anuncio mal apuntado o una búsqueda; el cliente veía pesos y envío nacional
 * en un sitio que no le puede surtir así.
 *
 * Por qué aquí y no en el servidor: se intentó con la cabecera de país del CDN
 * y en producción mandó a la .mx peticiones que no venían de México (ver
 * proxy.ts). La zona horaria del navegador acierta más — un mexicano de viaje
 * en Texas sigue queriendo ver pesos — y no depende de cómo Amplify configure
 * CloudFront.
 *
 * LAS DOS DIRECCIONES NO SON SIMÉTRICAS, a propósito:
 *
 *  · Hacia la .mx basta con "parece México", y el idioma desempata cuando la
 *    zona viene enmascarada.
 *  · Hacia la .com basta con NO estar en México: cualquier zona horaria
 *    conocida que no sea mexicana. Un colombiano o un español en la .mx
 *    también verían pesos y envío nacional que nadie les puede surtir.
 *    La única excepción es la zona enmascarada (Tor, Firefox endurecido, que
 *    reportan "UTC"): ahí no se adivina y nadie se mueve, porque sacar a un
 *    mexicano de su propio sitio es el error caro.
 *
 * Se ejecuta una vez y con `replace`, para no dejar el sitio anterior en el
 * historial y que el botón de atrás rebote entre los dos dominios.
 */
export function RedireccionMercado() {
  useEffect(() => {
    // Desde una copia local o una vista previa el destino sigue siendo el sitio
    // EN VIVO, así que redirigir ahí saca de su pantalla a quien está
    // revisando, a los pocos milisegundos de cargar. Ver esSitioPublicado.
    if (!esSitioPublicado(window.location.hostname)) return
    // Si ya eligió quedarse, se respeta.
    if (document.cookie.includes(COOKIE_MERCADO)) return
    // Googlebot rastrea desde Estados Unidos. Sin este freno, la .mx lo
    // mandaría a la .com en cada página y desaparecería del índice.
    if (esRastreador(navigator.userAgent)) return

    const destino = isMX
      ? estaFueraDeMexico()
        ? equivalenteCom(window.location.pathname, window.location.search)
        : null
      : pareceMexico()
        ? equivalenteMx(window.location.pathname, window.location.search)
        : null

    if (destino) window.location.replace(destino)
  }, [])

  return null
}
