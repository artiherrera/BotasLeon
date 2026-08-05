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
        className="inline-flex items-center gap-2 text-sm text-leather underline underline-offset-2 hover:text-text transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7l4-4 14 14-4 4z" /><path d="M9 5l2 2M12 8l2 2M15 11l2 2" />
        </svg>
        {T.trigger}
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

function CameraTab({ gender, T, onResult }: { gender: Gender; T: typeof ES; onResult: (r: SizeResult | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [card, setCard] = useState<[Pt, Pt]>([{ x: 60, y: 60 }, { x: 260, y: 60 }])
  const [foot, setFoot] = useState<[Pt, Pt]>([{ x: 80, y: 140 }, { x: 80, y: 380 }])
  const drag = useRef<{ seg: "card" | "foot"; idx: 0 | 1 } | null>(null)
  const W = 340, H = 440

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setImg(image)
      // reinicia marcadores a posiciones por defecto
      setCard([{ x: W * 0.2, y: H * 0.15 }, { x: W * 0.7, y: H * 0.15 }])
      setFoot([{ x: W * 0.25, y: H * 0.3 }, { x: W * 0.25, y: H * 0.85 }])
      URL.revokeObjectURL(url)
    }
    image.src = url
  }

  // Dibuja imagen (contain) + marcadores
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = "#F4E9D8"
    ctx.fillRect(0, 0, W, H)
    if (img) {
      const s = Math.min(W / img.width, H / img.height)
      const dw = img.width * s, dh = img.height * s
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
    }
    const seg = (p: [Pt, Pt], color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.stroke()
      for (const pt of p) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill() }
    }
    seg(card, "#2563EB") // tarjeta = azul
    seg(foot, "#8B3A24") // pie = terracota
  }, [img, card, foot])

  // Recalcula al mover
  useEffect(() => {
    if (!img) return
    const cardPx = dist(card[0], card[1])
    const footPx = dist(foot[0], foot[1])
    if (cardPx < 5) return
    const mmPerPx = CARD_LONG_MM / cardPx
    const footCm = (footPx * mmPerPx) / 10
    onResult(sizeFromCm(footCm, gender))
  }, [img, card, foot, gender, onResult])

  const toCanvas = (e: React.PointerEvent): Pt => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H }
  }
  const onDown = (e: React.PointerEvent) => {
    const p = toCanvas(e)
    let best: { seg: "card" | "foot"; idx: 0 | 1 } | null = null
    let bestD = 24
    ;([["card", card], ["foot", foot]] as const).forEach(([name, seg]) => {
      seg.forEach((pt, i) => { const d = dist(p, pt); if (d < bestD) { bestD = d; best = { seg: name, idx: i as 0 | 1 } } })
    })
    if (best) { drag.current = best; canvasRef.current!.setPointerCapture(e.pointerId) }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = toCanvas(e)
    const { seg, idx } = drag.current
    if (seg === "card") setCard((c) => (idx === 0 ? [p, c[1]] : [c[0], p]))
    else setFoot((f) => (idx === 0 ? [p, f[1]] : [f[0], p]))
  }
  const onUp = () => { drag.current = null }

  return (
    <div>
      {!img ? (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-text-muted mb-1 px-4">{T.cam1}</p>
          <p className="text-xs text-text-subtle mb-4 px-4">{T.cam2}</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-leather text-bg text-sm uppercase tracking-wider cursor-pointer hover:bg-text transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            {T.camTake}
            <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          </label>
        </div>
      ) : (
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
          <label className="mt-2 inline-block text-xs text-leather underline cursor-pointer">
            {T.camRetake}
            <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          </label>
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
  trigger: "¿No sabes tu talla? Encuéntrala",
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
  cam1: "Toma una foto de tu pie DESDE ARRIBA, descalzo sobre una hoja.",
  cam2: "Pon una tarjeta (bancaria o credencial) junto al pie — la usamos como regla.",
  camTake: "Tomar / subir foto", camRetake: "Cambiar foto",
  camCard: "Marca el borde largo de la tarjeta", camFoot: "Marca del talón a la punta",
  yourSize: "Tu talla BotasLeón", footEst: "Pie estimado",
  between: (bigger: string) => `Estás entre tallas — para bota conviene la mayor (MX ${bigger}).`,
  tooSmall: "Queda por debajo de nuestro rango. Escríbenos y te ayudamos.",
  tooLarge: "Queda por encima de nuestro rango. Escríbenos y te ayudamos.",
  showTable: "Ver tabla de tallas completa",
  footCm: "Pie",
  disclaimer: "Estimación aproximada. Si dudas entre dos tallas o el modelo es de horma especial, escríbenos antes de comprar.",
}

const EN: typeof ES = {
  trigger: "Not sure of your size? Find it",
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
  cam1: "Take a photo of your foot FROM ABOVE, barefoot on a sheet of paper.",
  cam2: "Place a card (bank or ID card) next to your foot — we use it as a ruler.",
  camTake: "Take / upload photo", camRetake: "Change photo",
  camCard: "Mark the card's long edge", camFoot: "Mark heel to toe",
  yourSize: "Your BotasLeón size", footEst: "Estimated foot",
  between: (bigger: string) => `You're between sizes — for boots, go with the larger (MX ${bigger}).`,
  tooSmall: "Below our range. Message us and we'll help.",
  tooLarge: "Above our range. Message us and we'll help.",
  showTable: "See full size chart",
  footCm: "Foot",
  disclaimer: "Approximate estimate. If you're between sizes or the model has a special last, message us before buying.",
}
