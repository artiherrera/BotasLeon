"use client"

import { useEffect } from "react"

/**
 * JudgemeWidget — widget oficial de Judge.me embebido en el PDP (headless).
 *
 * Ahora que tenemos el token PÚBLICO (solo lectura, seguro en cliente), cargamos
 * el loader oficial de Judge.me que renderiza el widget completo:
 *   - lista de reseñas CON FOTOS + galería,
 *   - resumen de estrellas,
 *   - formulario "Escribir una reseña" NATIVO (sube fotos solo, sin Cloudinary).
 *
 * El loader (widget_preloader.js) observa el DOM y pinta los <div.jdgm-widget>.
 * shop_domain = dominio PERMANENTE con el que Judge.me registró la tienda
 * (na4ngw-dn), no el renombrado (botas-leon-3).
 *
 * Los colores del widget se configuran en Judge.me → Marca (ponlos en tonos
 * cuero para que combine).
 */
const PUBLIC_TOKEN = "iIcQclYkCEcfwi_C0LCAJNDDxqU"
const SHOP_DOMAIN = "na4ngw-dn.myshopify.com"

type Jdgm = { SHOP_DOMAIN?: string; PLATFORM?: string; PUBLIC_TOKEN?: string }

export function JudgemeWidget({
  productId,
  productTitle,
}: {
  productId: string
  productTitle: string
}) {
  useEffect(() => {
    const w = window as unknown as { jdgm?: Jdgm }
    w.jdgm = w.jdgm || {}
    w.jdgm.SHOP_DOMAIN = SHOP_DOMAIN
    w.jdgm.PLATFORM = "shopify"
    w.jdgm.PUBLIC_TOKEN = PUBLIC_TOKEN

    // El loader (widget_preloader.js) escanea los .jdgm-review-widget y los
    // pinta. Lo cargamos una sola vez; re-ejecutarlo re-escanea el DOM (cubre
    // la navegación SPA a otro PDP).
    const existing = document.getElementById("judgeme-loader")
    if (existing) existing.remove()
    const s = document.createElement("script")
    s.id = "judgeme-loader"
    s.src = "https://cdn.judge.me/widget_preloader.js"
    s.async = true
    s.setAttribute("data-cfasync", "false")
    document.body.appendChild(s)
  }, [productId])

  return (
    <div
      className="jdgm-widget jdgm-review-widget"
      data-id={productId}
      data-product-title={productTitle}
    />
  )
}
