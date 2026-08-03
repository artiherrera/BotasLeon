"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import type { Product, Image as ShopifyImage } from "@/lib/shopify/types"
import { JudgemeStars } from "./JudgemeStars"
import { LocalizedPrice, useProductTranslation } from "./LocalizedProductContent"
import { useT } from "@/lib/i18n/context"

/**
 * Tarjeta de producto para grids (home, listing, marca page).
 *
 * La miniatura es un mini-carrusel: en móvil se hace SWIPE (scroll-snap nativo),
 * en desktop aparecen flechas discretas al pasar el mouse + puntos indicadores.
 * Toda la tarjeta sigue siendo un enlace al PDP (tocar la foto navega; deslizar
 * o usar las flechas NO navega).
 */
export function ProductCard({ product }: { product: Product }) {
  const t = useT()
  const { handle, title, vendor, featuredImage, priceRange } = product
  const loc = useProductTranslation(handle)
  const displayTitle = loc?.title?.trim() || title
  const minPrice = priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.minVariantPrice

  // Galería: portada primero + el resto, sin duplicados. Máx 6.
  const seen = new Set<string>()
  const gallery = [featuredImage, ...(product.images ?? [])]
    .filter((im): im is ShopifyImage => !!im?.url)
    .filter((im) => (seen.has(im.url) ? false : (seen.add(im.url), true)))
    .slice(0, 6)

  return (
    <Link
      href={`/products/${handle}`}
      className="group block"
      aria-label={
        product.availableForSale
          ? `${t("card.view")} ${displayTitle}`
          : `${t("card.view")} ${displayTitle} ${t("card.soldOutParen")}`
      }
    >
      <div className="relative aspect-square overflow-hidden bg-bg-alt rounded-sm mb-3">
        {gallery.length > 0 ? (
          <CardGallery images={gallery} alt={title} />
        ) : (
          <PlaceholderImage />
        )}
        {!product.availableForSale && (
          <div className="absolute top-3 left-3 z-20 bg-text/90 text-bg eyebrow text-xs px-2 py-1 rounded">
            {t("card.soldOut")}
          </div>
        )}
      </div>

      <div className="px-1">
        {vendor && (
          <p className="eyebrow text-text-subtle group-hover:text-leather transition-colors mb-1">
            {vendor}
          </p>
        )}
        <h3 className="font-heading text-lg text-text leading-tight mb-1">
          {displayTitle}
        </h3>
        {product.judgemeRating != null && product.judgemeRating > 0 && (
          <div className="mb-1">
            <JudgemeStars
              rating={product.judgemeRating}
              count={product.judgemeReviewCount ?? null}
              size="sm"
            />
          </div>
        )}
        <LocalizedPrice
          handle={handle}
          amount={minPrice.amount}
          currency={minPrice.currencyCode}
          compareAt={compareAt?.amount}
          size="card"
        />
      </div>
    </Link>
  )
}

const SIZES = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"

function CardGallery({ images, alt }: { images: ShopifyImage[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const count = images.length

  if (count === 1) {
    return (
      <Image
        src={images[0].url}
        alt={images[0].altText || alt}
        fill
        sizes={SIZES}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    )
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== idx) setIdx(Math.min(Math.max(i, 0), count - 1))
  }

  // Las flechas van dentro del <a>: usamos <span role=button> (válido en anchor)
  // y frenamos la navegación con preventDefault + stopPropagation.
  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = trackRef.current
    if (!el) return
    const next = Math.min(Math.max(idx + dir, 0), count - 1)
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
  }

  const Arrow = ({ dir, label }: { dir: 1 | -1; label: string }) => (
    <span
      role="button"
      aria-label={label}
      onClick={go(dir)}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-bg/80 text-text shadow-md backdrop-blur-sm cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-bg ${
        dir === -1 ? "left-2" : "right-2"
      }`}
    >
      {dir === -1 ? "‹" : "›"}
    </span>
  )

  return (
    <>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((im, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center">
            <Image
              src={im.url}
              alt={im.altText || alt}
              fill
              sizes={SIZES}
              loading={i === 0 ? undefined : "lazy"}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {idx > 0 && <Arrow dir={-1} label="Anterior" />}
      {idx < count - 1 && <Arrow dir={1} label="Siguiente" />}

      {/* Puntos indicadores */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)] transition-colors ${
              i === idx ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </>
  )
}

function PlaceholderImage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-text-subtle">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  )
}
