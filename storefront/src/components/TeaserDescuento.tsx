"use client"

import { useCallback, useEffect, useState } from "react"
import { useT } from "@/lib/i18n/context"

/**
 * La pestaña del 10%: marcado nuestro, formulario de Klaviyo.
 *
 * Klaviyo deja, cuando alguien cierra su formulario sin registrarse, una
 * pastilla para volver a abrirlo. Esa pastilla la pinta él, con su tipografía y
 * su caja negra, y encima de este sitio se veía como un parche: "sigue siendo
 * muy antiestético", dijo el dueño (2026-09-26) después de dos intentos de
 * moverla de sitio. El problema ya no era dónde estaba, era lo que era.
 *
 * NO SE MAQUILLA LA SUYA, SE SUSTITUYE. Retocarle los estilos por encima
 * significaría escribir CSS a ciegas: Klaviyo no le enseña sus formularios a un
 * navegador automatizado, así que nunca he podido ver ese marcado ni comprobar
 * el resultado. Lo que sí controlo al cien por cien es lo que escribo yo. Así
 * que la suya se esconde y en su lugar va esta, con el tipo, el color crema y
 * el filo del sitio.
 *
 * EL NÚMERO DEL FORMULARIO SALE DE SU PROPIA CLASE (`kl-teaser-XXXX`), no de
 * una variable de entorno: así no hay nada que configurar ni que se quede
 * desfasado si el dueño cambia el formulario en el panel de Klaviyo.
 *
 * Y SOLO EXISTE SI EXISTE LA SUYA. Si Klaviyo no cargó —sin consentimiento de
 * cookies, por ejemplo— o el formulario está apagado, aquí no se pinta nada:
 * nunca se ofrece un descuento que no se pueda reclamar.
 *
 * Al abrir se pulsa su pastilla escondida, que dispara su propio manejador; si
 * eso no abriera nada (marcado cambiado), se llama a su API oficial. Dos
 * caminos porque este es justo el trozo que no puedo probar yo.
 *
 * Va dentro de la cabecera, colgando de su borde inferior. Como la cabecera es
 * pegajosa, la pestaña viaja con ella sin medir nada ni escuchar el
 * desplazamiento —así lo hacía la versión anterior y era el doble de código.
 */

const CLAVE_CERRADO = "botasleon:teaser10-cerrado"

type VentanaKlaviyo = Window & {
  klaviyo?: { openForm?: (id: string) => void }
  _klOnsite?: unknown[][]
}

export function TeaserDescuento() {
  const t = useT()
  const [formulario, setFormulario] = useState<string | null>(null)
  const [cerrado, setCerrado] = useState(false)

  // Cerrada una vez, cerrada el resto de la visita. En sessionStorage y no en
  // localStorage: mañana es otra visita y la oferta sigue en pie.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CLAVE_CERRADO)) setCerrado(true)
    } catch {
      /* navegación privada con el almacenamiento capado: se muestra igual */
    }
  }, [])

  useEffect(() => {
    let pendiente = 0

    const buscar = () => {
      const suya = document.querySelector<HTMLElement>('[class*="kl-teaser-"]')
      if (!suya) return
      // Escondida, no borrada: al pulsar la nuestra se le pasa el clic.
      suya.style.setProperty("display", "none", "important")
      const m = /kl-teaser-([A-Za-z0-9_-]+)/.exec(suya.className.toString())
      if (m) setFormulario((antes) => (antes === m[1] ? antes : m[1]))
    }

    const pedir = () => {
      if (pendiente) return
      pendiente = window.requestAnimationFrame(() => {
        pendiente = 0
        buscar()
      })
    }

    buscar()
    const observador = new MutationObserver(pedir)
    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })
    window.addEventListener("klaviyoForms", pedir)

    return () => {
      if (pendiente) window.cancelAnimationFrame(pendiente)
      observador.disconnect()
      window.removeEventListener("klaviyoForms", pedir)
    }
  }, [])

  const abrir = useCallback(() => {
    const suya = document.querySelector<HTMLElement>('[class*="kl-teaser-"]')
    suya?.click()

    // Red de seguridad: si medio segundo después no hay nada abierto, se llama
    // a la puerta oficial de Klaviyo.
    window.setTimeout(() => {
      const abierto = [
        ...document.querySelectorAll<HTMLElement>('[class*="kl-private"]'),
      ].some((el) => el.getBoundingClientRect().height > 80)
      if (abierto || !formulario) return
      const w = window as VentanaKlaviyo
      if (typeof w.klaviyo?.openForm === "function") {
        w.klaviyo.openForm(formulario)
        return
      }
      w._klOnsite = w._klOnsite || []
      w._klOnsite.push(["openForm", formulario])
    }, 500)
  }, [formulario])

  const cerrar = () => {
    setCerrado(true)
    try {
      window.sessionStorage.setItem(CLAVE_CERRADO, "1")
    } catch {
      /* da igual: se esconde en esta página */
    }
  }

  if (!formulario || cerrado) return null

  return (
    <div className="absolute right-3 top-full z-10 flex items-stretch border border-t-0 border-border bg-bg sm:right-4 md:right-10">
      <button
        type="button"
        onClick={abrir}
        className="nav-label flex min-h-11 items-center gap-2 px-3 text-leather transition-colors duration-[180ms] hover:text-text"
      >
        {t("teaser10.texto")}
        <span aria-hidden>→</span>
      </button>
      <button
        type="button"
        onClick={cerrar}
        aria-label={t("teaser10.cerrar")}
        className="flex min-h-11 w-9 items-center justify-center border-l border-border text-text-muted transition-colors duration-[180ms] hover:text-text"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <path d="M6 6 18 18M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}
