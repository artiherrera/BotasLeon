"use client"

import { useState } from "react"
import Link from "next/link"
import { ProductCard } from "./ProductCard"
import { EmptyProductsState } from "./EmptyState"
import type { Product } from "@/lib/shopify/types"

/**
 * LatestByGenderTabs — sección "Lo más nuevo" con tabs Hombre / Mujer.
 *
 * Server fetch ambas listas en paralelo y las pasa como props. Client
 * solo maneja qué tab está activo. Cambio de tab = cambio de grid,
 * sin re-fetch.
 *
 * Si una de las listas está vacía, ese tab muestra empty state pero
 * sigue siendo visible para que el usuario sepa que existe la sección.
 */

type Tab = "hombre" | "mujer"

type Props = {
  hombreProducts: Product[]
  mujerProducts: Product[]
}

export function LatestByGenderTabs({ hombreProducts, mujerProducts }: Props) {
  const [active, setActive] = useState<Tab>("hombre")

  const products = active === "hombre" ? hombreProducts : mujerProducts
  const viewAllHref = active === "hombre" ? "/hombre" : "/mujer"

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

      {/* Grid */}
      {products.length === 0 ? (
        <EmptyProductsState
          title="Próximamente"
          description={
            process.env.NODE_ENV === "development"
              ? active === "hombre"
                ? "Aún no hay productos de hombre. Sube alguno con el metacampo 'Sexo objetivo: Masculino'."
                : "Aún no hay productos de mujer. Sube alguno con el metacampo 'Sexo objetivo: Femenino'."
              : "Estamos cargando las primeras botas de esta categoría. Mientras tanto, explora el resto del catálogo."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href={viewAllHref}
              className="inline-flex items-center text-leather font-medium hover:text-terracotta transition-colors"
            >
              Ver todo {active === "hombre" ? "hombre" : "mujer"} →
            </Link>
          </div>
        </>
      )}
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
        isActive
          ? "text-text"
          : "text-text-subtle hover:text-text-muted"
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
