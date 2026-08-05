"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocale } from "@/lib/i18n/context"
import {
  type Gender,
  type SizeResult,
  type SizeScale,
  CARD_LONG_MM,
  genderFromHandle,
  sizeFromScale,
  sizeFromCm,
  sizeRows,
} from "@/lib/sizing/chart"
import { loadOpenCv, detectCardLongEdge, detectFootAxis } from "@/lib/sizing/cardDetect"

/**
 * "Encuentra tu talla" — herramienta propia de BotasLeón (sin terceros, sin
 * CORS, en español). Tres métodos:
 *   1. Ya sé mi talla (US/MX/EU)  → conversión directa.
 *   2. Medir el pie (cm)          → conversión con nuestras fórmulas.
 *   3. Con la cámara (asistida)   → foto del pie + una tarjeta como escala; el
 *      usuario ajusta 2 marcadores (tarjeta y talón–punta) y calculamos los cm.
 *
 * Convierte a talla BotasLeón (MX · US) con chart.ts (calibrado con datos de
 * fábrica). Muestra avisos de "entre tallas" / fuera de rango y una nota de
 * horma opcional.
 */

type Pt = { x: number; y: number }
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export function SizeFinder({
  genderHandle,
  fitNote,
}: {
  genderHandle?: string | null
  fitNote?: string | null
}) {
  const { locale } = useLocale()
  const en = locale === "en"
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const T = en ? EN : ES

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-border bg-bg-alt px-4 py-3 text-left transition-all hover:border-leather hover:shadow-sm active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-leather text-bg transition-transform group-hover:scale-105">
          {/* regla */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
            <path d="M7 8v3M11 8v4M15 8v3M19 8v3" />
          </svg>
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-sm font-semibold text-text">{T.trigger}</span>
          <span className="block text-xs text-text-subtle mt-0.5">{T.triggerSub}</span>
        </span>
        <svg
          className="flex-shrink-0 text-text-subtle transition-all group-hover:text-leather group-hover:translate-x-0.5"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {mounted && open &&
        createPortal(
          <Modal onClose={() => setOpen(false)} en={en} T={T} genderHandle={genderHandle} fitNote={fitNote} />,
          document.body
        )}
    </div>
  )
}

function Modal({
  onClose,
  en,
  T,
  genderHandle,
  fitNote,
}: {
  onClose: () => void
  en: boolean
  T: typeof ES
  genderHandle?: string | null
  fitNote?: string | null
}) {
  const [gender, setGender] = useState<Gender>(genderFromHandle(genderHandle) ?? "men")
  const [tab, setTab] = useState<"known" | "measure" | "camera">("known")
  const [result, setResult] = useState<SizeResult | null>(null)

  // Escape para cerrar + bloquear scroll de fondo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: "known", label: T.tabKnown },
    { id: "measure", label: T.tabMeasure },
    { id: "camera", label: T.tabCamera },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={T.title}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-bg rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-heading text-lg text-text">{T.title}</h2>
          <button type="button" onClick={onClose} aria-label={T.close} className="text-text-subtle hover:text-text p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Género */}
          <div className="flex gap-2 mb-4">
            {(["men", "women"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => { setGender(g); setResult(null) }}
                className={`flex-1 py-2 text-sm rounded-full border transition-colors ${
                  gender === g ? "border-leather bg-leather text-bg" : "border-border text-text-muted hover:border-leather"
                }`}
              >
                {g === "men" ? T.men : T.women}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-bg-alt p-1 mb-4">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => { setTab(tb.id); setResult(null) }}
                className={`flex-1 py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  tab === tb.id ? "bg-bg text-text shadow-sm font-medium" : "text-text-muted"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "known" && <KnownTab gender={gender} T={T} onResult={setResult} />}
          {tab === "measure" && <MeasureTab gender={gender} T={T} onResult={setResult} />}
          {tab === "camera" && <CameraTab gender={gender} T={T} onResult={setResult} />}

          {result && <ResultBox result={result} T={T} fitNote={fitNote} />}

          {/* Mini tabla de referencia */}
          <details className="mt-4">
            <summary className="text-xs text-text-subtle cursor-pointer hover:text-text">{T.showTable}</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs text-text-muted">
                <thead><tr className="text-text-subtle"><th className="text-left py-1">MX</th><th className="text-left">US</th><th className="text-left">EU</th><th className="text-left">{T.footCm}</th></tr></thead>
                <tbody>
                  {sizeRows(gender).map((r) => (
                    <tr key={r.us} className="border-t border-border">
                      <td className="py-1 font-medium text-text">{r.mx}</td><td>{r.us}</td><td>{r.eu ?? "—"}</td><td>{r.cm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function KnownTab({ gender, T, onResult }: { gender: Gender; T: typeof ES; onResult: (r: SizeResult | null) => void }) {
  const [value, setValue] = useState("")
  const [scale, setScale] = useState<SizeScale>("US")
  const calc = () => onResult(sizeFromScale(parseFloat(value.replace(",", ".")), scale, gender))
  return (
    <div>
      <p className="text-sm text-text-muted mb-3">{T.knownHelp}</p>
      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" step="0.5" value={value}
          onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && calc()}
          placeholder={T.knownPh}
          className="flex-1 px-3 py-2 bg-bg border border-border text-text focus:outline-none focus:border-leather"
        />
        <select value={scale} onChange={(e) => setScale(e.target.value as SizeScale)} className="px-3 py-2 bg-bg border border-border text-text focus:outline-none focus:border-leather">
          <option value="US">US</option><option value="MX">MX</option><option value="EU">EU</option>
        </select>
      </div>
      <p className="text-xs text-text-subtle mt-2">{T.knownTip}</p>
      <button type="button" onClick={calc} className="mt-3 w-full py-2.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors">{T.calc}</button>
    </div>
  )
}

function MeasureTab({ gender, T, onResult }: { gender: Gender; T: typeof ES; onResult: (r: SizeResult | null) => void }) {
  const [cm, setCm] = useState("")
  const calc = () => onResult(sizeFromCm(parseFloat(cm.replace(",", ".")), gender))
  return (
    <div>
      <ol className="text-sm text-text-muted list-decimal pl-4 space-y-1 mb-3">
        <li>{T.measure1}</li><li>{T.measure2}</li><li>{T.measure3}</li>
      </ol>
      <div className="flex items-center gap-2">
        <input
          type="number" inputMode="decimal" step="0.1" value={cm}
          onChange={(e) => setCm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && calc()}
          placeholder={T.measurePh}
          className="flex-1 px-3 py-2 bg-bg border border-border text-text focus:outline-none focus:border-leather"
        />
        <span className="text-sm text-text-muted">cm</span>
      </div>
      <button type="button" onClick={calc} className="mt-3 w-full py-2.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors">{T.calc}</button>
    </div>
  )
}

const W = 300, H = 400
const geom = (iw: number, ih: number) => {
  const s = Math.min(W / iw, H / ih)
  return { s, offX: (W - iw * s) / 2, offY: (H - ih * s) / 2 }
}
function drawSeg(ctx: CanvasRenderingContext2D, p: [Pt, Pt], color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.stroke()
  for (const pt of p) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill()
  }
}

function CameraTab({ gender, T, onResult }: { gender: Gender; T: typeof ES; onResult: (r: SizeResult | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const cvRef = useRef<unknown>(null)
  const liveGeom = useRef<{ card: [Pt, Pt] | null; foot: [Pt, Pt] | null }>({ card: null, foot: null })
  const drag = useRef<{ seg: "card" | "foot"; idx: 0 | 1 } | null>(null)

  const [phase, setPhase] = useState<"idle" | "live" | "frozen">("idle")
  const [camError, setCamError] = useState<null | "denied" | "nocam" | "busy" | "insecure" | "generic">(null)
  const [camDetail, setCamDetail] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false) // OpenCV cargando/activo
  const [cardSeen, setCardSeen] = useState(false)
  const [footSeen, setFootSeen] = useState(false)
  const [frozen, setFrozen] = useState<{ src: CanvasImageSource; w: number; h: number } | null>(null)
  const [card, setCard] = useState<[Pt, Pt]>([{ x: W * 0.2, y: H * 0.15 }, { x: W * 0.7, y: H * 0.15 }])
  const [foot, setFoot] = useState<[Pt, Pt]>([{ x: W * 0.3, y: H * 0.3 }, { x: W * 0.3, y: H * 0.85 }])

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    rafRef.current = null; timerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => () => stopCamera(), [])

  // ─── Cámara en vivo ───
  const drawLive = () => {
    const v = videoRef.current, c = canvasRef.current
    if (v && c) {
      const ctx = c.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#1c1917"; ctx.fillRect(0, 0, W, H)
        if (v.videoWidth) {
          const { s, offX, offY } = geom(v.videoWidth, v.videoHeight)
          ctx.drawImage(v, offX, offY, v.videoWidth * s, v.videoHeight * s)
        }
        if (liveGeom.current.foot) drawSeg(ctx, liveGeom.current.foot, "#E08A5B")
        if (liveGeom.current.card) drawSeg(ctx, liveGeom.current.card, "#3B82F6")
      }
    }
    rafRef.current = requestAnimationFrame(drawLive)
  }
  const tick = () => {
    const v = videoRef.current
    const cv = cvRef.current as Parameters<typeof detectCardLongEdge>[0]
    if (!v || !cv || !v.videoWidth) return
    const iw = v.videoWidth, ih = v.videoHeight
    const { s, offX, offY } = geom(iw, ih)
    const toDisp = (p: Pt): [Pt, Pt][number] => ({ x: offX + p.x * s, y: offY + p.y * s })
    // Tarjeta (referencia de escala)
    const edge = detectCardLongEdge(cv, v, iw, ih)
    if (edge) { liveGeom.current.card = [toDisp(edge.p0), toDisp(edge.p1)]; setCardSeen(true) }
    // Pie (auto-detección por default, en vivo)
    const fa = detectFootAxis(cv as Parameters<typeof detectFootAxis>[0], v, iw, ih)
    if (fa) { liveGeom.current.foot = [toDisp(fa.p0), toDisp(fa.p1)]; setFootSeen(true) }
    // Estimación en vivo cuando hay tarjeta + pie
    const g = liveGeom.current
    if (g.card && g.foot) {
      const cardPx = dist(g.card[0], g.card[1])
      if (cardPx > 5) onResult(sizeFromCm((dist(g.foot[0], g.foot[1]) * (CARD_LONG_MM / cardPx)) / 10, gender))
    }
  }

  const openCamera = async () => {
    setCamError(null); setCamDetail(null)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCamError("insecure") // http, o navegador dentro de otra app (in-app browser)
      return
    }
    let stream: MediaStream
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }) // reintento simple
      }
    } catch (e) {
      const err = e as { name?: string; message?: string }
      setCamDetail(`${err?.name || "Error"}: ${err?.message || ""}`.slice(0, 140))
      const n = err?.name
      setCamError(
        n === "NotAllowedError" || n === "SecurityError" ? "denied"
          : n === "NotFoundError" || n === "OverconstrainedError" ? "nocam"
            : n === "NotReadableError" || n === "AbortError" ? "busy"
              : "generic"
      )
      return
    }
    try {
      streamRef.current = stream
      const v = videoRef.current!
      v.srcObject = stream
      await v.play()
      setPhase("live")
      setDetecting(true)
      liveGeom.current = { card: null, foot: null }
      setCardSeen(false); setFootSeen(false)
      rafRef.current = requestAnimationFrame(drawLive)
      loadOpenCv()
        .then((cv) => { cvRef.current = cv; setDetecting(false); timerRef.current = window.setInterval(tick, 350) })
        .catch(() => setDetecting(false))
    } catch (e) {
      const err = e as { name?: string; message?: string }
      setCamDetail(`play: ${err?.name || ""} ${err?.message || ""}`.slice(0, 140))
      setCamError("generic")
    }
  }

  const defaultFoot = (offX: number, offY: number, dispW: number, dispH: number): [Pt, Pt] =>
    [{ x: offX + dispW * 0.35, y: offY + dispH * 0.28 }, { x: offX + dispW * 0.35, y: offY + dispH * 0.85 }]

  const capture = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const iw = v.videoWidth, ih = v.videoHeight
    const bmp = await createImageBitmap(v)
    const { s, offX, offY } = geom(iw, ih)
    const toDisp = (p: Pt): Pt => ({ x: offX + p.x * s, y: offY + p.y * s })
    // tarjeta: de la detección en vivo (o default)
    setCard(liveGeom.current.card ?? [{ x: W * 0.2, y: H * 0.15 }, { x: W * 0.7, y: H * 0.15 }])
    // pie: usa la detección en vivo; si no, reintenta sobre el frame; si no, default
    let f = liveGeom.current.foot ?? defaultFoot(offX, offY, iw * s, ih * s)
    if (!liveGeom.current.foot) {
      const cv = cvRef.current as Parameters<typeof detectFootAxis>[0]
      if (cv) { const fa = detectFootAxis(cv, bmp, iw, ih); if (fa) f = [toDisp(fa.p0), toDisp(fa.p1)] }
    }
    setFoot(f)
    setFrozen({ src: bmp, w: iw, h: ih })
    stopCamera()
    setPhase("frozen")
  }

  const reset = () => { stopCamera(); setFrozen(null); setPhase("idle"); setCamError(null); onResult(null) }

  const onFileFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    let src: CanvasImageSource, iw: number, ih: number
    try { const b = await createImageBitmap(file); src = b; iw = b.width; ih = b.height }
    catch {
      const url = URL.createObjectURL(file)
      const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
      src = im; iw = im.naturalWidth; ih = im.naturalHeight; URL.revokeObjectURL(url)
    }
    const { s, offX, offY } = geom(iw, ih)
    setCard([{ x: W * 0.2, y: H * 0.15 }, { x: W * 0.7, y: H * 0.15 }])
    setFoot(defaultFoot(offX, offY, iw * s, ih * s))
    setFrozen({ src, w: iw, h: ih }); setPhase("frozen")
  }

  // Dibuja el frame congelado + marcadores (fase frozen)
  useEffect(() => {
    if (phase !== "frozen") return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext("2d"); if (!ctx) return
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#F4E9D8"; ctx.fillRect(0, 0, W, H)
    if (frozen) { const { s, offX, offY } = geom(frozen.w, frozen.h); ctx.drawImage(frozen.src, offX, offY, frozen.w * s, frozen.h * s) }
    drawSeg(ctx, card, "#2563EB"); drawSeg(ctx, foot, "#8B3A24")
  }, [phase, frozen, card, foot])

  // Recalcula al mover (fase frozen)
  useEffect(() => {
    if (phase !== "frozen") return
    const cardPx = dist(card[0], card[1]); const footPx = dist(foot[0], foot[1])
    if (cardPx < 5) return
    const mmPerPx = CARD_LONG_MM / cardPx
    onResult(sizeFromCm((footPx * mmPerPx) / 10, gender))
  }, [phase, card, foot, gender, onResult])

  const toCanvas = (e: React.PointerEvent): Pt => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }
  const onDown = (e: React.PointerEvent) => {
    if (phase !== "frozen") return
    const p = toCanvas(e)
    let best: { seg: "card" | "foot"; idx: 0 | 1 } | null = null
    let bestD = 26
    ;([["card", card], ["foot", foot]] as const).forEach(([name, seg]) => {
      seg.forEach((pt, i) => { const d = dist(p, pt); if (d < bestD) { bestD = d; best = { seg: name, idx: i as 0 | 1 } } })
    })
    if (best) { drag.current = best; canvasRef.current!.setPointerCapture(e.pointerId) }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = toCanvas(e); const { seg, idx } = drag.current
    if (seg === "card") setCard((c) => (idx === 0 ? [p, c[1]] : [c[0], p]))
    else setFoot((f) => (idx === 0 ? [p, f[1]] : [f[0], p]))
  }
  const onUp = () => { drag.current = null }

  return (
    <div>
      {/* video oculto (fuente del stream) */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {phase === "idle" && (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-text-muted mb-1 px-4">{T.cam1}</p>
          <p className="text-xs text-text-subtle mb-4 px-4">{T.cam2}</p>
          <button type="button" onClick={openCamera} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            {T.camOpen}
          </button>
          {camError && (
            <div className="mt-4 text-xs">
              <p className="text-terracotta mb-1">{
                camError === "denied" ? T.camDenied
                  : camError === "nocam" ? T.camNoCam
                    : camError === "busy" ? T.camBusy
                      : camError === "insecure" ? T.camInsecure
                        : T.camGeneric
              }</p>
              {camDetail && <p className="text-text-subtle mb-2 font-mono break-all">{camDetail}</p>}
              <label className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-full bg-leather text-bg cursor-pointer hover:bg-text transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                {T.camUpload}
                <input type="file" accept="image/*" capture="environment" onChange={onFileFallback} className="hidden" />
              </label>
            </div>
          )}
        </div>
      )}

      {phase === "live" && (
        <div>
          <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-border bg-black" style={{ aspectRatio: `${W}/${H}` }} />
          {detecting ? (
            <p className="text-xs mt-2 text-text-subtle">⏳ {T.camLoadingCv}</p>
          ) : (
            <p className="text-xs mt-2 flex items-center gap-3">
              <span className={cardSeen ? "text-leather" : "text-text-subtle"}>{cardSeen ? "✓" : "…"} {T.camCardLabel}</span>
              <span className={footSeen ? "text-leather" : "text-text-subtle"}>{footSeen ? "✓" : "…"} {T.camFootLabel}</span>
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={capture} className="flex-1 py-2.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors">{T.camCapture}</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-full border border-border text-text-muted text-sm hover:border-leather transition-colors">{T.camCancel}</button>
          </div>
        </div>
      )}

      {phase === "frozen" && (
        <div>
          <p className="text-xs text-text-muted mb-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full align-middle" style={{ background: "#2563EB" }} /> {T.camCard}
            {"  ·  "}
            <span className="inline-block w-2.5 h-2.5 rounded-full align-middle" style={{ background: "#8B3A24" }} /> {T.camFoot}
          </p>
          <canvas
            ref={canvasRef} width={W} height={H}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            className="w-full touch-none rounded-lg border border-border select-none"
            style={{ aspectRatio: `${W}/${H}` }}
          />
          <button type="button" onClick={reset} className="mt-2 text-xs text-leather underline">{T.camRetake}</button>
        </div>
      )}
    </div>
  )
}

function ResultBox({ result, T, fitNote }: { result: SizeResult; T: typeof ES; fitNote?: string | null }) {
  return (
    <div className="mt-4 rounded-lg border border-leather bg-bg-alt p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{T.yourSize}</p>
      <p className="font-heading text-2xl text-text">
        MX {fmt(result.mx)} <span className="text-text-subtle text-lg">· US {fmt(result.us)}{result.eu ? ` · EU ${fmt(result.eu)}` : ""}</span>
      </p>
      <p className="text-xs text-text-subtle mt-1">{T.footEst}: {result.cm} cm</p>
      {result.between && <p className="text-sm text-terracotta mt-2">{T.between(fmt(result.mx + 0.5))}</p>}
      {result.outOfRange === "small" && <p className="text-sm text-terracotta mt-2">{T.tooSmall}</p>}
      {result.outOfRange === "large" && <p className="text-sm text-terracotta mt-2">{T.tooLarge}</p>}
      {fitNote && <p className="text-sm text-text-muted mt-2">👢 {fitNote}</p>}
      <p className="text-[11px] text-text-subtle mt-3">{T.disclaimer}</p>
    </div>
  )
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const ES = {
  trigger: "¿No sabes tu talla?",
  triggerSub: "Encuéntrala con una foto o tu medida",
  title: "Encuentra tu talla",
  close: "Cerrar",
  men: "Hombre", women: "Mujer",
  tabKnown: "Ya sé mi talla", tabMeasure: "Medir mi pie", tabCamera: "Con la cámara",
  knownHelp: "Escribe una talla que ya uses y te la convertimos a la de BotasLeón.",
  knownPh: "Ej. 9", knownTip: "Tip: tu talla de tenis (Nike, Adidas, Timberland…) suele ser tu talla US.",
  calc: "Calcular",
  measure1: "Pon el talón contra la pared, de pie, sobre una hoja.",
  measure2: "Marca la punta del dedo más largo y mide del borde de la hoja a la marca.",
  measure3: "Escribe el largo en centímetros:",
  measurePh: "Ej. 26.5",
  cam1: "Apunta la cámara a tu pie descalzo DESDE ARRIBA, con una tarjeta al lado.",
  cam2: "La tarjeta (bancaria o credencial) es la referencia de medida.",
  camOpen: "Abrir cámara",
  camLoadingCv: "Cargando detector…",
  camCardLabel: "Tarjeta", camFootLabel: "Pie",
  camCapture: "Capturar", camCancel: "Cancelar",
  camDenied: "No diste permiso de cámara. Actívalo en Ajustes › Safari › Cámara.", camNoCam: "No encontramos cámara.", camGeneric: "No se pudo abrir la cámara.",
  camBusy: "La cámara está ocupada por otra app. Ciérrala e intenta de nuevo.",
  camInsecure: "Abre botasleon.com en Safari directamente (no dentro de otra app como WhatsApp/Instagram).",
  camUpload: "Tomar foto",
  camTake: "Tomar / subir foto", camRetake: "Repetir",
  camCard: "Borde largo de la tarjeta", camFoot: "Del talón a la punta",
  yourSize: "Tu talla BotasLeón", footEst: "Pie estimado",
  between: (bigger: string) => `Estás entre tallas — para bota conviene la mayor (MX ${bigger}).`,
  tooSmall: "Queda por debajo de nuestro rango. Escríbenos y te ayudamos.",
  tooLarge: "Queda por encima de nuestro rango. Escríbenos y te ayudamos.",
  showTable: "Ver tabla de tallas completa",
  footCm: "Pie",
  disclaimer: "Estimación aproximada. Si dudas entre dos tallas o el modelo es de horma especial, escríbenos antes de comprar.",
}

const EN: typeof ES = {
  trigger: "Not sure of your size?",
  triggerSub: "Find it with a photo or your measurement",
  title: "Find your size",
  close: "Close",
  men: "Men", women: "Women",
  tabKnown: "I know my size", tabMeasure: "Measure my foot", tabCamera: "With the camera",
  knownHelp: "Enter a size you already wear and we'll convert it to BotasLeón.",
  knownPh: "e.g. 9", knownTip: "Tip: your sneaker size (Nike, Adidas, Timberland…) is usually your US size.",
  calc: "Calculate",
  measure1: "Stand with your heel against the wall, on a sheet of paper.",
  measure2: "Mark your longest toe and measure from the paper's edge to the mark.",
  measure3: "Enter the length in centimeters:",
  measurePh: "e.g. 26.5",
  cam1: "Point the camera at your bare foot FROM ABOVE, with a card beside it.",
  cam2: "The card (bank or ID card) is the measurement reference.",
  camOpen: "Open camera",
  camLoadingCv: "Loading detector…",
  camCardLabel: "Card", camFootLabel: "Foot",
  camCapture: "Capture", camCancel: "Cancel",
  camDenied: "Camera permission denied. Enable it in Settings › Safari › Camera.", camNoCam: "No camera found.", camGeneric: "Couldn't open the camera.",
  camBusy: "The camera is busy in another app. Close it and try again.",
  camInsecure: "Open botasleon.com directly in Safari (not inside another app like WhatsApp/Instagram).",
  camUpload: "Take a photo",
  camTake: "Take / upload photo", camRetake: "Retake",
  camCard: "Card's long edge", camFoot: "Heel to toe",
  yourSize: "Your BotasLeón size", footEst: "Estimated foot",
  between: (bigger: string) => `You're between sizes — for boots, go with the larger (MX ${bigger}).`,
  tooSmall: "Below our range. Message us and we'll help.",
  tooLarge: "Above our range. Message us and we'll help.",
  showTable: "See full size chart",
  footCm: "Foot",
  disclaimer: "Approximate estimate. If you're between sizes or the model has a special last, message us before buying.",
}
