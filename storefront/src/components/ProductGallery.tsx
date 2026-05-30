"use client"

import { useState } from "react"
import Image from "next/image"
import type { Image as ShopifyImage } from "@/lib/shopify/types"

/**
 * Galería de imágenes del PDP.
 *
 * Layout: imagen grande arriba + tira de thumbnails abajo.
 * Click en thumbnail cambia la imagen principal. Mobile-first
 * (la tira queda debajo de la principal en cualquier tamaño).
 *
 * Optimizada para botas (aspect 4:5 / portrait). Si las fotos
 * vienen en otra proporción, object-cover las recorta sin
 * deformar.
 */

type Props = {
  images: ShopifyImage[]
  title: string
}

export function ProductGallery({ images, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-bg-alt flex items-center justify-center text-text-subtle">
        <p className="text-sm">Sin imágenes disponibles</p>
      </div>
    )
  }

  const active = images[activeIdx]

  return (
    <div>
      {/* Imagen principal */}
      <div className="relative aspect-[4/5] bg-bg-alt overflow-hidden mb-3">
        <Image
          key={active.url}
          src={active.url}
          alt={active.altText || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails — solo si hay más de 1 */}
      {images.length > 1 && (
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
  )
}
