"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

/**
 * HeroCarousel — slideshow rotativo del home.
 *
 * Principios de diseño:
 *  - UN solo headline por slide (no acumular)
 *  - Padding generoso (px-8 mobile, px-20 desktop) — el texto NUNCA roza bordes
 *  - Vertical centering en lugar de bottom-pinned
 *  - Tipografía controlada: max 6xl en desktop (no 8xl gritón)
 *  - Dots grandes y clickeables (w-3 h-3 base, w-12 activo) con z-20 sobre contenido
 *  - Background layers con pointer-events:none para no robar clicks a dots
 *  - Auto-rotate 8s, pausa en hover, pausa en focus de teclado
 */

type Slide = {
  eyebrow: string
  title: string
  ctaLabel: string
  ctaHref: string
  bgClass: string
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Colección",
    title: "Hecho en León desde 1645.",
    ctaLabel: "Explorar",
    ctaHref: "/products",
    bgClass: "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  },
  {
    eyebrow: "Hombre",
    title: "Vaqueras que duran.",
    ctaLabel: "Ver hombre",
    ctaHref: "/hombre",
    bgClass: "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  },
  {
    eyebrow: "Mujer",
    title: "Cuero. Estilo. Tuyo.",
    ctaLabel: "Ver mujer",
    ctaHref: "/mujer",
    bgClass: "bg-gradient-to-br from-cognac via-gold to-leather-light",
  },
]

const AUTO_ROTATE_MS = 8000

export function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((idx: number) => {
    setActive(idx)
  }, [])

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, AUTO_ROTATE_MS)
    return () => clearInterval(interval)
  }, [paused])

  return (
    <section
      className="relative w-full h-[75vh] min-h-[540px] max-h-[720px] overflow-hidden bg-leather"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Banners destacados"
    >
      {/* Slides — pointer-events-none para que no roben clicks a dots */}
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            idx === active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={idx !== active}
        >
          {/* Background */}
          <div className={`absolute inset-0 ${slide.bgClass}`} />

          {/* Texture overlay sutil */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 30%, rgba(255,255,255,0.25) 0%, transparent 55%),
                radial-gradient(circle at 75% 70%, rgba(0,0,0,0.35) 0%, transparent 65%)
              `,
            }}
          />

          {/* Gradient para contraste con texto izquierdo */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />

          {/* Contenido — pointer-events-auto sólo sobre el link */}
          <div className="relative h-full max-w-7xl mx-auto px-8 md:px-16 lg:px-20 flex items-center">
            <div className="max-w-xl pointer-events-none">
              <p className="eyebrow text-gold mb-6 text-xs md:text-sm tracking-[0.2em]">
                {slide.eyebrow}
              </p>
              <h2 className="font-display text-bg text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-10 max-w-md">
                {slide.title}
              </h2>
              <Link
                href={slide.ctaHref}
                tabIndex={idx === active ? 0 : -1}
                className="pointer-events-auto inline-flex items-center px-7 py-3.5 bg-bg text-leather text-sm font-medium tracking-wide hover:bg-bg-alt transition-colors group rounded-sm"
              >
                {slide.ctaLabel}
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots — z-20, grandes, hit-area amplia */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
        {SLIDES.map((slide, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}: ${slide.eyebrow}`}
            aria-current={idx === active ? "true" : "false"}
            className="group p-2 cursor-pointer"
          >
            <span
              className={`block h-1 rounded-full transition-all duration-300 ${
                idx === active
                  ? "w-12 bg-bg"
                  : "w-8 bg-bg/35 group-hover:bg-bg/70"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
