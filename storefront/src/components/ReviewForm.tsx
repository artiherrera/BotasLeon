"use client"

import { useState } from "react"

/**
 * ReviewForm — formulario nativo para que un cliente deje una reseña SIN salir
 * de botasleon.com. Envía directo a la API pública de Judge.me
 * (POST https://judge.me/api/v1/reviews) — mismo mecanismo que el formulario
 * público del widget, sin token (la tienda tiene "web reviews" habilitado).
 *
 * Usamos mode:"no-cors" para evitar bloqueos CORS del navegador: la petición SÍ
 * llega a Judge.me (es una "simple request" con form-urlencoded), aunque la
 * respuesta sea opaca. Por eso mostramos éxito optimista; la reseña aparece tras
 * la moderación/auto-publicación de Judge.me y sincroniza al sitio vía metafield.
 */
const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? ""

const inputCls =
  "w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm focus:border-leather focus:outline-none"

export function ReviewForm({
  productId,
  productTitle,
}: {
  productId: string
  productTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError("Elige una calificación con las estrellas.")
      return
    }
    if (!name.trim() || !email.trim() || !body.trim()) {
      setError("Completa tu nombre, correo y reseña.")
      return
    }
    setError("")
    setSending(true)
    try {
      const params = new URLSearchParams({
        shop_domain: SHOP_DOMAIN,
        platform: "shopify",
        id: productId,
        name: name.trim(),
        email: email.trim(),
        rating: String(rating),
        title: title.trim(),
        body: body.trim(),
      })
      await fetch("https://judge.me/api/v1/reviews", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      })
      setSent(true)
    } catch {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-sm border border-leather/30 bg-leather/5 p-4 text-sm text-text">
        ¡Gracias por tu reseña! 🎉 Se publicará en breve.
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex self-start rounded-full border border-leather px-5 py-2.5 text-sm uppercase tracking-wider text-leather hover:bg-leather hover:text-bg transition-colors"
      >
        Escribir una reseña
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-sm border border-border p-4">
      <div>
        <span className="mb-1 block text-xs text-text-muted">Tu calificación</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              className="text-2xl leading-none"
            >
              <span className={(hover || rating) >= n ? "text-gold" : "text-border"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className={inputCls}
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputCls}
          type="email"
          placeholder="Tu correo (no se publica)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <input
        className={inputCls}
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${inputCls} resize-none`}
        rows={4}
        placeholder={`¿Qué te parecieron las ${productTitle}?`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {error && <p className="text-xs text-terracotta">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-leather px-5 py-2.5 text-sm uppercase tracking-wider text-bg hover:bg-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? "Enviando…" : "Publicar reseña"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          Cancelar
        </button>
      </div>
      <p className="text-[11px] text-text-subtle">
        Tu correo no se publica. Tu reseña puede tardar un poco en aparecer tras revisión.
      </p>
    </form>
  )
}
