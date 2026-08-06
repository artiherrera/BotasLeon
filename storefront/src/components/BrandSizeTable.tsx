"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/context"
import { type Gender, genderFromHandle, brandRows } from "@/lib/sizing/chart"

/**
 * "De tus tenis a tus botas" — tabla comparativa Nike · Adidas · BotasLeón.
 *
 * Casi nadie recuerda su talla US en abstracto, pero todo mundo sabe su número
 * de tenis. La tabla deja buscar la fila por lo que ya conoces (Nike EU, Adidas
 * EU, US o cm) y leer directo la talla de bota (MX).
 *
 * Honestidad: entre marcas la ETIQUETA varía ≤½ número (un US 9 son ~27 cm en
 * cualquiera); lo que cambia es la HORMA. Por eso el valor real está tanto en la
 * tabla como en la nota de horma (Nike angosto/½ chico; Adidas fiel). Los datos
 * salen de chart.ts (fuente única), no de números sueltos.
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
  const rows = brandRows(gender)

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
                <th className="text-left font-medium py-1.5 pr-3">Nike<br /><span className="text-[10px] font-normal">EU</span></th>
                <th className="text-left font-medium pr-3">Adidas<br /><span className="text-[10px] font-normal">EU</span></th>
                <th className="text-left font-medium pr-3">US</th>
                <th className="text-left font-medium pr-3">{T.foot}<br /><span className="text-[10px] font-normal">cm</span></th>
                <th className="text-left font-semibold text-leather pr-1">{T.boot}<br /><span className="text-[10px] font-normal">MX</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.us} className="border-t border-border">
                  <td className="py-1.5 pr-3">{fmt(r.nikeEu)}</td>
                  <td className="pr-3">{fmt(r.adidasEu)}</td>
                  <td className="pr-3">{r.us}</td>
                  <td className="pr-3">{r.cm}</td>
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

const fmt = (n: number | null) => (n == null ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(1))

const ES = {
  summary: "Compara con tu Nike o Adidas",
  intro: "Mismo pie, distinta etiqueta. Busca tu número de tenis (Nike o Adidas EU, US o cm) y lee tu talla de bota. Ojo: no siempre es el mismo número que tu tenis.",
  men: "Hombre",
  women: "Mujer",
  foot: "Pie",
  boot: "Tu bota",
  nikeFit: "horma angosta, suele quedar ½ chico. Si dudas, sube ½ talla en tu bota.",
  adidasFit: "casi siempre fiel a la talla (los de running como Ultraboost quedan ½ chicos).",
  disclaimer: "Equivalencias de referencia (charts oficiales Nike/Adidas); varían ±½ según el modelo. La medida más confiable es el largo de tu pie en cm.",
}

const EN: typeof ES = {
  summary: "Compare with your Nike or Adidas",
  intro: "Same foot, different label. Find your sneaker size (Nike or Adidas EU, US or cm) and read your boot size. Note: it isn't always the same number as your sneaker.",
  men: "Men",
  women: "Women",
  foot: "Foot",
  boot: "Your boot",
  nikeFit: "narrow last, tends to run ½ small. When in doubt, size up ½ in your boot.",
  adidasFit: "usually true to size (running models like Ultraboost run ½ small).",
  disclaimer: "Reference equivalences (official Nike/Adidas charts); they vary ±½ by model. Your foot length in cm is always the most reliable measure.",
}
