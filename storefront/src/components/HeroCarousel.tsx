"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/**
 * HeroCarousel — slideshow rotativo para el home.
 *
 * 3 slides con copy distinto pero misma identidad de marca. Auto-rotate
 * cada 7s con pausa en hover. Dots clickeables para nav manual.
 *
 * Placeholders visuales: cada slide usa un gradient cuero distinto.
 * Cuando el cliente suba fotos reales, reemplazar `bgClass` por
 * `bgImage` con URL Shopify CDN.
 */

type Slide = {
  eyebrow: string
  titleLine1: string
  titleLine2: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  bgClass: string
}

const SLIDES: Slide[] = [
  {
    eyebrow: "León, Guanajuato",
    titleLine1: "380 años de experiencia.",
    titleLine2: "A la puerta de tu casa.",
    subtitle: "Curamos los mejores talleres de León — para ti.",
    ctaLabel: "Explorar colección",
    ctaHref: "/products",
    bgClass: "bg-gradient-to-br from-leather via-leather-light to-leather",
  },
  {
    eyebrow: "Hombre · Vaqueras",
    titleLine1: "Vaqueras",
    titleLine2: "que duran décadas.",
    subtitle: "Piel genuina, costura a mano, terminado impecable.",
    ctaLabel: "Ver hombre",
    ctaHref: "/hombre",
    bgClass: "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  },
  {
    eyebrow: "Mujer · SS26",
    titleLine1: "Cuero auténtico.",
    titleLine2: "Estilo propio.",
    subtitle: "Botines, vaqueras y altas de las mejores marcas mexicanas.",
    ctaLabel: "Ver mujer",
    ctaHref: "/mujer",
    bgClass: "bg-gradient-to-br from-cognac via-gold to-leather-light",
  },
]

const AUTO_ROTATE_MS = 7000

export function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, AUTO_ROTATE_MS)
    return () => clearInterval(interval)
  }, [paused])

  return (
    <section
      className="relative w-full h-[80vh] min-h-[560px] max-h-[760px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Banners destacados"
    >
      {/* Slides */}
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          aria-hidden={idx !== active}
        >
          {/* Background — gradient placeholder, swappable por foto */}
          <div className={`absolute inset-0 ${slide.bgClass}`} />

          {/* Pattern overlay for depth */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(0,0,0,0.4) 0%, transparent 60%)
              `,
            }}
          />

          {/* Gradient para mejor contraste con el texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative h-full mx-auto max-w-7xl px-6 lg:px-12 flex items-center">
            <div className="max-w-2xl">
              <p className="eyebrow text-gold mb-5 text-sm">{slide.eyebrow}</p>
              <h1 className="font-display text-bg text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1] mb-2">
                {slide.titleLine1}
              </h1>
              <h1 className="font-display text-bg text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1] mb-8">
                {slide.titleLine2}
              </h1>
              <p className="text-bg-alt text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                {slide.subtitle}
              </p>
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center px-8 py-4 bg-bg text-leather font-medium tracking-wide hover:bg-bg-alt transition-colors group"
              >
                {slide.ctaLabel}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActive(idx)}
            aria-label={`Ir a slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === active
                ? "w-12 bg-bg"
                : "w-1.5 bg-bg/40 hover:bg-bg/70"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
