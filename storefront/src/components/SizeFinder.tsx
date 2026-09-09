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

/**
 * "Encuentra tu talla" — herramienta propia de BotasLeón (sin terceros, sin
 * CORS, en español). Dos métodos confiables en cualquier dispositivo:
 *   1. Ya sé mi talla (US/MX/EU)  → conversión directa.
 *   2. Medir el pie (cm)          → conversión con nuestras fórmulas de fábrica.
 *
 * Convierte a talla BotasLeón (MX · US) con chart.ts. Muestra avisos de "entre
 * tallas" / fuera de rango y una nota de horma opcional.
 */

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
    <div className="mt-4">
      {/* La tarjeta va sobre el plato (el mismo fondo de las fotos), con la
          esquina recta y sin sombra ni rebote: es una ayuda, no un anuncio.
          El ícono deja de ser un círculo negro y pasa a trazo, del mismo set
          y grosor que el resto de la ficha. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex min-h-[44px] w-full items-center gap-3 border border-border bg-plate px-4 py-3 text-left transition-colors duration-[180ms] hover:border-text"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
            <path d="M7 8v3M11 8v4M15 8v3M19 8v3" />
          </svg>
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-sm font-medium text-text">{T.trigger}</span>
          <span className="nota mt-0.5 block">{T.triggerSub}</span>
        </span>
        <svg className="flex-shrink-0 text-text-muted transition-colors duration-[180ms] group-hover:text-text" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {mounted && open &&
        createPortal(
          <Modal onClose={() => setOpen(false)} T={T} genderHandle={genderHandle} fitNote={fitNote} />,
          document.body
        )}
    </div>
  )
}

function Modal({
  onClose,
  T,
  genderHandle,
  fitNote,
}: {
  onClose: () => void
  T: typeof ES
  genderHandle?: string | null
  fitNote?: string | null
}) {
  const [gender, setGender] = useState<Gender>(genderFromHandle(genderHandle) ?? "men")
  const [tab, setTab] = useState<"known" | "measure">("known")
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
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto border border-border bg-bg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-bg border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="display-s text-text">{T.title}</h2>
          <button type="button" onClick={onClose} aria-label={T.close} className="flex h-11 w-11 items-center justify-center text-text-muted transition-colors duration-[180ms] hover:text-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
                className={`min-h-[44px] flex-1 border text-sm transition-colors duration-[180ms] ${
                  gender === g ? "border-text bg-text text-bg" : "border-border text-text-muted hover:border-text"
                }`}
              >
                {g === "men" ? T.men : T.women}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-border">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => { setTab(tb.id); setResult(null) }}
                className={`min-h-[44px] flex-1 -mb-px border-b-2 text-sm transition-colors duration-[180ms] ${
                  tab === tb.id ? "border-text font-medium text-text" : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "known" && <KnownTab gender={gender} T={T} onResult={setResult} />}
          {tab === "measure" && <MeasureTab gender={gender} T={T} onResult={setResult} />}

          {result && <ResultBox result={result} T={T} fitNote={fitNote} />}

          <details className="mt-4">
            <summary className="nota cursor-pointer hover:text-text">{T.showTable}</summary>
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
      <p className="cuerpo text-text-muted mb-3">{T.knownHelp}</p>
      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" step="0.5" value={value}
          onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && calc()}
          placeholder={T.knownPh}
          className="campo flex-1"
        />
        <select value={scale} onChange={(e) => setScale(e.target.value as SizeScale)} className="campo w-auto">
          <option value="US">US</option><option value="MX">MX</option><option value="EU">EU</option>
        </select>
      </div>
      <p className="nota mt-2">{T.knownTip}</p>
      <button type="button" onClick={calc} className="btn mt-3 w-full">{T.calc}</button>
    </div>
  )
}

function MeasureTab({ gender, T, onResult }: { gender: Gender; T: typeof ES; onResult: (r: SizeResult | null) => void }) {
  const [cm, setCm] = useState("")
  const calc = () => onResult(sizeFromCm(parseFloat(cm.replace(",", ".")), gender))
  return (
    <div>
      <ol className="cuerpo text-text-muted list-decimal pl-4 space-y-1 mb-3">
        <li>{T.measure1}</li><li>{T.measure2}</li><li>{T.measure3}</li>
      </ol>
      <div className="flex items-center gap-2">
        <input
          type="number" inputMode="decimal" step="0.1" value={cm}
          onChange={(e) => setCm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && calc()}
          placeholder={T.measurePh}
          className="campo flex-1"
        />
        <span className="cuerpo text-text-muted">cm</span>
      </div>
      <button type="button" onClick={calc} className="btn mt-3 w-full">{T.calc}</button>
    </div>
  )
}

function ResultBox({ result, T, fitNote }: { result: SizeResult; T: typeof ES; fitNote?: string | null }) {
  return (
    <div className="mt-4 border border-border bg-plate p-4">
      <p className="eyebrow text-text-muted mb-1">{T.yourSize}</p>
      <p className="display-m text-text">
        MX {fmt(result.mx)} <span className="text-text-muted">· US {fmt(result.us)}{result.eu ? ` · EU ${fmt(result.eu)}` : ""}</span>
      </p>
      <p className="nota mt-1">{T.footEst}: {result.cm} cm</p>
      {result.between && <p className="cuerpo text-leather mt-2">{T.between(fmt(result.mx + 0.5))}</p>}
      {result.outOfRange === "small" && <p className="cuerpo text-leather mt-2">{T.tooSmall}</p>}
      {result.outOfRange === "large" && <p className="cuerpo text-leather mt-2">{T.tooLarge}</p>}
      {fitNote && <p className="cuerpo text-text-muted mt-2">{fitNote}</p>}
      {/* Nada por debajo de 12px: el text-[11px] de antes no se leía en móvil. */}
      <p className="nota mt-3">{T.disclaimer}</p>
    </div>
  )
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const ES = {
  trigger: "¿No sabes tu talla?",
  triggerSub: "Con tu talla de tenis o midiendo tu pie",
  title: "Encuentra tu talla",
  close: "Cerrar",
  men: "Hombre", women: "Mujer",
  tabKnown: "Ya sé mi talla", tabMeasure: "Medir mi pie",
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
  triggerSub: "With your sneaker size or your measurement",
  title: "Find your size",
  close: "Close",
  men: "Men", women: "Women",
  tabKnown: "I know my size", tabMeasure: "Measure my foot",
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
