"use client"

import { useEffect, useState } from "react"
import { COTIZADOR_PASSWORD_HASH, sha256Hex } from "@/lib/cotizacion/config"

/**
 * Candado ligero (del lado del cliente) para la sección de cotización. Compara
 * el SHA-256 de la clave ingresada contra el hash guardado. El "desbloqueo" vive
 * en sessionStorage (dura la sesión). No protege datos sensibles — solo evita el
 * acceso casual a la herramienta.
 */
const SESSION_KEY = "cotizador:unlocked"

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState("")
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true)
    } catch {}
    setReady(true)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw || checking) return
    setChecking(true)
    setError(false)
    const hash = await sha256Hex(pw)
    setChecking(false)
    if (hash === COTIZADOR_PASSWORD_HASH) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1")
      } catch {}
      setUnlocked(true)
    } else {
      setError(true)
      setPw("")
    }
  }

  if (!ready) return null
  if (unlocked) return <>{children}</>

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-leather text-bg">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <h1 className="font-heading text-2xl text-text mb-2">Cotizador de mayoreo</h1>
        <p className="text-text-muted text-sm mb-6">
          Sección interna. Ingresa la contraseña para continuar.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value)
            if (error) setError(false)
          }}
          placeholder="Contraseña"
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-sm border border-border bg-bg px-4 py-3 text-center text-base focus:border-leather focus:outline-none"
        />
        {error && (
          <p className="mt-2 text-sm text-terracotta" aria-live="polite">
            Contraseña incorrecta.
          </p>
        )}
        <button
          type="submit"
          disabled={checking || !pw}
          className="mt-4 w-full rounded-full bg-leather py-3 text-sm uppercase tracking-wider text-bg hover:bg-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {checking ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  )
}
