"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { setPendingDiscount } from "@/lib/discount/client"
import {
  CLAVE_CONSENTIMIENTO,
  EVENTO_CONSENTIMIENTO,
  hayConsentimiento,
  PIDE_CONSENTIMIENTO,
} from "@/lib/consentimiento"
import type { Popup } from "@/lib/shopify/types"

/**
 * Ventana emergente de la portada, editada desde Shopify.
 *
 * Todo su contenido —imagen, textos, botón y hasta el código de descuento—
 * sale del metaobjeto `popup`. La idea es que anunciar algo no dependa de un
 * despliegue: el dueño sube una imagen en el admin y sale.
 *
 * Sustituye a la promo que vivía escrita en el código (lib/promo.ts). Conserva
 * lo que aquella hacía bien: sembrar el código de descuento para TODOS —aunque
 * la ventana no llegue a verse— para que el carrito lo aplique solo.
 *
 * Se enseña UNA VEZ por sesión: quien ya la cerró está comprando, y volver a
 * taparle la pantalla en cada página es la manera más rápida de perderlo.
 *
 * NO bloquea el scroll, a diferencia de la versión anterior. Es la misma razón
 * por la que el aviso de cookies dejó de ser un modal: interrumpir a quien
 * acaba de llegar cuesta más de lo que rinde.
 *
 * Y CEDE EL PASO A KLAVIYO. Desde septiembre de 2026 hay un formulario de
 * captura de correos publicado en Klaviyo ("10% en tu primera compra"), que se
 * pinta encima de la página igual que esta ventana. Dos modales encimados no
 * se leen: se tapan. Klaviyo gana porque está capturando correos, que es un
 * activo que se queda; esta ventana anuncia algo que se puede volver a
 * anunciar mañana.
 */

/** ¿Hay un formulario de Klaviyo visible ahora mismo? */
function hayFormularioKlaviyo(): boolean {
  if (typeof document === "undefined") return false
  const nodos = document.querySelectorAll<HTMLElement>(
    '[class*="klaviyo-form"], [class*="kl-private-reset"], [data-testid*="klaviyo"]'
  )
  for (const el of nodos) {
    const caja = el.getBoundingClientRect()
    const cs = window.getComputedStyle(el)
    // Klaviyo deja nodos suyos en el DOM aunque no muestre nada: solo cuenta
    // lo que ocupa espacio de verdad y se ve.
    if (caja.width > 120 && caja.height > 80 && cs.display !== "none" && cs.visibility !== "hidden") {
      return true
    }
  }
  return false
}
const CLAVE_VISTA = "botasleon:promo-seen"

export function PopupPromo({ popup }: { popup: Popup | null }) {
  const t = useT()
  const [abierto, setAbierto] = useState(false)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  const codigo = popup?.discountCode ?? ""
  const handle = popup?.handle ?? ""

  // El código se siembra siempre que exista, se vea la ventana o no: quien
  // llega por un enlace directo a una bota merece el mismo descuento.
  useEffect(() => {
    if (codigo) setPendingDiscount(codigo)
  }, [codigo])

  useEffect(() => {
    if (!handle) return
    try {
      if (sessionStorage.getItem(`${CLAVE_VISTA}:${handle}`) === "1") return
    } catch {
      // Sin sessionStorage se enseñará otra vez; no es grave.
    }

    let t0: ReturnType<typeof setTimeout>
    const mostrar = () => {
      // Un respiro: primero que cargue la página y se vea una bota. Y al
      // final del respiro se vuelve a mirar, porque el formulario de Klaviyo
      // tarda lo suyo en aparecer y podría haber salido mientras tanto.
      t0 = setTimeout(() => {
        if (hayFormularioKlaviyo()) return
        setAbierto(true)
      }, 1800)
    }

    // Detrás del aviso de cookies, para no encimar dos cosas. Donde no hay
    // aviso (Estados Unidos), sale de una vez.
    let contestado = hayConsentimiento()
    if (PIDE_CONSENTIMIENTO) {
      try {
        contestado = !!localStorage.getItem(CLAVE_CONSENTIMIENTO)
      } catch {}
    }
    // Klaviyo avisa cuando abre uno de sus formularios. Si abre después de que
    // esta ventana ya salió, esta se retira: la que captura el correo manda.
    const alAbrirKlaviyo = (e: Event) => {
      const tipo = (e as CustomEvent<{ type?: string }>).detail?.type
      if (tipo === "open") {
        clearTimeout(t0)
        setAbierto(false)
      }
    }
    window.addEventListener("klaviyoForms", alAbrirKlaviyo)

    if (contestado) {
      mostrar()
      return () => {
        clearTimeout(t0)
        window.removeEventListener("klaviyoForms", alAbrirKlaviyo)
      }
    }
    const alContestar = () => mostrar()
    window.addEventListener(EVENTO_CONSENTIMIENTO, alContestar, { once: true })
    return () => {
      clearTimeout(t0)
      window.removeEventListener(EVENTO_CONSENTIMIENTO, alContestar)
      window.removeEventListener("klaviyoForms", alAbrirKlaviyo)
    }
  }, [handle])

  // Escape cierra, y al abrir el foco va al botón de cerrar: quien navega con
  // teclado tiene que poder salir sin recorrer toda la ventana.
  useEffect(() => {
    if (!abierto) return
    cerrarRef.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar()
    }
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  function cerrar() {
    try {
      sessionStorage.setItem(`${CLAVE_VISTA}:${handle}`, "1")
    } catch {}
    setAbierto(false)
  }

  if (!popup || !abierto) return null

  const conImagen = !!popup.image

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("promo.dialogLabel")}
      className="fixed inset-0 z-[55] flex items-end justify-center p-4 sm:items-center"
    >
      {/* Atenúa el fondo y cierra al tocarlo. Es un botón y no un div para que
          también funcione con teclado. */}
      <button
        type="button"
        aria-label={t("promo.closeAria")}
        onClick={cerrar}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <div
        className={`relative w-full overflow-hidden border border-border bg-bg ${
          conImagen ? "max-w-3xl sm:grid sm:grid-cols-2" : "max-w-md"
        }`}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* La imagen del metaobjeto. Va sobre plato con multiply, como toda
            foto de producto: si el dueño sube una toma de estudio, se funde. */}
        {popup.image && (
          <div className="plato hidden sm:block">
            <Image
              src={popup.image.url}
              alt={popup.image.altText || popup.title}
              width={popup.image.width ?? 800}
              height={popup.image.height ?? 800}
              sizes="(min-width: 640px) 384px, 100vw"
              priority
            />
          </div>
        )}

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          {popup.eyebrow && (
            <p className="eyebrow text-leather">{popup.eyebrow}</p>
          )}
          {popup.title && <h2 className="display-m">{popup.title}</h2>}
          {popup.message && (
            <p className="cuerpo medida-lectura text-text-muted">
              {popup.message}
            </p>
          )}

          {popup.ctaLabel && (
            <Link
              href={popup.ctaHref || "/products"}
              onClick={cerrar}
              className="btn mt-1 w-full"
            >
              {popup.ctaLabel}
            </Link>
          )}

          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrar}
            className="btn btn-ter mx-auto py-2"
          >
            {t("promo.close")}
          </button>
        </div>
      </div>
    </div>
  )
}
