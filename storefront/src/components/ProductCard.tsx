"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import type { Product, Image as ShopifyImage } from "@/lib/shopify/types"
import { JudgemeStars } from "./JudgemeStars"
import { LocalizedPrice, useProductTranslation } from "./LocalizedProductContent"
import { useT } from "@/lib/i18n/context"
import { useCart } from "@/components/CartProvider"

/**
 * Tarjeta de producto para grids (home, listing, marca page).
 *
 * La miniatura es un mini-carrusel: en móvil se hace SWIPE (scroll-snap nativo),
 * en desktop aparecen flechas discretas al pasar el mouse + puntos indicadores.
 * La foto y el texto siguen siendo enlace al PDP (deslizar o usar las flechas
 * NO navega).
 *
 * COMPRA DIRECTA: el botón "Agregar" mete la bota al carrito sin pasar por la
 * ficha. Puede hacerlo porque TODO el catálogo es de variante única — la talla
 * no es variante, vive en un metacampo y viaja como atributo de línea — así que
 * se elige después, en el carrito (ver CartLineSize). El botón va FUERA del
 * <a> del enlace: un <button> dentro de un <a> es HTML inválido.
 */
export function ProductCard({
  product,
  singleImage = false,
}: {
  product: Product
  /**
   * Muestra solo la portada, sin el carrusel interno de fotos. Se usa dentro de
   * ProductRail: dos deslizadores horizontales anidados se disputan el gesto en
   * móvil y gana el de adentro, dejando el riel atascado.
   */
  singleImage?: boolean
}) {
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

  const { addItem, isPending } = useCart()
  const variantId = product.variants?.[0]?.id ?? null
  const canQuickAdd = !!variantId && product.availableForSale

  return (
    <div className="group flex h-full flex-col">
    <Link
      href={`/products/${handle}`}
      className="flex flex-1 flex-col"
      aria-label={
        product.availableForSale
          ? `${t("card.view")} ${displayTitle}`
          : `${t("card.view")} ${displayTitle} ${t("card.soldOutParen")}`
      }
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-bg-alt rounded-sm mb-3">
        {gallery.length === 0 ? (
          <PlaceholderImage />
        ) : singleImage ? (
          <Image
            src={gallery[0].url}
            alt={gallery[0].altText || title}
            fill
            sizes={SIZES}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CardGallery images={gallery} alt={title} />
        )}
        {!product.availableForSale && (
          <div className="absolute top-3 left-3 z-20 bg-text/90 text-bg eyebrow text-xs px-2 py-1 rounded">
            {t("card.soldOut")}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1">
        {/* El renglón de marca se pinta SIEMPRE, con un espacio duro cuando el
            producto no la trae: si desaparece, esa tarjeta sube todo lo de
            abajo y deja de cuadrar con sus vecinas. */}
        <p className="eyebrow text-text-subtle group-hover:text-leather transition-colors mb-1">
          {vendor || "\u00A0"}
        </p>
        {/* line-clamp-2: un nombre muy largo estiraba su tarjeta sola. */}
        <h3 className="font-heading text-lg text-text leading-tight mb-1 line-clamp-2">
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
        {/* mt-auto: el precio se ancla al fondo del bloque de texto, así queda
            a la misma altura aunque una tarjeta traiga estrellas y otra no. */}
        <div className="mt-auto">
          <LocalizedPrice
            amount={minPrice.amount}
            currency={minPrice.currencyCode}
            compareAt={compareAt?.amount}
            size="card"
          />
        </div>
      </div>
    </Link>

    {canQuickAdd ? (
      <button
        type="button"
        disabled={isPending}
        aria-label={t("card.addAria").replace("{title}", displayTitle)}
        onClick={() => addItem(variantId, 1)}
        className="mt-3 w-full px-1 py-2.5 border border-text text-text text-sm font-medium hover:bg-text hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {t("card.add")}
      </button>
    ) : (
      /* Un agotado no pinta botón, y sin este hueco su tarjeta quedaba más
         corta que las demás. Replica la caja del botón (mismo padding, borde
         y tamaño de texto) en vez de fijar una altura en píxeles, para que no
         se despegue si el botón cambia. */
      <div
        aria-hidden
        className="mt-3 select-none border border-transparent px-1 py-2.5 text-sm font-medium"
      >
        &nbsp;
      </div>
    )}
    </div>
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
