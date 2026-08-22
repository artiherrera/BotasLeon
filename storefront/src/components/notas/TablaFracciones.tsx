"use client"

import { FRACCIONES, sugerirFraccion, type Suela } from "@/lib/nota/config"

/**
 * Los seis códigos a la vista, para elegir mirándolos en vez de recordarlos.
 *
 * Se marca cuál sugiere el sistema para la combinación actual de suela y
 * género, pero cualquiera se puede elegir — y si el agente aduanal dicta otro
 * distinto, el campo de abajo acepta texto libre.
 */
export function TablaFracciones({
  sexo,
  suela,
  valor,
  onElegir,
}: {
  sexo: string
  suela: Suela
  valor: string
  onElegir: (codigo: string) => void
}) {
  const sugerida = sugerirFraccion(sexo, suela).codigo

  return (
    <div className="border border-border">
      <div className="flex items-baseline justify-between bg-bg-alt px-3 py-2">
        <span className="eyebrow text-text-subtle">Fracción arancelaria</span>
        <span className="text-[11px] text-text-muted">
          Arancel mostrado = lo que se paga <strong>solo si falla</strong> el T-MEC
        </span>
      </div>

      <table className="w-full text-xs">
        <tbody>
          {Object.entries(FRACCIONES).map(([clave, f]) => {
            const activa = valor === f.codigo
            const esSugerida = f.codigo === sugerida
            return (
              <tr
                key={clave}
                onClick={() => onElegir(f.codigo)}
                className={`cursor-pointer border-t border-border transition-colors ${
                  activa ? "bg-leather/10" : "hover:bg-bg-alt"
                }`}
              >
                <td className="w-6 pl-3 py-2">
                  <span
                    aria-hidden
                    className={`block h-2.5 w-2.5 rounded-full border ${
                      activa ? "bg-leather border-leather" : "border-border"
                    }`}
                  />
                </td>
                <td className="py-2 font-mono text-[11px] whitespace-nowrap">
                  {f.codigo}
                </td>
                <td className="py-2 px-3 text-text-muted">
                  {f.etiqueta}
                  {esSugerida && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-leather">
                      sugerida
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-text-muted">
                  {f.mfnSiFallaTmec}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="border-t border-border p-3">
        <label className="block text-[11px] text-text-muted mb-1">
          O escribe el que te confirme el agente aduanal (CBP pide 10 dígitos)
        </label>
        <input
          value={valor}
          onChange={(e) => onElegir(e.target.value)}
          placeholder="6403.51.60.XX"
          className="w-full border border-border bg-bg px-2.5 py-2 font-mono text-xs focus:border-leather focus:outline-none"
        />
      </div>
    </div>
  )
}
