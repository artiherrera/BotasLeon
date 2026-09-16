"use client"

import { useEffect, useRef, useState } from "react"
import { useCart } from "@/components/CartProvider"
import { useT } from "@/lib/i18n/context"

/**
 * Compartir la bota.
 *
 * Faltaba, y el dueño lo llamó "algo súper básico". Lo es: la mitad de las
 * ventas de este negocio se cierran por WhatsApp, y una bota que no se puede
 * mandar por WhatsApp es una bota que se vende menos.
 *
 * DOS CAMINOS, según el aparato:
 *
 *  · Con `navigator.share` —todos los teléfonos y Safari de escritorio— se
 *    abre la hoja nativa: WhatsApp, Mensajes, Instagram, lo que la persona
 *    tenga. No inventamos un menú que ya existe en el sistema.
 *  · Sin él —Chrome y Firefox de escritorio— aparecen dos opciones: WhatsApp
 *    Web y copiar el enlace. WhatsApp va primero y con nombre porque aquí no
 *    es una red más: es el canal.
 *
 * SE COMPARTE LA URL DE LA PÁGINA TAL CUAL, no una versión "canónica": trae el
 * idioma y el mercado con los que se está viendo la bota, así que quien recibe
 * el enlace ve el mismo precio en la misma moneda. Un enlace a la .com mandado
 * desde México llevaría al primo a pagar en dólares.
 *
 * El texto que acompaña al enlace lleva el nombre de la bota y el precio: en
 * WhatsApp la vista previa del enlace tarda en cargar y a veces no llega, así
 * que el mensaje tiene que valer por sí solo.
 */
export function CompartirProducto({
  titulo,
  precio,
}: {
  titulo: string
  /** Ya formateado en la moneda del mercado, ej. "$3,499". */
  precio: string
}) {
  const t = useT()
  const { showToast } = useCart()
  const [abierto, setAbierto] = useState(false)
  const [nativo, setNativo] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  // Se decide en el navegador, nunca en el servidor: el HTML es estático y no
  // sabe en qué aparato va a abrirse.
  useEffect(() => {
    setNativo(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  // El menú de escritorio se cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false)
    document.addEventListener("mousedown", fuera)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  const url = () => window.location.href
  const mensaje = () => `${titulo} · ${precio}`

  async function compartir() {
    if (nativo) {
      try {
        await navigator.share({ title: titulo, text: mensaje(), url: url() })
      } catch {
        // Cancelar la hoja nativa no es un error: no se avisa nada.
      }
      return
    }
    setAbierto((v) => !v)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url())
      showToast(t("compartir.copiado"), "success")
    } catch {
      showToast(t("compartir.noCopiado"), "error")
    }
    setAbierto(false)
  }

  const whatsapp = () =>
    `https://wa.me/?text=${encodeURIComponent(`${mensaje()}\n${url()}`)}`

  return (
    <div ref={contenedor} className="relative mt-3">
      <button
        type="button"
        onClick={compartir}
        aria-haspopup={nativo ? undefined : "menu"}
        aria-expanded={nativo ? undefined : abierto}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-boton bg-plate px-6 text-[0.875rem] font-medium tracking-[0.01em] text-text transition-colors duration-[180ms] hover:bg-border-plate"
      >
        {/* Ícono de compartir, del set único: Lucide, 20px, trazo 1.5. */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
        {t("compartir.boton")}
      </button>

      {!nativo && abierto && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-20 mt-1 rounded-boton border border-border bg-bg py-1 shadow-lg"
        >
          <a
            role="menuitem"
            href={whatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAbierto(false)}
            className="cuerpo block px-4 py-2.5 text-text transition-colors duration-[180ms] hover:bg-plate"
          >
            {t("compartir.whatsapp")}
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={copiar}
            className="cuerpo block w-full cursor-pointer px-4 py-2.5 text-left text-text transition-colors duration-[180ms] hover:bg-plate"
          >
            {t("compartir.copiar")}
          </button>
        </div>
      )}
    </div>
  )
}
