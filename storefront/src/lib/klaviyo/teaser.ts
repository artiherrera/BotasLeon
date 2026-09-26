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
 * Klaviyo no deja mover ese teaser desde aquí —se configura en su panel—, así
 * que lo que se mueve es lo nuestro: se mide su alto y las barras del sitio se
 * suben por encima.
 *
 * NO SE INTENTA MÁS QUE ESO, y es una cicatriz. El 2026-09-25 probé a moverlo
 * por las bravas (al costado, luego bajo la cabecera) y después a esconderlo
 * para poner una pastilla nuestra en su lugar. Las tres versiones salieron mal
 * EN EL TELÉFONO DEL DUEÑO, no aquí: primero una franja negra cruzando la
 * página, y al final lo peor —pasarle el clic a su elemento escondido llevaba a
 * Klaviyo (dentro hay un enlace) o congelaba la pantalla, porque Klaviyo abre
 * su formulario DENTRO de ese mismo elemento y yo lo mantenía oculto.
 *
 * La raíz es siempre la misma: Klaviyo no le enseña sus formularios a un
 * navegador automatizado, así que ese marcado no lo he visto nunca y cada
 * cambio se probaba en producción, con clientes dentro. Quien quiera volver a
 * intentarlo que primero consiga verlo.
 *
 * Devuelve 0 cuando no hay teaser abajo, que es el caso normal.
 */
/** Lo que se separa del borde derecho, igual que el aire de la cabecera. */
const MARGEN = 12

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

/**
 * Sube la pastilla del 10% a debajo de la cabecera, pegada a la derecha.
 *
 * Donde la deja Klaviyo —abajo a la izquierda, 168x64— se monta ENCIMA de la
 * barra de pestañas del teléfono: tapa "Inicio" y "Explorar" con su z-index de
 * 90000. Y arriba es donde la quiso el dueño (2026-09-26).
 *
 * SOLO SE MUEVE. No se esconde, no se sustituye y no se le pulsa nada: eso ya
 * se intentó y acabó con el formulario abriéndose dentro de un elemento
 * invisible y la pantalla del teléfono congelada. El vestuario va en
 * globals.css; aquí solo van los cuatro números que dependen de medir.
 *
 * La altura se mide en cada pasada porque la cabecera es pegajosa y cambia de
 * alto: lleva dentro la barra de avisos, que aparece y desaparece con la
 * promoción y el idioma, y en un teléfono estrecho ocupa dos líneas.
 */
export function useTeaserKlaviyoBajoLaCabecera(): void {
  useEffect(() => {
    let pendiente = 0

    const mover = () => {
      document
        .querySelectorAll<HTMLElement>('[class*="kl-teaser-"]')
        .forEach((teaser) => {
          const cs = window.getComputedStyle(teaser)
          if (cs.display === "none" || cs.visibility === "hidden") return

          const cabecera = document.querySelector("header")
          const y = Math.round(
            Math.max(8, (cabecera ? cabecera.getBoundingClientRect().bottom : 0) + 8),
          )

          const r = teaser.getBoundingClientRect()
          if (r.width < 8 || r.height < 8) return
          // ¿Ya está? Se pregunta por el rectángulo y no por los estilos que
          // pusimos: Klaviyo los reescribe y hay que poder volver a ponerlos.
          const aLaDerecha = Math.abs(window.innerWidth - r.right - MARGEN) <= 2
          const aLaAltura = Math.abs(r.top - y) <= 4
          if (aLaDerecha && aLaAltura) return

          const st = teaser.style
          st.setProperty("top", `${y}px`, "important")
          st.setProperty("bottom", "auto", "important")
          st.setProperty("left", "auto", "important")
          st.setProperty("right", "0px", "important")
          st.setProperty("margin", `0 ${MARGEN}px`, "important")
        })
    }

    const pedirMovida = () => {
      if (pendiente) return
      pendiente = window.requestAnimationFrame(() => {
        pendiente = 0
        mover()
      })
    }

    mover()
    const observador = new MutationObserver(pedirMovida)
    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })
    window.addEventListener("resize", pedirMovida)
    window.addEventListener("scroll", pedirMovida, { passive: true })
    window.addEventListener("klaviyoForms", pedirMovida)

    return () => {
      if (pendiente) window.cancelAnimationFrame(pendiente)
      observador.disconnect()
      window.removeEventListener("resize", pedirMovida)
      window.removeEventListener("scroll", pedirMovida)
      window.removeEventListener("klaviyoForms", pedirMovida)
    }
  }, [])
}
