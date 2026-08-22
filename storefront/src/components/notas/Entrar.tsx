"use client"

import { useState, useSyncExternalStore } from "react"
import {
  CambioDeClaveRequerido,
  authEnabled,
  cerrarSesion,
  definirClaveNueva,
  haySesion,
  iniciarSesion,
  noHaySesionEnServidor,
  suscribirSesion,
} from "@/lib/api/session"

/**
 * Puerta de las herramientas internas.
 *
 * Sustituye al PasswordGate del cotizador, que era un SHA-256 comparado en el
 * navegador: servía para que no entrara un curioso, pero no era una identidad.
 * Ahora es Cognito, y de ahí sale el `vendedor_id` que firma cada documento.
 *
 * Cubre el reto NEW_PASSWORD_REQUIRED porque TODO primer ingreso pasa por él:
 * Cognito crea al usuario con contraseña temporal y no entrega tokens hasta que
 * se cambia.
 */
export function Entrar({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore y no un efecto: leer localStorage en useEffect para
  // luego llamar a setState provoca un render de más y desincroniza el estado
  // entre pestañas. Aquí la sesión ES la fuente externa.
  const dentro = useSyncExternalStore(
    suscribirSesion,
    haySesion,
    noHaySesionEnServidor
  )

  const [email, setEmail] = useState("")
  const [clave, setClave] = useState("")
  const [claveNueva, setClaveNueva] = useState("")
  const [reto, setReto] = useState<{ session: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!authEnabled()) {
    return (
      <p className="text-sm text-text-muted">
        Falta configurar <code>NEXT_PUBLIC_COGNITO_CLIENT_ID</code>. Esta sección
        está apagada en este despliegue.
      </p>
    )
  }

  if (dentro) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={cerrarSesion}
            className="text-xs text-text-muted underline underline-offset-4 hover:text-leather"
          >
            Salir
          </button>
        </div>
        {children}
      </>
    )
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      if (reto) {
        await definirClaveNueva(reto.email, reto.session, claveNueva)
      } else {
        await iniciarSesion(email.trim(), clave)
      }
      // No hace falta setDentro: guardar la sesión notifica al store.
    } catch (err) {
      if (err instanceof CambioDeClaveRequerido) {
        // No es un error: es el segundo paso del primer ingreso.
        setReto({ session: err.session, email: err.email })
        setError(null)
      } else {
        setError(err instanceof Error ? err.message : "No se pudo entrar")
      }
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    "w-full border border-border bg-bg px-3 py-2.5 text-sm focus:border-leather focus:outline-none"

  return (
    <form onSubmit={enviar} className="max-w-sm mx-auto py-16">
      <h1 className="font-display text-2xl text-text mb-1">
        {reto ? "Define tu contraseña" : "Herramientas internas"}
      </h1>
      <p className="text-sm text-text-muted mb-6">
        {reto
          ? "Es tu primer ingreso: elige una contraseña de al menos 12 caracteres, con mayúscula, minúscula y número."
          : "Cotizaciones y notas de venta."}
      </p>

      {!reto ? (
        <div className="space-y-3">
          <input
            type="email"
            autoComplete="username"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className={campo}
            required
          />
        </div>
      ) : (
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Contraseña nueva"
          value={claveNueva}
          onChange={(e) => setClaveNueva(e.target.value)}
          className={campo}
          minLength={12}
          required
        />
      )}

      {error && <p className="mt-3 text-sm text-leather">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 w-full bg-text py-3 text-sm text-bg hover:bg-leather-light disabled:opacity-50 transition-colors"
      >
        {enviando ? "Un momento…" : reto ? "Guardar y entrar" : "Entrar"}
      </button>
    </form>
  )
}
