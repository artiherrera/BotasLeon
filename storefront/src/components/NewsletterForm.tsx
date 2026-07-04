"use client"

import { useState } from "react"
import { identify, subscribe, track } from "@/lib/klaviyo/client"

/**
 * NewsletterForm — captura email vía Klaviyo Client Subscriptions API.
 *
 * Flow:
 *  1. Usuario teclea email + click "Suscribirme"
 *  2. Llamamos a Klaviyo subscribe (API pública con company_id)
 *  3. También dispara identify + track 'Subscribed to Newsletter' para
 *     que cualquier Flow basado en evento pueda dispararse (welcome series)
 *  4. UI muestra success state — el form se reemplaza con "¡Gracias!"
 *
 * Si Klaviyo está bloqueado (ad blocker) la subscripción aún funciona vía
 * fetch directo a su API — el snippet onsite es solo para tracking.
 */

type Status = "idle" | "loading" | "success" | "error"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    setError(null)
    try {
      await subscribe(email.trim())
      identify(email.trim(), { Source: "Newsletter footer home" })
      track("Subscribed to Newsletter", { source: "home_footer" })
      setStatus("success")
    } catch (e) {
      console.error("[newsletter] subscribe error:", e)
      setError(e instanceof Error ? e.message : "Error al suscribir")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="text-center" role="status">
        <p className="font-heading text-xl text-leather mb-2">
          ¡Gracias!
        </p>
        <p className="text-text-muted text-sm">
          Pronto recibirás un correo de bienvenida con tu primer descuento.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          disabled={status === "loading"}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="go"
          className="flex-1 px-4 py-3 border border-border bg-bg focus:outline-none focus:border-leather disabled:opacity-60"
          aria-label="Correo electrónico para newsletter con 10% de descuento"
          aria-invalid={status === "error"}
          aria-describedby={error ? "newsletter-error" : undefined}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-full bg-leather text-bg font-medium hover:bg-text transition-colors disabled:opacity-60"
          aria-label="Suscribirme y recibir mi cupón de 10%"
        >
          {status === "loading" ? "Enviando..." : "Suscribirme"}
        </button>
        {error && (
          <p id="newsletter-error" className="text-xs text-red-700 sm:w-full mt-1" role="alert">
            {error}
          </p>
        )}
      </form>
      <p className="text-xs text-text-subtle mt-3 text-center">
        El descuento llega a tu correo al confirmar.
      </p>
    </div>
  )
}
