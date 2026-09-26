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
 * Se mide su alto para que las barras del sitio se suban por encima. Con el
 * teaser ya movido al costado (ver useTeaserKlaviyoAlCostado, abajo) esta
 * medida devuelve 0 casi siempre —nada pegado abajo que esquivar—, pero se
 * queda: si Klaviyo cambia su marcado y el empujón lateral falla, las barras
 * siguen protegidas. Es el cinturón debajo de los tirantes.
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

/**
 * Mueve el teaser del 10% al COSTADO DERECHO, a media altura.
 *
 * Lo pidió el dueño dos veces (2026-09-25): "el 10% de Klaviyo se ve en la
 * parte de abajo, te dije que lo quería a un lado". Abajo es el peor sitio
 * posible en esta tienda: ahí vive la barra de pestañas, la barra de compra de
 * la ficha y el resumen del carrito. Cada cosa nueva que se pega abajo hay que
 * subirla por encima de una pastilla de Klaviyo que no podemos tocar.
 *
 * NO SE ARREGLA CON CSS. Klaviyo escribe la posición en el atributo `style`, y
 * unas veces la escribe en el propio teaser y otras en un envoltorio que lo
 * contiene; desde una hoja de estilos no se puede saber cuál de los dos lleva
 * el `position: fixed`. Aquí se sube por el árbol hasta encontrarlo y se le
 * manda la posición con prioridad `important`, que es lo único que le gana a un
 * estilo en línea.
 *
 * SIN BUCLE. El observador del DOM se dispara también con nuestro propio
 * cambio de estilos, así que la condición de salida no se pregunta "¿ya le puse
 * los estilos?" —Klaviyo podría habérselos borrado— sino "¿está DONDE QUIERO?",
 * medido con el rectángulo real. Cuando ya está, no se toca; y si Klaviyo lo
 * devuelve abajo, se vuelve a mover.
 *
 * JUSTO DEBAJO DE LA CABECERA, pegado a la derecha. Primero lo puse a media
 * altura y el dueño lo corrigió (2026-09-26): en el centro parte la página en
 * dos y se cruza con las fotos de las botas, que es lo que la gente vino a ver.
 * Arriba se apoya en la cabecera, se lee como parte de ella y deja limpio todo
 * lo de abajo.
 *
 * La altura NO va escrita a mano: se mide la cabecera en cada pasada. Es
 * pegajosa y cambia de alto —lleva dentro la barra de avisos, que aparece y
 * desaparece según la promoción y el idioma—, así que un número fijo hoy sería
 * un hueco o un solape mañana. Por eso también se escucha el desplazamiento.
 *
 * Se llama UNA vez, desde KlaviyoLoader, que es el único sitio por el que entra
 * Klaviyo a la página.
 */
export function useTeaserKlaviyoAlCostado(): void {
  useEffect(() => {
    let pendiente = 0

    const mover = () => {
      document
        .querySelectorAll<HTMLElement>('[class*="kl-teaser-"]')
        .forEach((teaser) => {
          const cs0 = window.getComputedStyle(teaser)
          if (cs0.display === "none" || cs0.visibility === "hidden") return

          // El elemento que de verdad está fijado a la ventana: puede ser el
          // teaser o un envoltorio suyo.
          //
          // CON FRENO. Klaviyo mete el formulario y el teaser dentro de los
          // mismos contenedores, y algunos también están fijados. Si se sube
          // hasta uno de esos y se le manda medir lo que mide un texto, lo que
          // se encoge es el formulario entero. Así que solo se adopta el
          // envoltorio si es de este teaser y de nada más —mismo alto, salvo un
          // margen—; si no, se mueve el teaser por su cuenta, que para eso
          // `position: fixed` no necesita permiso de nadie.
          const rTeaser = teaser.getBoundingClientRect()
          let objetivo = teaser
          if (window.getComputedStyle(teaser).position !== "fixed") {
            let saltos = 0
            for (
              let n: HTMLElement | null = teaser.parentElement;
              n && n !== document.body && saltos < 4;
              n = n.parentElement, saltos++
            ) {
              if (window.getComputedStyle(n).position !== "fixed") continue
              if (n.getBoundingClientRect().height <= rTeaser.height + 24) {
                objetivo = n
              }
              break
            }
          }

          // Dónde empieza el sitio libre: debajo de la cabecera, con un dedo
          // de aire. Si la cabecera se ha ido con el desplazamiento, el tope
          // es el borde de la ventana.
          const cabecera = document.querySelector("header")
          const abajoDeLaCabecera = cabecera
            ? cabecera.getBoundingClientRect().bottom
            : 0
          const y = Math.round(Math.max(8, abajoDeLaCabecera + 8))

          const r = objetivo.getBoundingClientRect()
          if (r.width < 8 || r.height < 8) return
          // ¿Ya está donde quiero? A la altura de la cabecera, pegado a la
          // derecha Y ESTRECHO. Lo último no es un capricho: la primera
          // versión solo miraba la posición, y como la banda de Klaviyo es de
          // ancho completo, "pegada a la derecha" ya era cierta el primer día
          // —quedaba una franja negra cruzando la página entera.
          const pegadoDerecha = Math.abs(window.innerWidth - r.right) <= 2
          const aLaAltura = Math.abs(r.top - y) <= 4
          const estrecho = r.width <= window.innerWidth * 0.7
          if (pegadoDerecha && aLaAltura && estrecho) return

          const st = objetivo.style
          st.setProperty("position", "fixed", "important")
          st.setProperty("top", `${y}px`, "important")
          st.setProperty("bottom", "auto", "important")
          st.setProperty("left", "auto", "important")
          st.setProperty("right", "0px", "important")
          // Sin traslado: la posición ya es la buena, y el que traía Klaviyo
          // para centrarse abajo la echaría a perder.
          st.setProperty("transform", "none", "important")
          st.setProperty("margin", "0", "important")
          // QUE MIDA LO QUE MIDE SU TEXTO. Klaviyo pinta el teaser como una
          // banda de lado a lado; pegada al borde derecho seguía tapando la
          // página entera, solo que por el centro en vez de por abajo.
          st.setProperty("width", "max-content", "important")
          st.setProperty("max-width", "min(66vw, 260px)", "important")
          // El ALTO no se toca: el problema era el ancho. Forzarlo a `auto`
          // deja el texto pegado a los bordes, porque el relleno de Klaviyo
          // viene del alto fijo; medido, la pastilla pasaba de 76px a 21.
          // Si lo que está fijado era un envoltorio, la pastilla de dentro
          // también tiene que encoger, o el envoltorio estrecho la recorta.
          if (teaser !== objetivo) {
            teaser.style.setProperty("width", "max-content", "important")
            teaser.style.setProperty("max-width", "100%", "important")
          }
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
