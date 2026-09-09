"use client"

import { useEffect, useState } from "react"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import {
  CLAVE_CONSENTIMIENTO,
  EVENTO_CONSENTIMIENTO,
  PIDE_CONSENTIMIENTO,
} from "@/lib/consentimiento"

/**
 * Aviso de cookies — barra al pie, dos botones, y solo donde hace falta.
 *
 * Antes era un modal centrado con fondo oscuro que bloqueaba el scroll: se
 * eligió a propósito porque sube la tasa de "Aceptar todas" y con ella la
 * cobertura del pixel. El dueño lo cambió: interrumpir a alguien que acaba de
 * llegar, antes de que vea una sola bota, cuesta más que lo que aporta medir
 * mejor a quien se queda.
 *
 * Ahora es una franja pegada abajo que no tapa nada, no bloquea el scroll y se
 * puede ignorar: se puede seguir comprando con ella puesta. Dos botones del
 * mismo tamaño —aceptar y rechazar—, porque una barra que solo deja aceptar no
 * es una elección.
 *
 * Y NO EXISTE en Estados Unidos: allá no hay ley federal que exija pedir
 * permiso antes de medir, así que el aviso solo restaría. Lo decide el
 * MERCADO, no el idioma (ver lib/consentimiento).
 *
 * Rechazar también se guarda: sin eso, la barra volvería a salir en cada
 * página y "rechazar" se sentiría roto.
 */
export function CookiesBanner() {
  const t = useT()
  // null mientras se lee localStorage: así no parpadea en el primer render.
  const [contestado, setContestado] = useState<boolean | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!PIDE_CONSENTIMIENTO) return
    let guardado: string | null = null
    try {
      guardado = window.localStorage.getItem(CLAVE_CONSENTIMIENTO)
    } catch {
      // Safari en modo privado puede negar localStorage: se pregunta igual.
    }
    if (guardado) {
      setContestado(true)
      return
    }
    setContestado(false)
    // Un respiro antes de aparecer: que la página cargue primero y la barra
    // entre después, no encima del primer golpe de vista.
    const t0 = window.setTimeout(() => setVisible(true), 700)
    return () => window.clearTimeout(t0)
  }, [])

  function responder(valor: "all" | "necessary") {
    try {
      window.localStorage.setItem(CLAVE_CONSENTIMIENTO, valor)
    } catch {
      // Sin almacenamiento no hay nada que recordar; la barra se cierra igual.
    }
    try {
      window.dispatchEvent(
        new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: { value: valor } })
      )
    } catch {
      // CustomEvent no soportado: falla en silencio, nadie se entera.
    }
    setVisible(false)
    setContestado(true)
  }

  if (!PIDE_CONSENTIMIENTO) return null
  if (contestado !== false) return null

  return (
    // region y no dialog: un dialog obliga al lector de pantalla a atenderlo
    // antes que la página, que es justo lo que se quiso quitar. El rótulo
    // conserva la palabra "cookies" a propósito.
    <section
      aria-label={t("cookies.dialogLabel")}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-plate transition-transform duration-[180ms] motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="contenedor flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5">
        <p className="cuerpo text-text-muted">
          {t("cookies.barra")}{" "}
          <Link
            href="/privacidad"
            className="text-leather underline underline-offset-4 hover:no-underline"
          >
            {t("cookies.privacyLink")}
          </Link>
          .
        </p>

        {/* Los dos del mismo ancho y a 44px de alto: rechazar tiene que ser
            tan fácil de tocar como aceptar. */}
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => responder("necessary")}
            className="btn btn-sec h-11 flex-1 px-5 sm:flex-none"
          >
            {t("cookies.reject")}
          </button>
          <button
            type="button"
            onClick={() => responder("all")}
            className="btn h-11 flex-1 px-5 sm:flex-none"
          >
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </section>
  )
}
