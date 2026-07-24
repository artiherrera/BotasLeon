"use client"

import { useRef, useState } from "react"
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary"

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
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const MAX_PHOTOS = 5

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = "" // permite volver a elegir el mismo archivo
    if (!files.length) return
    setError("")
    setUploading(true)
    try {
      const room = MAX_PHOTOS - photos.length
      const urls: string[] = []
      for (const f of files.slice(0, room)) {
        if (f.size > 8 * 1024 * 1024) {
          setError("Cada foto debe pesar menos de 8 MB.")
          continue
        }
        urls.push(await uploadToCloudinary(f))
      }
      if (urls.length) setPhotos((p) => [...p, ...urls].slice(0, MAX_PHOTOS))
    } catch {
      setError("No se pudo subir la foto. Intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (url: string) => setPhotos((p) => p.filter((u) => u !== url))

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
    if (uploading) {
      setError("Espera a que terminen de subir las fotos.")
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
      // Fotos (URLs de Cloudinary) → Judge.me las importa. Convención Rails de
      // arreglo: picture_urls[].
      photos.forEach((u) => params.append("picture_urls[]", u))
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

      {/* Fotos (solo si Cloudinary está configurado) */}
      {cloudinaryEnabled() && (
        <div>
          <span className="mb-1.5 block text-xs text-text-muted">
            Fotos (opcional) — hasta {MAX_PHOTOS}
          </span>
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              <div
                key={url}
                className="relative h-16 w-16 overflow-hidden rounded-sm border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen de Cloudinary subida por el usuario */}
                <img src={url} alt="Foto de la reseña" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Quitar foto"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-bg"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-border text-text-subtle hover:border-leather hover:text-leather disabled:opacity-40 transition-colors"
                aria-label="Agregar foto"
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-leather" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-xs text-terracotta">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={sending || uploading}
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
