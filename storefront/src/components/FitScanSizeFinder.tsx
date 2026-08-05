"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import { usOffset, type GenderHandle } from "@/lib/sizes"

/**
 * FitScanSizeFinder — integra el widget "Find Your Size" de FitScan
 * (https://fitscan.io) en la ficha de producto para ayudar a acertar la talla.
 *
 * IMPORTANTE (verificado contra el SDK real v1.0.4):
 *  - Requiere una API key `fs_...`. Se configura en `NEXT_PUBLIC_FITSCAN_KEY`.
 *    SIN key este componente NO renderiza nada (el sitio queda intacto).
 *  - Cargamos el script SIN `data-key` para evitar el auto-init y llamar a
 *    `FitScan.init(...)` nosotros con el contexto del producto (marca, género,
 *    idioma). Auto-init solo dispara si el <script> trae data-key.
 *  - El widget devuelve talla en US/EU/UK (NO MX). Le añadimos abajo el mapeo a
 *    MX con nuestras fórmulas (hombre +19, mujer +17).
 *  - El "add to cart" interno de FitScan pega a /cart/add.js (tema Shopify), que
 *    NO existe en headless — por eso NO lo usamos; leemos el evento `result`.
 *  - Carga diferida: el SDK de terceros solo se baja cuando el cliente abre el
 *    buscador de talla (mejor performance y privacidad).
 *
 * Limitaciones conocidas de FitScan (a validar con la cuenta):
 *  - UI del widget solo en inglés/ruso (no español) en el SDK actual.
 *  - El escaneo con foto es de tier pago; el gratis es calculadora.
 *  - BotasLeón no es una "marca reconocida" → usa fórmula genérica de talla.
 */

const FITSCAN_KEY = process.env.NEXT_PUBLIC_FITSCAN_KEY
// Marca de REFERENCIA que FitScan sí conoce (la que elegiste en el onboarding,
// ej. "Timberland"). NO usamos el vendor real (Cabrera/Armenta/Josepha…) porque
// FitScan no lo conoce → caería a una fórmula genérica. La talla US resultante
// la convertimos a MX abajo. Si se deja vacío, FitScan usa la marca por defecto
// de tu cuenta.
const FITSCAN_BRAND = process.env.NEXT_PUBLIC_FITSCAN_BRAND
// El SDK se sirve en /sdk/fitscan.js (/widget.js da 404 pese al comentario del
// propio SDK). Es el mismo src que trae el snippet del panel de FitScan.
const FITSCAN_SRC = "https://fitscan.io/sdk/fitscan.js"

type FitScanResult = {
  us?: string | number
  eu?: string | number
  uk?: string | number
  size_us?: string | number
}

type FitScanApi = {
  init: (config: Record<string, unknown>) => void
  on: (event: string, cb: (payload: unknown) => void) => void
  destroy?: () => void
}

declare global {
  interface Window {
    FitScan?: FitScanApi
  }
}

let sdkPromise: Promise<void> | null = null
function loadFitScanSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.FitScan?.init) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.id = "fitscan-sdk"
    script.src = FITSCAN_SRC // sin data-key → no auto-init; iniciamos manual
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      sdkPromise = null
      reject(new Error("No se pudo cargar el SDK de FitScan"))
    }
    document.body.appendChild(script)
  })
  return sdkPromise
}

/** metaobject "sexo objetivo" → parámetro gender de FitScan. */
function fsGender(genderHandle?: string | null): "men" | "women" | "unisex" {
  if (genderHandle === "masculino") return "men"
  if (genderHandle === "femenino") return "women"
  return "unisex"
}

/** US → MX aprox. con nuestras fórmulas (hombre +19, mujer +17). */
function usToMx(us: string | number | undefined, genderHandle?: string | null): string | null {
  const offset = usOffset((genderHandle ?? "") as GenderHandle)
  if (offset == null || us == null) return null
  const n = parseFloat(String(us))
  if (!Number.isFinite(n)) return null
  const mx = n + offset
  return Number.isInteger(mx) ? String(mx) : mx.toFixed(1)
}

export function FitScanSizeFinder({
  productId,
  genderHandle,
}: {
  productId: string
  genderHandle?: string | null
}) {
  const { locale } = useLocale()
  const en = locale === "en"
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [rec, setRec] = useState<{ us?: string | number; mx: string | null } | null>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!open || !FITSCAN_KEY || initedRef.current) return
    let cancelled = false
    setStatus("loading")
    loadFitScanSdk()
      .then(() => {
        if (cancelled || !window.FitScan?.init) return
        initedRef.current = true
        const config: Record<string, unknown> = {
          apiKey: FITSCAN_KEY,
          container: "#fitscan-widget",
          productId,
          gender: fsGender(genderHandle),
          locale: en ? "en" : "es", // el SDK cae a inglés si no hay 'es'
        }
        if (FITSCAN_BRAND) config.brand = FITSCAN_BRAND
        window.FitScan.init(config)
        window.FitScan.on("result", (payload: unknown) => {
          const r = (payload || {}) as FitScanResult
          const us = r.us ?? r.size_us
          setRec({ us, mx: usToMx(us, genderHandle) })
        })
        window.FitScan.on("error", () => {
          if (!cancelled) setStatus("error")
        })
        if (!cancelled) setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [open, productId, genderHandle, en])

  // Sin API key configurada → no renderizamos nada (sitio intacto).
  if (!FITSCAN_KEY) return null

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-leather underline underline-offset-2 hover:text-text transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6l3 1m0 0l-3 9a5 5 0 0 0 6 0l-3-9m0 0l6-2m6 2l3-1m-3 1l-3 9a5 5 0 0 0 6 0l-3-9m0 0l-6-2m0-2v2m0 16V8" />
          </svg>
          {en ? "Not sure of your size? Find it" : "¿No sabes tu talla? Encuéntrala"}
        </button>
      ) : (
        <div className="rounded-md border border-border bg-bg-alt p-3">
          <div id="fitscan-widget" aria-live="polite" />

          {status === "loading" && (
            <p className="text-xs text-text-subtle">{en ? "Loading…" : "Cargando…"}</p>
          )}
          {status === "error" && (
            <p className="text-xs text-terracotta">
              {en ? "Couldn't load the size finder. Try again later." : "No se pudo cargar el buscador de talla. Intenta más tarde."}
            </p>
          )}

          {/* FitScan devuelve US/EU/UK; añadimos la talla MX de BotasLeón. */}
          {rec?.mx && (
            <p className="mt-2 text-sm text-text">
              {en ? "Your BotasLeón size ≈ " : "Tu talla BotasLeón ≈ "}
              <strong>MX {rec.mx}</strong>
              {rec.us != null && <span className="text-text-subtle"> · US {String(rec.us)}</span>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
