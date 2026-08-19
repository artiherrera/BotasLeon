"use client"

import { Children, useRef, useState } from "react"
import { useT } from "@/lib/i18n/context"

/**
 * ProductRail — fila de productos que se desliza en horizontal.
 *
 * Reemplaza a la cuadrícula fija de 4 cuando hay muchos productos que mostrar:
 * en móvil se arrastra con el dedo (scroll-snap nativo, sin JS), en escritorio
 * aparecen flechas. La siguiente tarjeta asoma a propósito en el borde — es la
 * señal de que hay más, sin necesidad de explicarlo.
 *
 * Los hijos llegan ya renderizados (server components) y aquí solo se envuelven
 * para darles ancho: así las tarjetas NO entran al bundle del cliente.
 *
 * Ojo con el gesto: las tarjetas traen su propio carrusel de fotos, y dos
 * deslizadores horizontales anidados se pelean el dedo en móvil. Por eso quien
 * monta este riel pasa `singleImage` a sus tarjetas.
 */
export function ProductRail({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const t = useT()
  const railRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const count = Children.count(children)

  // Con pocas tarjetas no hay nada que desplazar en escritorio.
  const showArrows = count > 4

  const onScroll = () => {
    const el = railRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }

  const page = (dir: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    // Avanza casi una pantalla: deja una tarjeta de contexto entre saltos.
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  const arrowCls =
    "hidden md:flex absolute top-[38%] z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-bg text-text shadow-sm transition-opacity hover:border-leather disabled:opacity-0 disabled:pointer-events-none"

  return (
    <div className="relative">
      <div
        ref={railRef}
        onScroll={onScroll}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leather focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      >
        {Children.map(children, (child) => (
          // La tarjeta parcial del borde es intencional: anuncia que hay más.
          <div className="snap-start shrink-0 basis-[62%] sm:basis-[45%] md:basis-[31%] lg:basis-[23%]">
            {child}
          </div>
        ))}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label={t("rail.prev")}
            className={`${arrowCls} -left-3 lg:-left-5`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label={t("rail.next")}
            className={`${arrowCls} -right-3 lg:-right-5`}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
