"use client"

import { createElement, useEffect, useRef, useState } from "react"
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

/** API pública del SDK de Volumental (window.Volumental) que usamos. */
type VolumentalApi = {
  on: (event: string, cb: (payload: unknown) => void) => void
  off?: (event: string, cb: (payload: unknown) => void) => void
}

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
  // Diagnóstico visible EN PANTALLA (para probar en el cel sin consola).
  const [dbg, setDbg] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    loadSdk()
    // El SDK NO usa eventos DOM: emite por su API interna Volumental.on(name, cb)
    // con nombres OnRecommendation / OnMeasurement / OnModalOpened / ... (leído
    // del propio SDK). El payload de OnRecommendation es {length,width,sizeLocale}.
    const EVENTS = ["OnModalOpened", "OnMeasurement", "OnRecommendation", "OnModalClosed", "OnError"]
    const registered: Array<{ ev: string; cb: (p: unknown) => void }> = []
    const makeCb = (ev: string) => (payload: unknown) => {
      const d = (payload || {}) as { length?: number | string; width?: number | string; sizeLocale?: string; message?: string }
      // eslint-disable-next-line no-console
      console.log("[volumental]", ev, d)
      setDbg(`${ev} · ${JSON.stringify(d).slice(0, 140)}`)
      if (ev === "OnRecommendation") {
        const r = toSize(d, gender)
        if (r) onResult(r)
      }
    }
    let tries = 0
    const iv = window.setInterval(() => {
      const V = (window as unknown as { Volumental?: VolumentalApi }).Volumental
      if (V?.on) {
        EVENTS.forEach((ev) => { const cb = makeCb(ev); V.on(ev, cb); registered.push({ ev, cb }) })
        window.clearInterval(iv)
      } else if (++tries > 50) {
        window.clearInterval(iv) // ~15s esperando al SDK
        setDbg("SDK no cargó (¿dominio no autorizado?)")
      }
    }, 300)
    return () => {
      window.clearInterval(iv)
      const V = (window as unknown as { Volumental?: VolumentalApi }).Volumental
      registered.forEach(({ ev, cb }) => V?.off?.(ev, cb))
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
      {dbg && (
        <p className="text-[11px] text-text-subtle font-mono mt-2 break-all border-t border-border pt-2">
          🔎 {dbg}
        </p>
      )}
    </div>
  )
}
