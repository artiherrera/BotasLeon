"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import type { Image as ShopifyImage } from "@/lib/shopify/types"
import { useFocusTrap } from "@/lib/useFocusTrap"

/**
 * Galería de imágenes del PDP.
 *
 * Desktop (md+): imagen principal grande + thumbnails clicables abajo.
 * Mobile (<md): carrusel horizontal con scroll-snap nativo + dots indicators.
 *
 * Click en la imagen principal (o swipe en mobile) abre lightbox fullscreen
 * con navegación, soporte ESC y bloqueo de scroll del body. Cero dependencias
 * externas — usa createPortal de react-dom + APIs nativas (IntersectionObserver,
 * scroll-snap, scrollIntoView).
 */

type Props = {
  images: ShopifyImage[]
  title: string
}

export function ProductGallery({ images, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Mobile carousel refs
  const trackRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // IntersectionObserver para mobile dots — el slide más visible define activeIdx.
  useEffect(() => {
    const track = trackRef.current
    if (!track || images.length <= 1) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Tomar el slide más visible (mayor intersectionRatio)
        let bestIdx = -1
        let bestRatio = 0
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            const idxAttr = (entry.target as HTMLElement).dataset.idx
            if (idxAttr) bestIdx = Number(idxAttr)
          }
        }
        if (bestIdx !== -1 && bestRatio > 0.5) {
          setActiveIdx(bestIdx)
        }
      },
      { root: track, threshold: [0.25, 0.5, 0.75, 1] },
    )

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide)
    }

    return () => observer.disconnect()
  }, [images.length])

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIdx(null)
  }, [])

  const goPrev = useCallback(() => {
    setLightboxIdx((cur) => (cur === null ? cur : (cur - 1 + images.length) % images.length))
  }, [images.length])

  const goNext = useCallback(() => {
    setLightboxIdx((cur) => (cur === null ? cur : (cur + 1) % images.length))
  }, [images.length])

  // Bloqueo de scroll + manejo de teclas cuando lightbox está abierto
  useEffect(() => {
    if (lightboxIdx === null) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [lightboxIdx, closeLightbox, goPrev, goNext])

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-bg-alt flex items-center justify-center text-text-subtle">
        <p className="text-sm">Sin imágenes disponibles</p>
      </div>
    )
  }

  const active = images[activeIdx]
  const hasMultiple = images.length > 1

  // Scroll programático del carrusel mobile cuando se tap en un dot
  const scrollToIdx = (idx: number) => {
    const slide = slideRefs.current[idx]
    if (slide) slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }

  return (
    <div>
      {/* === DESKTOP: imagen principal grande === */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => openLightbox(activeIdx)}
          aria-label="Ampliar imagen"
          className="relative aspect-[4/5] bg-bg-alt overflow-hidden mb-3 w-full block cursor-zoom-in"
        >
          <Image
            key={active.url}
            src={active.url}
            alt={active.altText || title}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </button>

        {hasMultiple && (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
            {images.map((img, idx) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
                aria-current={idx === activeIdx}
                className={`relative aspect-square bg-bg-alt overflow-hidden transition-all ${
                  idx === activeIdx
                    ? "ring-2 ring-leather ring-offset-2 ring-offset-bg"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${title} ${idx + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* === MOBILE: carrusel scroll-snap + dots === */}
      <div className="md:hidden">
        {/* Hide WebKit scrollbar globally for this track class */}
        <style>{`.pg-mobile-track::-webkit-scrollbar{display:none}`}</style>
        <div
          ref={trackRef}
          className="pg-mobile-track flex overflow-x-auto snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {images.map((img, idx) => (
            <div
              key={img.url}
              ref={(el) => {
                slideRefs.current[idx] = el
              }}
              data-idx={idx}
              className="snap-center shrink-0 basis-full min-w-full"
            >
              <button
                type="button"
                onClick={() => openLightbox(idx)}
                aria-label={`Ampliar imagen ${idx + 1}`}
                className="relative aspect-square bg-bg-alt overflow-hidden w-full block cursor-zoom-in"
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${title} ${idx + 1}`}
                  fill
                  preload={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </button>
            </div>
          ))}
        </div>

        {hasMultiple && (
          <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Imágenes del producto">
            {images.map((img, idx) => (
              <button
                key={img.url}
                type="button"
                role="tab"
                aria-selected={idx === activeIdx}
                aria-label={`Ir a imagen ${idx + 1}`}
                onClick={() => scrollToIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activeIdx ? "w-6 bg-leather" : "w-2 bg-border-strong/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* === LIGHTBOX (portal) === */}
      {mounted && lightboxIdx !== null
        ? createPortal(
            <Lightbox
              images={images}
              idx={lightboxIdx}
              title={title}
              onClose={closeLightbox}
              onPrev={goPrev}
              onNext={goNext}
            />,
            document.body,
          )
        : null}
    </div>
  )
}

function Lightbox({
  images,
  idx,
  title,
  onClose,
  onPrev,
  onNext,
}: {
  images: ShopifyImage[]
  idx: number
  title: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[idx]
  const hasMultiple = images.length > 1
  // Foco atrapado dentro del lightbox y restaurado a la miniatura al cerrar.
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ampliada ${idx + 1} de ${images.length}`}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Cerrar */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Cerrar"
        data-autofocus
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/90 hover:text-white text-2xl bg-black/40 rounded-full"
      >
        ×
      </button>

      {/* Imagen — sin stopPropagation envolvente para que click en backdrop cierre */}
      <Image
        key={img.url}
        src={img.url}
        alt={img.altText || `${title} ${idx + 1}`}
        fill
        sizes="100vw"
        onClick={(e) => e.stopPropagation()}
        className="object-contain p-4 md:p-12 cursor-default"
      />

      {/* Nav prev/next — solo si hay más de 1 */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="Imagen anterior"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white text-3xl bg-black/40 rounded-full"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label="Imagen siguiente"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white text-3xl bg-black/40 rounded-full"
          >
            ›
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-body tabular-nums">
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
