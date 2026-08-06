"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLocale } from "@/lib/i18n/context"
import {
  type Gender,
  type SizeResult,
  type SizeScale,
  genderFromHandle,
  sizeFromScale,
  sizeFromCm,
  sizeRows,
} from "@/lib/sizing/chart"
import { VolumentalScan, VOLUMENTAL_ENABLED } from "./VolumentalScan"

/**
 * "Encuentra tu talla" — herramienta propia de BotasLeón (sin terceros, sin
 * CORS, en español). Dos métodos confiables en cualquier dispositivo:
 *   1. Ya sé mi talla (US/MX/EU)  → conversión directa.
 *   2. Medir el pie (cm)          → conversión con nuestras fórmulas de fábrica.
 *
 * Convierte a talla BotasLeón (MX · US) con chart.ts. Muestra avisos de "entre
 * tallas" / fuera de rango y una nota de horma opcional.
 *
 * NOTA: el escaneo por cámara se hará con Volumental (SDK con ML real) cuando
 * exista el client-id; se integrará aparte, no aquí.
 */

export function SizeFinder({
  productId,
  genderHandle,
  fitNote,
}: {
  productId: string
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
            <path d="M7 8v3M11 8v4M15 8v3M19 8v3" />
          </svg>
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-sm font-semibold text-text">{T.trigger}</span>
          <span className="block text-xs text-text-subtle mt-0.5">{T.triggerSub}</span>
        </span>
        <svg className="flex-shrink-0 text-text-subtle transition-all group-hover:text-leather group-hover:translate-x-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {mounted && open &&
        createPortal(
          <Modal onClose={() => setOpen(false)} en={en} T={T} productId={productId} genderHandle={genderHandle} fitNote={fitNote} />,
          document.body
        )}
    </div>
  )
}

function Modal({
  onClose,
  en,
  T,
  productId,
  genderHandle,
  fitNote,
}: {
  onClose: () => void
  en: boolean
  T: typeof ES
  productId: string
  genderHandle?: string | null
  fitNote?: string | null
}) {
  const [gender, setGender] = useState<Gender>(genderFromHandle(genderHandle) ?? "men")
  const [tab, setTab] = useState<"scan" | "known" | "measure">(VOLUMENTAL_ENABLED ? "scan" : "known")
  const [result, setResult] = useState<SizeResult | null>(null)

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
    ...(VOLUMENTAL_ENABLED ? [{ id: "scan" as const, label: T.tabScan }] : []),
    { id: "known", label: T.tabKnown },
    { id: "measure", label: T.tabMeasure },
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
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  tab === tb.id ? "bg-bg text-text shadow-sm font-medium" : "text-text-muted"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "scan" && <VolumentalScan productId={productId} genderHandle={genderHandle} onResult={setResult} en={en} />}
          {tab === "known" && <KnownTab gender={gender} T={T} onResult={setResult} />}
          {tab === "measure" && <MeasureTab gender={gender} T={T} onResult={setResult} />}

          {result && <ResultBox result={result} T={T} fitNote={fitNote} />}

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
  triggerSub: "Escanea tu pie o usa tu talla de tenis",
  title: "Encuentra tu talla",
  close: "Cerrar",
  men: "Hombre", women: "Mujer",
  tabScan: "Escanear", tabKnown: "Ya sé mi talla", tabMeasure: "Medir mi pie",
  knownHelp: "Escribe una talla que ya uses y te la convertimos a la de BotasLeón.",
  knownPh: "Ej. 9", knownTip: "Tip: tu talla de tenis (Nike, Adidas, Timberland…) suele ser tu talla US.",
  calc: "Calcular",
  measure1: "Pon el talón contra la pared, de pie, sobre una hoja.",
  measure2: "Marca la punta del dedo más largo y mide del borde de la hoja a la marca.",
  measure3: "Escribe el largo en centímetros:",
  measurePh: "Ej. 26.5",
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
  triggerSub: "Scan your foot or use your sneaker size",
  title: "Find your size",
  close: "Close",
  men: "Men", women: "Women",
  tabScan: "Scan", tabKnown: "I know my size", tabMeasure: "Measure my foot",
  knownHelp: "Enter a size you already wear and we'll convert it to BotasLeón.",
  knownPh: "e.g. 9", knownTip: "Tip: your sneaker size (Nike, Adidas, Timberland…) is usually your US size.",
  calc: "Calculate",
  measure1: "Stand with your heel against the wall, on a sheet of paper.",
  measure2: "Mark your longest toe and measure from the paper's edge to the mark.",
  measure3: "Enter the length in centimeters:",
  measurePh: "e.g. 26.5",
  yourSize: "Your BotasLeón size", footEst: "Estimated foot",
  between: (bigger: string) => `You're between sizes — for boots, go with the larger (MX ${bigger}).`,
  tooSmall: "Below our range. Message us and we'll help.",
  tooLarge: "Above our range. Message us and we'll help.",
  showTable: "See full size chart",
  footCm: "Foot",
  disclaimer: "Approximate estimate. If you're between sizes or the model has a special last, message us before buying.",
}
