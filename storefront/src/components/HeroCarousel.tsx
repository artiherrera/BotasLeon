"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

/**
 * HeroCarousel — slideshow rotativo del home.
 *
 * Principios de diseño:
 *  - El SLIDE entero es el link (no botón encima). Hover sutil indica
 *    clickabilidad. Más limpio y la imagen domina.
 *  - Headline ÚNICO corto (max ~4 palabras). El texto NO grita.
 *  - Tipografía contenida: 4xl mobile / 5xl desktop (no 6xl ni 7xl)
 *  - Padding generoso, texto anclado bottom-left para no estorbar a la imagen
 *  - Dots fuera de los layers de slide, z-30, hit-area amplia
 *  - Slide bg con pointer-events para que sea clickeable, dots con z encima
 */

type Slide = {
  eyebrow: string
  title: string
  href: string
  bgClass: string
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Colección · Otoño",
    title: "Hecho en León.",
    href: "/products",
    bgClass: "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  },
  {
    eyebrow: "Hombre · Vaqueras",
    title: "Para décadas.",
    href: "/hombre",
    bgClass: "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  },
  {
    eyebrow: "Mujer · Nueva colección",
    title: "Cuero auténtico.",
    href: "/mujer",
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
      className="relative w-full h-[70vh] min-h-[480px] max-h-[680px] overflow-hidden bg-leather"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Banners destacados"
    >
      {/* Slides — cada uno es Link clickeable completo */}
      {SLIDES.map((slide, idx) => (
        <Link
          key={idx}
          href={slide.href}
          tabIndex={idx === active ? 0 : -1}
          aria-hidden={idx !== active}
          aria-label={`${slide.eyebrow}: ${slide.title}`}
          className={`absolute inset-0 block group transition-opacity duration-700 ${
            idx === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background */}
          <div className={`absolute inset-0 ${slide.bgClass} transition-transform duration-[1500ms] group-hover:scale-[1.02]`} />

          {/* Texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 30%, rgba(255,255,255,0.22) 0%, transparent 55%),
                radial-gradient(circle at 75% 70%, rgba(0,0,0,0.30) 0%, transparent 65%)
              `,
            }}
          />

          {/* Gradient inferior para contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

          {/* Content anclado abajo-izquierda */}
          <div className="absolute inset-x-0 bottom-0 px-8 md:px-16 lg:px-20 pb-20 md:pb-24">
            <div className="max-w-7xl mx-auto">
              <p className="eyebrow text-gold mb-4 text-xs md:text-sm tracking-[0.25em]">
                {slide.eyebrow}
              </p>
              <h2 className="font-display text-bg text-4xl md:text-5xl lg:text-6xl leading-[1] tracking-tight">
                {slide.title}
              </h2>
              <span className="inline-flex items-center mt-6 text-bg/80 text-sm tracking-wide group-hover:text-bg transition-colors">
                Explorar
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>
      ))}

      {/* Dots — z-30, separados del Link de slide */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2">
        {SLIDES.map((slide, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            aria-current={idx === active ? "true" : "false"}
            className="group p-3 cursor-pointer"
          >
            <span
              className={`block h-[3px] rounded-full transition-all duration-300 ${
                idx === active
                  ? "w-10 bg-bg"
                  : "w-6 bg-bg/40 group-hover:bg-bg/75"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
