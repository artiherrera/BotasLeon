"use client"

import { useState } from "react"

/**
 * LatestByGenderTabs — sección "Lo más nuevo" con toggle Hombre / Mujer.
 *
 * Client component MÍNIMO: solo maneja qué tab está activo. Los grids llegan
 * ya renderizados desde el server (props `hombreContent`/`mujerContent`), así
 * que ProductCard/JudgemeStars/formatMoney NO entran al bundle JS del home.
 * El cliente solo alterna la visibilidad con CSS (`hidden`) — ambos grids
 * quedan en el DOM, el cambio de tab es instantáneo y sin re-fetch.
 */

type Tab = "hombre" | "mujer"

type Props = {
  hombreContent: React.ReactNode
  mujerContent: React.ReactNode
}

export function LatestByGenderTabs({ hombreContent, mujerContent }: Props) {
  const [active, setActive] = useState<Tab>("hombre")

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
      <p className="eyebrow text-leather text-center mb-3">Catálogo</p>

      {/* Toggle de género (botones aria-pressed agrupados, no un tablist) */}
      <div
        role="group"
        aria-label="Filtrar lo más nuevo por género"
        className="flex justify-center items-center gap-3 md:gap-6 mb-10 text-2xl md:text-3xl font-heading"
      >
        <TabButton
          label="Lo más nuevo Hombre"
          isActive={active === "hombre"}
          onClick={() => setActive("hombre")}
        />
        <span aria-hidden className="text-text-subtle text-xl md:text-2xl">/</span>
        <TabButton
          label="Lo más nuevo Mujer"
          isActive={active === "mujer"}
          onClick={() => setActive("mujer")}
        />
      </div>

      {/* Grids server-rendered; solo alternamos visibilidad. */}
      <div className={active === "hombre" ? undefined : "hidden"}>{hombreContent}</div>
      <div className={active === "mujer" ? undefined : "hidden"}>{mujerContent}</div>
    </section>
  )
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`relative pb-1 transition-colors cursor-pointer ${
        isActive ? "text-text" : "text-text-subtle hover:text-text-muted"
      }`}
    >
      <span className="uppercase tracking-wide">{label}</span>
      <span
        aria-hidden
        className={`absolute left-0 right-0 -bottom-0.5 h-0.5 bg-text transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  )
}
