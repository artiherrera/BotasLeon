/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Detección automática de la TARJETA de referencia (ISO ID-1, 85.6×54 mm) en la
 * foto, con OpenCV.js. Devuelve los dos extremos del BORDE LARGO de la tarjeta
 * (en coordenadas de la imagen), o null si no la encuentra.
 *
 * OpenCV.js (~8 MB) se carga DIFERIDO desde CDN solo cuando el usuario sube una
 * foto en el buscador de talla. Si falla la carga o no detecta nada, el usuario
 * ajusta los marcadores a mano (el mecanismo manual sigue intacto).
 *
 * El pie NO se detecta (requiere segmentación) — eso queda manual.
 */

const OPENCV_SRC = "https://docs.opencv.org/4.10.0/opencv.js"
const CARD_ASPECT = 85.6 / 53.98 // ≈ 1.586

export type Pt = { x: number; y: number }

let cvPromise: Promise<any> | null = null

/** Carga OpenCV.js una sola vez y resuelve cuando el runtime wasm está listo. */
export function loadOpenCv(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as any
  if (w.cv && w.cv.Mat) return Promise.resolve(w.cv)
  if (cvPromise) return cvPromise
  cvPromise = new Promise<any>((resolve, reject) => {
    const done = () => {
      const start = Date.now()
      const poll = () => {
        if (w.cv && w.cv.Mat) resolve(w.cv)
        else if (Date.now() - start > 25000) reject(new Error("opencv init timeout"))
        else setTimeout(poll, 120)
      }
      poll()
    }
    const existing = document.getElementById("opencv-sdk") as HTMLScriptElement | null
    if (existing) { done(); return }
    const s = document.createElement("script")
    s.id = "opencv-sdk"
    s.src = OPENCV_SRC
    s.async = true
    s.onload = done
    s.onerror = () => { cvPromise = null; reject(new Error("opencv load failed")) }
    document.body.appendChild(s)
  })
  return cvPromise
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Detecta la tarjeta y devuelve los extremos de su borde largo, en coordenadas
 * de la IMAGEN original (px). null si no hay candidato confiable.
 */
export function detectCardLongEdge(
  cv: any,
  source: CanvasImageSource,
  imgW: number,
  imgH: number
): { p0: Pt; p1: Pt } | null {
  // Escala de detección (acota a maxDim para velocidad).
  const maxDim = 1000
  const detScale = Math.min(1, maxDim / Math.max(imgW, imgH))
  const dw = Math.round(imgW * detScale)
  const dh = Math.round(imgH * detScale)
  const canvas = document.createElement("canvas")
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, dw, dh)

  let src: any, gray: any, edges: any, kernel: any, contours: any, hierarchy: any
  try {
    src = cv.imread(canvas)
    gray = new cv.Mat()
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0)
    edges = new cv.Mat()
    cv.Canny(gray, edges, 60, 180)
    kernel = cv.Mat.ones(3, 3, cv.CV_8U)
    cv.dilate(edges, edges, kernel)
    contours = new cv.MatVector()
    hierarchy = new cv.Mat()
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    const imgArea = dw * dh
    let best: { p0: Pt; p1: Pt } | null = null
    let bestScore = Infinity

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i)
      const peri = cv.arcLength(cnt, true)
      const approx = new cv.Mat()
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true)
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = Math.abs(cv.contourArea(approx))
        if (area > imgArea * 0.006 && area < imgArea * 0.45) {
          const p: Pt[] = []
          for (let j = 0; j < 4; j++) p.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] })
          const L = [dist(p[0], p[1]), dist(p[1], p[2]), dist(p[2], p[3]), dist(p[3], p[0])]
          const avgA = (L[0] + L[2]) / 2 // lados 0,2
          const avgB = (L[1] + L[3]) / 2 // lados 1,3
          const longAvg = Math.max(avgA, avgB)
          const shortAvg = Math.min(avgA, avgB)
          if (shortAvg > 0) {
            const aspect = longAvg / shortAvg
            const score = Math.abs(aspect - CARD_ASPECT)
            // Aspecto de tarjeta (~1.586) con tolerancia; descarta hoja (~1.3/1.41).
            if (aspect > 1.35 && aspect < 1.9 && score < bestScore) {
              bestScore = score
              // Extremos del borde LARGO (a escala imagen).
              const inv = 1 / detScale
              const longIsA = avgA >= avgB
              const e = longIsA ? [p[0], p[1]] : [p[1], p[2]]
              best = {
                p0: { x: e[0].x * inv, y: e[0].y * inv },
                p1: { x: e[1].x * inv, y: e[1].y * inv },
              }
            }
          }
        }
      }
      approx.delete()
      cnt.delete()
    }
    return best
  } catch {
    return null
  } finally {
    src?.delete()
    gray?.delete()
    edges?.delete()
    kernel?.delete()
    contours?.delete()
    hierarchy?.delete()
  }
}

/**
 * Detecta el PIE por contraste (pie descalzo sobre una hoja/fondo claro) y
 * devuelve los extremos de su eje largo (≈ talón y punta), en coordenadas de la
 * imagen. Solo funciona con fondo liso y buen contraste; si no, devuelve null.
 */
export function detectFootAxis(
  cv: any,
  source: CanvasImageSource,
  imgW: number,
  imgH: number
): { p0: Pt; p1: Pt } | null {
  const maxDim = 900
  const detScale = Math.min(1, maxDim / Math.max(imgW, imgH))
  const dw = Math.round(imgW * detScale)
  const dh = Math.round(imgH * detScale)
  const canvas = document.createElement("canvas")
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, dw, dh)

  let src: any, gray: any, bw: any, kernel: any, contours: any, hierarchy: any
  try {
    src = cv.imread(canvas)
    gray = new cv.Mat()
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0)
    bw = new cv.Mat()
    // Otsu invertido: el pie (más oscuro que el papel claro) queda en blanco.
    cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU)
    kernel = cv.Mat.ones(7, 7, cv.CV_8U)
    cv.morphologyEx(bw, bw, cv.MORPH_CLOSE, kernel)
    cv.morphologyEx(bw, bw, cv.MORPH_OPEN, kernel)
    contours = new cv.MatVector()
    hierarchy = new cv.Mat()
    cv.findContours(bw, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    const imgArea = dw * dh
    let bestCnt: any = null
    let bestScore = 0
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i)
      const area = Math.abs(cv.contourArea(cnt))
      if (area < imgArea * 0.03) { cnt.delete(); continue }
      const rect = cv.minAreaRect(cnt)
      const w = rect.size.width, h = rect.size.height
      const long = Math.max(w, h), short = Math.min(w, h)
      const aspect = short > 0 ? long / short : 0
      // El pie es grande y ALARGADO (aspect ~1.9–4.5); descarta la tarjeta (~1.6).
      if (aspect > 1.85 && aspect < 5) {
        const score = area * Math.min(aspect, 3)
        if (score > bestScore) {
          bestScore = score
          if (bestCnt) bestCnt.delete()
          bestCnt = cnt
          continue
        }
      }
      cnt.delete()
    }
    if (!bestCnt) return null

    const rect = cv.minAreaRect(bestCnt)
    bestCnt.delete()
    const cx = rect.center.x, cy = rect.center.y
    const rad = (rect.angle * Math.PI) / 180
    // Ángulo del eje LARGO.
    const longAxis = rect.size.width >= rect.size.height ? rad : rad + Math.PI / 2
    const halfLong = Math.max(rect.size.width, rect.size.height) / 2
    const ex = Math.cos(longAxis) * halfLong
    const ey = Math.sin(longAxis) * halfLong
    const inv = 1 / detScale
    return {
      p0: { x: (cx - ex) * inv, y: (cy - ey) * inv },
      p1: { x: (cx + ex) * inv, y: (cy + ey) * inv },
    }
  } catch {
    return null
  } finally {
    src?.delete()
    gray?.delete()
    bw?.delete()
    kernel?.delete()
    contours?.delete()
    hierarchy?.delete()
  }
}
