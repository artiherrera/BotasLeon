import { formatMoney, saleInfo } from "@/lib/utils"
import { msiMonthly, MSI_DISPLAY_MONTHS } from "@/lib/msi"
import type { SeleccionItem, SeleccionMeta } from "./pdf"

/**
 * PNG de una SELECCIÓN de productos — misma info que el PDF (foto + nombre +
 * marca + precio de cada bota) pero como UNA sola imagen, ideal para compartir
 * por WhatsApp. Se dibuja a un <canvas> (sin dependencias) y se exporta a Blob.
 *
 * Reutiliza las MISMAS funciones de precio del sitio (formatMoney/saleInfo/
 * msiMonthly) para que el precio coincida con las cards y con el PDF.
 */

const C = {
  bg: "#FBF8F1",
  card: "#FFFFFF",
  imgBox: "#F4E9D8",
  text: "#1F1814",
  muted: "#5A4F44",
  subtle: "#8A7E6E",
  leather: "#3B2A20",
  brown: "#8B5A2B",
  terracotta: "#8B3A24",
  border: "#D8D0C2",
}

const STR = {
  es: { subtitle: "SELECCIÓN DE PRODUCTOS", products: "productos", product: "producto", from: "Desde", perMonth: "al mes", msi: "MSI" },
  en: { subtitle: "PRODUCT SELECTION", products: "products", product: "product", from: "From", perMonth: "/mo", msi: "MSI" },
}

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

type LoadedImg = { img: HTMLImageElement | null }

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // cdn.shopify.com permite CORS → canvas no se "tiñe"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Envuelve `text` a máximo `maxLines` líneas dentro de `maxWidth` (con elipsis). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const w of words) {
    const test = current ? `${current} ${w}` : w
    if (ctx.measureText(test).width <= maxWidth || !current) {
      current = test
    } else {
      lines.push(current)
      current = w
      if (lines.length === maxLines - 1) break
    }
  }
  // Lo que quede va en la última línea (recortando con elipsis si hace falta).
  let last = current
  const remainingStart = lines.length === maxLines - 1 ? words.indexOf(last.split(" ")[0]) : -1
  if (remainingStart >= 0) last = words.slice(remainingStart).join(" ")
  if (lines.length < maxLines) {
    if (ctx.measureText(last).width > maxWidth) {
      while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth) {
        last = last.slice(0, -1)
      }
      last += "…"
    }
    lines.push(last)
  }
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generateSeleccionPng(
  items: SeleccionItem[],
  meta: SeleccionMeta
): Promise<Blob> {
  const L = STR[meta.locale] ?? STR.es

  // Layout en px CSS (se escala x2 para nitidez).
  const W = 1200
  const pad = 44
  const cols = 3
  const colGap = 24
  const rowGap = 26
  const cardW = (W - 2 * pad - (cols - 1) * colGap) / cols
  const imgBoxH = 260
  const textH = 120
  const cardH = imgBoxH + textH
  const rows = Math.ceil(items.length / cols)

  const headerH = 150 // marca + subtítulo + reglas + contexto
  const footerH = 54
  const gridTop = headerH
  const H = gridTop + rows * cardH + (rows - 1) * rowGap + footerH + pad

  const scale = 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(H * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2D context")
  ctx.scale(scale, scale)

  // Fuentes web listas (si las hay) — igual usamos familias genéricas.
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {}

  // Fondo
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // === Header ===
  const cx = W / 2
  // Reglas laterales a los lados del wordmark
  ctx.strokeStyle = C.leather
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - 250, 40)
  ctx.lineTo(cx + 250, 40)
  ctx.stroke()

  ctx.fillStyle = C.leather
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.font = `700 34px ${SERIF}`
  try { ctx.letterSpacing = "8px" } catch {}
  ctx.fillText("BOTAS LEÓN", cx + 4, 78) // +4 compensa el letter-spacing final
  try { ctx.letterSpacing = "0px" } catch {}

  ctx.fillStyle = C.brown
  ctx.font = `600 12px ${SANS}`
  try { ctx.letterSpacing = "3px" } catch {}
  ctx.fillText(L.subtitle, cx + 2, 98)
  try { ctx.letterSpacing = "0px" } catch {}

  ctx.beginPath()
  ctx.moveTo(cx - 250, 112)
  ctx.lineTo(cx + 250, 112)
  ctx.stroke()

  // Contexto (izq) + total/fecha (der)
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = C.text
  ctx.font = `700 15px ${SANS}`
  const ctxLine = meta.contexto || ""
  // recorta el contexto si es larguísimo
  let ctxDraw = ctxLine
  const ctxMax = W - 2 * pad - 170
  if (ctx.measureText(ctxDraw).width > ctxMax) {
    while (ctxDraw.length > 1 && ctx.measureText(ctxDraw + "…").width > ctxMax) ctxDraw = ctxDraw.slice(0, -1)
    ctxDraw += "…"
  }
  ctx.fillText(ctxDraw, pad, 138)

  const totalWord = items.length === 1 ? L.product : L.products
  ctx.textAlign = "right"
  ctx.fillStyle = C.subtle
  ctx.font = `400 11px ${SANS}`
  ctx.fillText(`${items.length} ${totalWord}`, W - pad, 130)
  ctx.fillText(meta.fecha, W - pad, 144)

  // Línea divisoria bajo el contexto
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, 150 - 6)
  ctx.lineTo(W - pad, 150 - 6)
  ctx.stroke()

  // === Precarga de imágenes ===
  const loaded: LoadedImg[] = await Promise.all(
    items.map(async (it) => ({
      img: it.imageUrl
        ? await loadImage(`${it.imageUrl}${it.imageUrl.includes("?") ? "&" : "?"}width=420`)
        : null,
    }))
  )

  // === Grid ===
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = pad + col * (cardW + colGap)
    const y = gridTop + row * (cardH + rowGap)

    // Card
    ctx.fillStyle = C.card
    roundRect(ctx, x, y, cardW, cardH, 6)
    ctx.fill()
    ctx.strokeStyle = C.border
    ctx.lineWidth = 1
    roundRect(ctx, x, y, cardW, cardH, 6)
    ctx.stroke()

    // Caja de imagen
    ctx.fillStyle = C.imgBox
    ctx.save()
    roundRect(ctx, x, y, cardW, imgBoxH, 6)
    ctx.clip()
    ctx.fillRect(x, y, cardW, imgBoxH)
    const im = loaded[i].img
    if (im && im.width && im.height) {
      const s = Math.min(cardW / im.width, imgBoxH / im.height)
      const dw = im.width * s
      const dh = im.height * s
      ctx.drawImage(im, x + (cardW - dw) / 2, y + (imgBoxH - dh) / 2, dw, dh)
    }
    ctx.restore()

    // Texto
    const tx = x + 12
    let ty = y + imgBoxH + 22
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"

    // Título (máx 2 líneas)
    ctx.fillStyle = C.text
    ctx.font = `700 13px ${SANS}`
    const titleLines = wrapText(ctx, it.title, cardW - 24, 2)
    for (const line of titleLines) {
      ctx.fillText(line, tx, ty)
      ty += 17
    }

    // Marca
    if (it.brand) {
      ctx.fillStyle = C.muted
      ctx.font = `400 11px ${SANS}`
      ctx.fillText(it.brand, tx, ty + 2)
    }
    ty += 20

    // Precio (+ tachado de oferta)
    const sale = saleInfo(it.amount, it.compareAt)
    ctx.font = `700 17px ${SANS}`
    ctx.fillStyle = sale.onSale ? C.terracotta : C.text
    const priceStr = formatMoney(it.amount, it.currency)
    ctx.fillText(priceStr, tx, ty)
    if (sale.onSale && it.compareAt) {
      const pw = ctx.measureText(priceStr).width
      const caX = tx + pw + 8
      const caStr = formatMoney(it.compareAt, it.currency)
      ctx.font = `400 12px ${SANS}`
      ctx.fillStyle = C.subtle
      ctx.fillText(caStr, caX, ty)
      const caW = ctx.measureText(caStr).width
      ctx.strokeStyle = C.subtle
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(caX, ty - 4)
      ctx.lineTo(caX + caW, ty - 4)
      ctx.stroke()
    }

    // MSI (solo MXN que califica)
    const monthly = msiMonthly(it.amount, it.currency)
    if (monthly) {
      ctx.fillStyle = C.brown
      ctx.font = `400 10px ${SANS}`
      ctx.fillText(
        `${L.from} ${formatMoney(monthly, it.currency)} ${L.perMonth} · ${MSI_DISPLAY_MONTHS} ${L.msi}`,
        tx,
        ty + 15
      )
    }
  }

  // === Footer ===
  const fy = H - pad + 4
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, fy - 16)
  ctx.lineTo(W - pad, fy - 16)
  ctx.stroke()
  ctx.fillStyle = C.subtle
  ctx.font = `400 11px ${SANS}`
  ctx.textAlign = "left"
  ctx.fillText("BOTAS LEÓN · www.botasleon.com", pad, fy)

  // Export
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob devolvió null"))),
      "image/png"
    )
  })
}
