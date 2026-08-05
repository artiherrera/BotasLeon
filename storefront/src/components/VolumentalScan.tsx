"use client"

import { createElement, useEffect, useRef, useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import { genderFromHandle, sizeFromScale, sizeFromCm, type SizeResult } from "@/lib/sizing/chart"

/**
 * VolumentalScan — escaneo de pie por cámara con el SDK de Volumental (ML real).
 *
 * Volumental es headless-compatible: un <script data-client-id> + el web
 * component <volumental-recommendation>. Al terminar el escaneo emite el evento
 * `volumental:on-recommendation` con { length, width, sizeLocale }; nosotros
 * convertimos esa talla a la de BotasLeón (MX) con nuestras fórmulas.
 *
 * El client-id es público (va en el HTML del tema). Se puede sobreescribir con
 * NEXT_PUBLIC_VOLUMENTAL_CLIENT_ID. Si Volumental no autoriza el dominio
 * botasleon.com, el web component simplemente no pinta (no rompe nada).
 */

const CLIENT_ID =
  process.env.NEXT_PUBLIC_VOLUMENTAL_CLIENT_ID || "18c5f003-1bc3-4bcf-9bb2-2a35750db534"
const SDK_SRC = "https://js.volumental.com/sdk/v1/volumental.js"

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
function toSize(detail: { length?: number | string; sizeLocale?: string }, gender: "men" | "women"): SizeResult | null {
  const v = typeof detail.length === "number" ? detail.length : parseFloat(String(detail.length))
  if (!Number.isFinite(v)) return null
  const loc = (detail.sizeLocale || "us").toLowerCase()
  if (loc === "mondo") return sizeFromCm(v / 10, gender) // mondopoint = mm de pie
  if (loc === "eu") return sizeFromScale(v, "EU", gender)
  return sizeFromScale(v, "US", gender) // us (o desconocido) → US
}

export function VolumentalScan({
  productId,
  genderHandle,
}: {
  productId: string
  genderHandle?: string | null
}) {
  const { locale } = useLocale()
  const en = locale === "en"
  const ref = useRef<HTMLDivElement | null>(null)
  const [rec, setRec] = useState<SizeResult | null>(null)
  const gender = genderFromHandle(genderHandle) ?? "men"

  useEffect(() => {
    if (!CLIENT_ID) return
    loadSdk()
    const onRec = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      const r = toSize(detail, gender)
      if (r) setRec(r)
    }
    // El evento puede emitirse en el elemento o en window; escuchamos ambos.
    window.addEventListener("volumental:on-recommendation", onRec as EventListener)
    const el = ref.current
    el?.addEventListener("volumental:on-recommendation", onRec as EventListener)
    return () => {
      window.removeEventListener("volumental:on-recommendation", onRec as EventListener)
      el?.removeEventListener("volumental:on-recommendation", onRec as EventListener)
    }
  }, [gender])

  if (!CLIENT_ID) return null

  return (
    <div ref={ref} className="mt-2">
      {createElement("volumental-recommendation", {
        "product-id": productId,
        "size-locale": "us",
        "product-gender-age": gender === "men" ? "male" : "female",
        "component-type": "sizechart-button",
        variant: "button",
      })}

      {rec && (
        <div className="mt-2 rounded-lg border border-leather bg-bg-alt p-3">
          <p className="text-xs text-text-subtle uppercase tracking-wider mb-0.5">
            {en ? "Your BotasLeón size" : "Tu talla BotasLeón"}
          </p>
          <p className="font-heading text-xl text-text">
            MX {fmt(rec.mx)} <span className="text-text-subtle text-base">· US {fmt(rec.us)}</span>
          </p>
          {rec.between && (
            <p className="text-xs text-terracotta mt-1">
              {en ? "Between sizes — go with the larger for boots." : "Entre tallas — para bota, la mayor."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
