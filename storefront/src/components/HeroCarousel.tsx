"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { HeroSlide } from "@/lib/shopify/types"

/**
 * HeroCarousel — slideshow rotativo del home.
 *
 * Fuente de datos: `slides` viene de Shopify Metaobjects (definición
 * `hero_slide`). Si llega vacío (admin no ha cargado nada o el query
 * falló), usamos PLACEHOLDER_SLIDES para no dejar la home en blanco.
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

type Props = {
  slides?: HeroSlide[]
}

// Fallback cuando Shopify aún no tiene Metaobjects cargados.
// La estructura imita el HeroSlide pero sin imagen — usa los gradients
// de cuero como background. Mismo orden de gradients que HERO_FALLBACK_GRADIENTS
// en lib/shopify/index.ts para que el look se mantenga al ir migrando uno a uno.
const PLACEHOLDER_SLIDES: HeroSlide[] = [
  {
    id: "placeholder-1",
    handle: "placeholder-1",
    eyebrow: "Colección · Otoño",
    title: "Hecho en León.",
    href: "/products",
    image: null,
    bgClass: "bg-gradient-to-br from-leather via-leather-light to-leather-dark",
  },
  {
    id: "placeholder-2",
    handle: "placeholder-2",
    eyebrow: "Hombre · Vaqueras",
    title: "Para décadas.",
    href: "/hombre",
    image: null,
    bgClass: "bg-gradient-to-br from-terracotta-dark via-terracotta to-leather",
  },
  {
    id: "placeholder-3",
    handle: "placeholder-3",
    eyebrow: "Mujer · Nueva colección",
    title: "Cuero auténtico.",
    href: "/mujer",
    image: null,
    bgClass: "bg-gradient-to-br from-cognac via-gold to-leather-light",
  },
]

const AUTO_ROTATE_MS = 8000

// Swipe thresholds:
//  - SWIPE_MIN_DELTA: distancia mínima horizontal para aceptar como swipe.
//  - SWIPE_FLICK_DELTA + SWIPE_FLICK_VELOCITY: detección de flick rápido
//    (gesto corto pero con alta velocidad).
const SWIPE_MIN_DELTA = 50
const SWIPE_FLICK_DELTA = 30
const SWIPE_FLICK_VELOCITY = 0.5

export function HeroCarousel({ slides }: Props) {
  const data = slides && slides.length > 0 ? slides : PLACEHOLDER_SLIDES
  const [active, setActive] = useState(0)
  // touched: el usuario interactuó (click en dot, touchstart, keydown nav).
  // Una vez true queda permanente — el usuario tomó control, no le re-
  // imponemos la rotación automática (WCAG 2.2.2).
  const [touched, setTouched] = useState(false)
  // visible: el hero está dentro del viewport. Si el usuario scrolleó
  // más abajo, pausamos la rotación para ahorrar batería + cumplir WCAG.
  const [visible, setVisible] = useState(true)
  // reducedMotion: respetar prefers-reduced-motion. Si true, no arranca
  // auto-rotate; solo se muestra el primer slide (active=0).
  const [reducedMotion, setReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)

  // Refs para tracking de swipe horizontal en mobile.
  // Usamos refs (no state) porque no necesitamos re-render durante el gesto;
  // solo leemos en touchend para decidir si fue swipe válido.
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)

  const markTouched = useCallback(() => {
    setTouched(true)
  }, [])

  const goTo = useCallback((idx: number) => {
    setActive(idx)
    setTouched(true)
  }, [])

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1) % data.length)
    setTouched(true)
  }, [data.length])

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 + data.length) % data.length)
    setTouched(true)
  }, [data.length])

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    markTouched()
    const t = e.touches[0]
    if (!t) return
    touchStartX.current = t.clientX
    touchStartY.current = t.clientY
    touchStartTime.current = Date.now()
  }, [markTouched])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const startX = touchStartX.current
      const startY = touchStartY.current
      const startTime = touchStartTime.current
      // Reset siempre, aunque no haya sido swipe válido.
      touchStartX.current = null
      touchStartY.current = null
      touchStartTime.current = null

      if (startX === null || startY === null || startTime === null) return
      if (data.length <= 1) return

      const t = e.changedTouches[0]
      if (!t) return

      const deltaX = t.clientX - startX
      const deltaY = t.clientY - startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Si el movimiento es más vertical que horizontal, es scroll de página,
      // no swipe del carousel. Ignorar.
      if (absY > absX) return

      const elapsed = Date.now() - startTime
      const velocity = elapsed > 0 ? absX / elapsed : 0
      const isFlick =
        absX >= SWIPE_FLICK_DELTA && velocity > SWIPE_FLICK_VELOCITY

      if (absX < SWIPE_MIN_DELTA && !isFlick) return

      if (deltaX < 0) {
        goNext()
      } else {
        goPrev()
      }
    },
    [data.length, goNext, goPrev]
  )

  const onTouchCancel = useCallback(() => {
    touchStartX.current = null
    touchStartY.current = null
    touchStartTime.current = null
  }, [])

  // Detecta prefers-reduced-motion en mount + escucha cambios.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // IntersectionObserver — pausa cuando el hero sale del viewport.
  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Auto-rotate cada 8s. Se deshabilita si:
  //  - hay un solo slide
  //  - el usuario ya interactuó (touched)
  //  - el sistema pide reduced motion
  //  - el hero está fuera del viewport
  useEffect(() => {
    if (data.length <= 1) return
    if (touched) return
    if (reducedMotion) return
    if (!visible) return
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % data.length)
    }, AUTO_ROTATE_MS)
    return () => clearInterval(interval)
  }, [data.length, touched, reducedMotion, visible])

  // Keydown nav handler — flechas izq/der saltan slide y marcan touched.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (data.length <= 1) return
      if (e.key === "ArrowRight") {
        e.preventDefault()
        setActive((prev) => (prev + 1) % data.length)
        setTouched(true)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        setActive((prev) => (prev - 1 + data.length) % data.length)
        setTouched(true)
      }
    },
    [data.length]
  )

  // Ken-burns solo si NO hay reduced motion (la CSS rule también lo
  // respeta, pero aplicar la clase condicionalmente evita cualquier
  // animación parásita / FOUC en navegadores que tarden en parsear MQ).
  const kenBurnsClass = reducedMotion ? "" : "hero-ken-burns"

  return (
    <section
      ref={sectionRef}
      role="region"
      className="relative w-full h-[70vh] min-h-[480px] max-h-[680px] overflow-hidden bg-leather touch-pan-y"
      aria-roledescription="carousel"
      aria-label="Hero"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onPointerDown={markTouched}
      onKeyDown={onKeyDown}
    >
      {/* Slides — cada uno es Link clickeable completo */}
      {data.map((slide, idx) => (
        <Link
          key={slide.id}
          href={slide.href}
          tabIndex={idx === active ? 0 : -1}
          aria-hidden={idx !== active}
          aria-label={`${slide.eyebrow}: ${slide.title}`}
          className={`absolute inset-0 block group transition-opacity duration-700 ${
            idx === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background — imagen real si existe, gradient de cuero si no.
              `hero-ken-burns` se aplica solo cuando el slide está activo:
              al rotar la clase desaparece, y al volver a este slide se
              reaplica desde 0% (browser reinicia la animación). */}
          {slide.image ? (
            <div className={`absolute inset-0 ${idx === active ? kenBurnsClass : ""}`}>
              <Image
                src={slide.image.url}
                alt={slide.image.altText || slide.title}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className={`absolute inset-0 ${slide.bgClass ?? "bg-leather"} ${idx === active ? kenBurnsClass : ""}`} />
          )}

          {/* Texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 30%, rgba(255,255,255,0.22) 0%, transparent 55%),
                radial-gradient(circle at 75% 70%, rgba(0,0,0,0.30) 0%, transparent 65%)
              `,
            }}
          />

          {/* Gradient inferior para contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />

          {/* Content anclado abajo-izquierda */}
          <div className="absolute inset-x-0 bottom-0 px-8 md:px-16 lg:px-20 pb-20 md:pb-24">
            <div className="max-w-7xl mx-auto">
              {slide.eyebrow && (
                <p className="eyebrow text-gold mb-4 text-xs md:text-sm tracking-[0.25em]">
                  {slide.eyebrow}
                </p>
              )}
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

      {/* Dots — z-30, separados del Link de slide. Solo si hay más de uno. */}
      {data.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2">
          {data.map((_, idx) => (
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
      )}
    </section>
  )
}
