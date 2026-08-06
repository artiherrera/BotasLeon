"use client"

import { createElement, useEffect, useRef } from "react"
import { genderFromHandle, sizeFromScale, sizeFromCm, type SizeResult } from "@/lib/sizing/chart"

/**
 * VolumentalScan — escaneo de pie por cámara con el SDK de Volumental (ML real).
 * Vive DENTRO del modal de SizeFinder (pestaña "Escanear"). Al terminar el
 * escaneo emite `volumental:on-recommendation` { length, width, sizeLocale };
 * lo convertimos a talla BotasLeón (MX) y lo pasamos por onResult para que el
 * ResultBox del modal lo muestre — así hay un SOLO botón y un solo resultado.
 *
 * El client-id es público (va en el HTML del tema). Override con
 * NEXT_PUBLIC_VOLUMENTAL_CLIENT_ID. Si Volumental no autoriza el dominio, el
 * web component no pinta y quedan los métodos manuales (no rompe nada).
 */

const CLIENT_ID =
  process.env.NEXT_PUBLIC_VOLUMENTAL_CLIENT_ID || "18c5f003-1bc3-4bcf-9bb2-2a35750db534"
const SDK_SRC = "https://js.volumental.com/sdk/v1/volumental.js"

export const VOLUMENTAL_ENABLED = !!CLIENT_ID

function loadSdk() {
  if (typeof document === "undefined") return
  if (document.getElementById("volumental-sdk")) return
  const s = document.createElement("script")
  s.id = "volumental-sdk"
  s.async = true
  s.src = SDK_SRC
  s.setAttribute("data-client-id", CLIENT_ID)
  document.body.appendChild(s)
}

/** Recomendación de Volumental → talla BotasLeón, según la escala que devuelva. */
function toSize(
  detail: { length?: number | string; sizeLocale?: string },
  gender: "men" | "women"
): SizeResult | null {
  const v = typeof detail.length === "number" ? detail.length : parseFloat(String(detail.length))
  if (!Number.isFinite(v)) return null
  const loc = (detail.sizeLocale || "us").toLowerCase()
  if (loc === "mondo") return sizeFromCm(v / 10, gender)
  if (loc === "eu") return sizeFromScale(v, "EU", gender)
  return sizeFromScale(v, "US", gender)
}

export function VolumentalScan({
  productId,
  genderHandle,
  onResult,
  en,
}: {
  productId: string
  genderHandle?: string | null
  onResult: (r: SizeResult | null) => void
  en: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const gender = genderFromHandle(genderHandle) ?? "men"

  useEffect(() => {
    if (!CLIENT_ID) return
    loadSdk()
    const onRec = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      // eslint-disable-next-line no-console
      console.log("[volumental] on-recommendation", detail)
      const r = toSize(detail, gender)
      if (r) onResult(r)
    }
    // El evento se dispara EN el <volumental-recommendation>; escuchamos ahí
    // directo + document/window por si burbujea. El elemento puede tardar en
    // aparecer (lo crea el SDK), así que reintentamos enganchar unos segundos.
    const attached: EventTarget[] = []
    const attach = (t: EventTarget | null | undefined) => {
      if (t && !attached.includes(t)) { t.addEventListener("volumental:on-recommendation", onRec as EventListener); attached.push(t) }
    }
    attach(document); attach(window)
    let tries = 0
    const iv = window.setInterval(() => {
      attach(ref.current?.querySelector("volumental-recommendation"))
      if (++tries > 20) window.clearInterval(iv) // ~10s
    }, 500)
    return () => {
      window.clearInterval(iv)
      attached.forEach((t) => t.removeEventListener("volumental:on-recommendation", onRec as EventListener))
    }
  }, [gender, onResult])

  return (
    <div ref={ref}>
      <p className="text-sm text-text-muted mb-3">
        {en
          ? "Scan your foot with the camera for a precise size (allow camera access)."
          : "Escanea tu pie con la cámara para una talla precisa (permite el acceso a la cámara)."}
      </p>
      {createElement("volumental-recommendation", {
        "product-id": productId,
        "size-locale": "us",
        "product-gender-age": gender === "men" ? "male" : "female",
        "component-type": "sizechart-button",
        variant: "button",
      })}
      <p className="text-xs text-text-subtle mt-2">
        {en
          ? "No button? Use the other tabs — they work anywhere."
          : "¿No aparece el botón? Usa las otras pestañas — funcionan en cualquier equipo."}
      </p>
    </div>
  )
}
