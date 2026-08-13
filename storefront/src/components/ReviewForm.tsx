"use client"

import { useRef, useState } from "react"
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary"
import { useT } from "@/lib/i18n/context"

/**
 * ReviewForm — formulario nativo para que un cliente deje una reseña SIN salir
 * de botasleon.com. Envía directo a la API pública de Judge.me
 * (POST https://judge.me/api/v1/reviews) — mismo mecanismo que el formulario
 * público del widget, sin token (la tienda tiene "web reviews" habilitado).
 *
 * Judge.me responde con CORS abierto (access-control-allow-origin: *), así que
 * leemos la respuesta real (201 = OK, o el mensaje de error) y mostramos éxito
 * o error de verdad — nada de "éxito optimista". La reseña aparece tras la
 * moderación/auto-publicación de Judge.me y sincroniza al sitio vía metafield.
 */
// ⚠️ Judge.me tiene la tienda registrada bajo el dominio PERMANENTE de Shopify
// (na4ngw-dn), NO el renombrado (botas-leon-3) que usa la Storefront API. Con el
// dominio equivocado la API responde "Shop not found" y la reseña se pierde en
// silencio (por el mode:"no-cors"). Verificado a mano con la API de Judge.me.
const JUDGEME_SHOP_DOMAIN = "na4ngw-dn.myshopify.com"

const inputCls =
  "w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm focus:border-leather focus:outline-none"

export function ReviewForm({
  productId,
  productTitle,
}: {
  productId: string
  productTitle: string
}) {
  const t = useT()
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

  // La API de Judge.me solo importa 1 foto por reseña vía picture_urls; con
  // varias importa CERO (verificado). Por eso limitamos a 1.
  const MAX_PHOTOS = 1

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = "" // permite volver a elegir el mismo archivo
    if (!files.length) return
    setError("")
    setUploading(true)
    const room = MAX_PHOTOS - photos.length
    let failed = 0
    let lastErr = ""
    // Sube CADA foto de forma independiente: si una falla, no se pierden las
    // demás (antes un solo error descartaba TODO el lote). Cada éxito se agrega
    // al estado en el momento.
    for (const f of files.slice(0, room)) {
      if (f.size > 8 * 1024 * 1024) {
        failed++
        lastErr = t("review.errPhotoSize")
        continue
      }
      try {
        const url = await uploadToCloudinary(f)
        setPhotos((p) => (p.length < MAX_PHOTOS && !p.includes(url) ? [...p, url] : p))
      } catch (err) {
        failed++
        lastErr = err instanceof Error ? err.message : "error"
        console.error("[review-photo] error de subida:", err)
      }
    }
    setUploading(false)
    if (failed) {
      setError(
        t("review.errUpload")
          .replace("{n}", String(failed))
          .replace("{s}", failed > 1 ? "s" : "")
          .replace("{err}", lastErr)
      )
    }
  }

  const removePhoto = (url: string) => setPhotos((p) => p.filter((u) => u !== url))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError(t("review.errRating"))
      return
    }
    if (!name.trim() || !email.trim() || !body.trim()) {
      setError(t("review.errRequired"))
      return
    }
    if (uploading) {
      setError(t("review.errWaitUpload"))
      return
    }
    setError("")
    setSending(true)
    try {
      const params = new URLSearchParams({
        shop_domain: JUDGEME_SHOP_DOMAIN,
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
      const res = await fetch("https://judge.me/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      })
      const data = (await res.json().catch(() => null)) as { message?: string } | null
      const message = data?.message ?? ""
      // Éxito = 2xx y sin mensaje de error (Judge.me devuelve "…being processed…").
      if (res.ok && !/not found|invalid|error|missing|fail/i.test(message)) {
        setSent(true)
      } else {
        setError(message || t("review.errSubmitHttp").replace("{n}", String(res.status)))
      }
    } catch {
      setError(t("review.errNetwork"))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-sm border border-leather/30 bg-text/5 p-4 text-sm text-text">
        {t("review.thanks")}
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex self-start border border-leather px-5 py-2.5 text-sm text-leather hover:bg-text hover:text-bg transition-colors"
      >
        {t("review.write")}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-sm border border-border p-4">
      <div>
        <span className="mb-1 block text-xs text-text-muted">{t("review.yourRating")}</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={t("review.starAria")
                .replace("{n}", String(n))
                .replace("{s}", n > 1 ? "s" : "")}
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
          placeholder={t("review.phName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputCls}
          type="email"
          placeholder={t("review.phEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <input
        className={inputCls}
        placeholder={t("review.phTitle")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${inputCls} resize-none`}
        rows={4}
        placeholder={t("review.phBody").replace("{title}", productTitle)}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* Fotos (solo si Cloudinary está configurado) */}
      {cloudinaryEnabled() && (
        <div>
          <span className="mb-1.5 block text-xs text-text-muted">
            {t("review.photoOptional")}
          </span>
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              <div
                key={url}
                className="relative h-16 w-16 overflow-hidden rounded-sm border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen de Cloudinary subida por el usuario */}
                <img src={url} alt={t("review.photoAlt")} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label={t("review.removePhoto")}
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
                aria-label={t("review.addPhoto")}
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-leather" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                )}
              </button>
            )}
          </div>
          {/* sr-only en vez de hidden: display:none puede impedir que
              fileRef.click() abra el selector en iOS Safari. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            className="sr-only"
          />
        </div>
      )}

      {error && <p className="text-xs text-terracotta">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={sending || uploading}
          className=" bg-text px-5 py-2.5 text-sm text-bg hover:bg-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? t("review.sending") : t("review.submit")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          {t("review.cancel")}
        </button>
      </div>
      <p className="text-[11px] text-text-subtle">{t("review.disclaimer")}</p>
    </form>
  )
}
