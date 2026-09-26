"use client"

import { useEffect, useState } from "react"

/**
 * Alto, en píxeles, del "teaser" de Klaviyo pegado al borde inferior.
 *
 * Cuando alguien cierra el formulario de captura sin registrarse, Klaviyo deja
 * en su lugar una pastilla fija abajo ("GET 10% OFF") con z-index 90000 — muy
 * por encima de cualquier cosa del sitio. Ese recuadro TAPABA la barra del
 * minicarrito y el botón de Pagar: el comprador con dos pares en el carrito no
 * podía llegar al checkout. Lo reportó el dueño con una captura desde su
 * teléfono, y se reprodujo en vivo: `kl-teaser-…`, 168×50, pegado abajo.
 *
 * Se mide su alto para que las barras del sitio se suban por encima. Hoy
 * devuelve 0 casi siempre, porque esa pastilla se esconde y en su lugar va la
 * nuestra (ver components/TeaserDescuento). Pero la medida se queda: si Klaviyo
 * cambia su marcado y deja de reconocerse, las barras del sitio siguen
 * protegidas. Es el cinturón debajo de los tirantes.
 *
 * Devuelve 0 cuando no hay teaser abajo, que es el caso normal.
 */
export function useAltoTeaserKlaviyo(): number {
  const [alto, setAlto] = useState(0)

  useEffect(() => {
    let pendiente = 0

    const medir = () => {
      let mayor = 0
      document
        .querySelectorAll<HTMLElement>('[class*="kl-teaser-"]')
        .forEach((el) => {
          const cs = window.getComputedStyle(el)
          if (cs.display === "none" || cs.visibility === "hidden") return
          const r = el.getBoundingClientRect()
          if (r.height < 8) return
          // Solo estorba lo que está pegado ABAJO. Un teaser lateral o
          // superior no tapa nada nuestro.
          if (window.innerHeight - r.bottom > 24) return
          mayor = Math.max(mayor, Math.round(r.height))
        })
      setAlto((antes) => (antes === mayor ? antes : mayor))
    }

    // Klaviyo mueve mucho el DOM: se agrupa en un cuadro de animación para no
    // medir cincuenta veces por segundo.
    const pedirMedida = () => {
      if (pendiente) return
      pendiente = window.requestAnimationFrame(() => {
        pendiente = 0
        medir()
      })
    }

    medir()
    const observador = new MutationObserver(pedirMedida)
    observador.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("resize", pedirMedida)
    // Klaviyo avisa al abrir y cerrar sus formularios; el teaser aparece justo
    // al cerrar uno.
    window.addEventListener("klaviyoForms", pedirMedida)

    return () => {
      if (pendiente) window.cancelAnimationFrame(pendiente)
      observador.disconnect()
      window.removeEventListener("resize", pedirMedida)
      window.removeEventListener("klaviyoForms", pedirMedida)
    }
  }, [])

  return alto
}
