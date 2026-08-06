"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import { type Gender, genderFromHandle, sizeRows } from "@/lib/sizing/chart"

/**
 * "Compara con tu Nike o Adidas" — tabla de referencia en el PDP.
 *
 * Casi nadie recuerda su talla US en abstracto, pero todo mundo sabe su número
 * de tenis. La tabla deja buscar la fila por el número que YA conoces y leer
 * directo la talla de bota (MX).
 *
 * La referencia va en la unidad de cada mercado:
 *   ES (México): en cm — así viene en la caja de tenis ("calzo del 27").
 *   EN (EE.UU.): en US — como lo conoce el comprador gringo.
 * Por eso Nike y Adidas colapsan en UNA columna: en cm (o en US) son el mismo
 * número. La diferencia real entre marcas es la HORMA, y esa va como nota
 * (Nike angosto/½ chico; Adidas fiel). Datos desde chart.ts (fuente única).
 */
export function BrandSizeTable({
  genderHandle,
  fitNote,
}: {
  genderHandle?: string | null
  fitNote?: string | null
}) {
  const { locale } = useLocale()
  const en = locale === "en"
  const T = en ? EN : ES
  const [gender, setGender] = useState<Gender>(genderFromHandle(genderHandle) ?? "men")
  const rows = sizeRows(gender)

  return (
    <details className="group mt-2 rounded-xl border border-border bg-bg-alt/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-leather">
          <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
        <span className="flex-1">{T.summary}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-text-subtle transition-transform group-open:rotate-90">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </summary>

      <div className="border-t border-border px-4 py-4">
        <p className="text-xs text-text-muted mb-3">{T.intro}</p>

        {/* Género (por si compran para alguien más) */}
        <div className="flex gap-2 mb-3">
          {(["men", "women"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                gender === g ? "border-leather bg-leather text-bg" : "border-border text-text-muted hover:border-leather"
              }`}
            >
              {g === "men" ? T.men : T.women}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-text-muted">
            <thead>
              <tr className="text-text-subtle">
                <th className="text-left font-medium py-1.5 pr-3">
                  Nike / Adidas<br /><span className="text-[10px] font-normal">{T.refUnit}</span>
                </th>
                <th className="text-left font-medium pr-3">{T.secUnit}</th>
                <th className="text-left font-semibold text-leather pr-1">
                  {T.boot}<br /><span className="text-[10px] font-normal">MX</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.us} className="border-t border-border">
                  <td className="py-1.5 pr-3">{en ? r.us : r.cm}</td>
                  <td className="pr-3">{en ? r.cm : r.us}</td>
                  <td className="pr-1 font-semibold text-text">{r.mx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nota de horma: lo que de verdad diferencia a las marcas */}
        <div className="mt-3 space-y-1.5 text-xs text-text-muted">
          <p><span className="font-medium text-text">Nike:</span> {T.nikeFit}</p>
          <p><span className="font-medium text-text">Adidas:</span> {T.adidasFit}</p>
          {fitNote && <p><span className="font-medium text-text">BotasLeón:</span> 👢 {fitNote}</p>}
        </div>

        <p className="mt-3 text-[11px] text-text-subtle">{T.disclaimer}</p>
      </div>
    </details>
  )
}

const ES = {
  summary: "Compara con tu Nike o Adidas",
  intro: "Mismo pie, distinta etiqueta. Busca en cm el número de tu tenis (Nike o Adidas — es el que viene en la caja) y lee tu talla de bota. Ojo: no siempre es el mismo número que tu tenis.",
  men: "Hombre",
  women: "Mujer",
  refUnit: "cm",
  secUnit: "US",
  boot: "Tu bota",
  nikeFit: "horma angosta, suele quedar ½ chico. Si dudas, sube ½ talla en tu bota.",
  adidasFit: "casi siempre fiel a la talla (los de running como Ultraboost quedan ½ chicos).",
  disclaimer: "Equivalencias de referencia; varían ±½ según el modelo. La medida más confiable es el largo de tu pie en cm.",
}

const EN: typeof ES = {
  summary: "Compare with your Nike or Adidas",
  intro: "Same foot, different label. Find your Nike or Adidas size (US) and read your boot size. Note: it isn't always the same number as your sneaker.",
  men: "Men",
  women: "Women",
  refUnit: "US",
  secUnit: "cm",
  boot: "Your boot",
  nikeFit: "narrow last, tends to run ½ small. When in doubt, size up ½ in your boot.",
  adidasFit: "usually true to size (running models like Ultraboost run ½ small).",
  disclaimer: "Reference equivalences; they vary ±½ by model. Your foot length is always the most reliable measure.",
}
