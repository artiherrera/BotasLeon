"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import type { Product, Image as ShopifyImage } from "@/lib/shopify/types"
import { JudgemeStars } from "./JudgemeStars"
import { LocalizedPrice, useProductTranslation } from "./LocalizedProductContent"
import { useLocale, useT } from "@/lib/i18n/context"
import { atributosDeTarjeta } from "@/lib/shopify/facets"
import { facetLabel } from "@/lib/facets-i18n"
import { saleInfo } from "@/lib/utils"

/**
 * Tarjeta de producto para grids (home, listing, marca page).
 *
 * La miniatura es un mini-carrusel: en móvil se hace SWIPE (scroll-snap nativo),
 * en desktop aparecen flechas discretas al pasar el mouse + puntos indicadores.
 * La tarjeta entera es el enlace al PDP (deslizar o usar las flechas NO navega).
 *
 * SIN compra rápida: la talla de 101 de los 103 productos no es variante sino
 * metacampo, así que agregar desde el grid creaba una línea sin talla que no
 * podía pagar hasta elegirla en el carrito. Se elige en la ficha, que es donde
 * vive el selector. (El candado de talla del carrito NO se toca: hay carritos
 * en localStorage creados antes de este cambio.)
 */

/**
 * Una bota es "nueva" durante 30 días. Medido sobre el catálogo real: con 30
 * días la insignia marca 12 de 103 productos; con 60 marcaría 63, o sea más de
 * la mitad del catálogo, y dejaría de querer decir nada.
 */
const DIAS_NUEVA = 30
const MS_POR_DIA = 24 * 60 * 60 * 1000

function esNueva(createdAt?: string | null): boolean {
  if (!createdAt) return false
  const alta = Date.parse(createdAt)
  if (Number.isNaN(alta)) return false
  return Date.now() - alta < DIAS_NUEVA * MS_POR_DIA
}

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
  const { locale } = useLocale()
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

  /* "Horma · Piel": los dos únicos atributos que existen en los 103 productos
     (la suela no está capturada en ninguno). Vienen de Shopify en español, así
     que en el sitio en inglés hay que pasarlos por facetLabel. */
  const atributos = atributosDeTarjeta(product)
    .map((label) => facetLabel(label, locale))
    .join(" · ")

  const { onSale } = saleInfo(minPrice.amount, compareAt?.amount)
  const nueva = esNueva(product.createdAt)

  return (
    <Link
      href={`/products/${handle}`}
      className="group flex h-full flex-col"
      aria-label={
        product.availableForSale
          ? `${t("card.view")} ${displayTitle}`
          : `${t("card.view")} ${displayTitle} ${t("card.soldOutParen")}`
      }
    >
      <div className="plato shrink-0 mb-3">
        {gallery.length === 0 ? (
          <PlaceholderImage />
        ) : singleImage ? (
          <Image src={gallery[0].url} alt={gallery[0].altText || title} fill sizes={SIZES} />
        ) : (
          <CardGallery images={gallery} alt={title} />
        )}
        {/* Las insignias se apilan arriba a la izquierda. El agotado es el único
            en tinta sólida: es un estado que impide comprar, no un adorno.
            "Nueva" solo se pinta si la bota no está ya marcada por otra cosa —
            tres etiquetas encima de la foto serían ruido. */}
        <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1">
          {!product.availableForSale && (
            <span className="bg-text/90 text-bg eyebrow text-xs px-2 py-1">
              {t("card.soldOut")}
            </span>
          )}
          {onSale && (
            <span className="bg-bg text-text border border-border eyebrow text-xs px-2 py-1">
              {t("card.badgeOutlet")}
            </span>
          )}
          {nueva && product.availableForSale && !onSale && (
            <span className="bg-bg text-text border border-border eyebrow text-xs px-2 py-1">
              {t("card.badgeNew")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1">
        {/* El renglón de marca se pinta SIEMPRE, con un espacio duro cuando el
            producto no la trae: si desaparece, esa tarjeta sube todo lo de
            abajo y deja de cuadrar con sus vecinas. */}
        <p className="eyebrow text-xs text-leather mb-1">{vendor || " "}</p>
        {/* line-clamp-2: un nombre muy largo estiraba su tarjeta sola. */}
        <h3 className="nombre-producto text-text mb-1 line-clamp-2 group-hover:underline underline-offset-4">
          {displayTitle}
        </h3>
        {/* Mismo motivo que el vendor: 5 de los 103 productos no traen ni horma
            ni piel, y sin el espacio duro su precio subiría un renglón y
            rompería la línea base de la fila. */}
        <p className="nota mb-1">{atributos || " "}</p>
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
          {/* Invitación que aparece al pasar el cursor. aria-hidden porque el
              enlace ya se anuncia como "Ver {título}" y si no, el lector de
              pantalla diría dos cosas por tarjeta. En móvil no se pinta: no hay
              hover y la tarjeta entera ya es el enlace. */}
          <span
            aria-hidden
            className="btn-ter hidden md:inline-block mt-2 text-sm opacity-0 transition duration-[180ms] group-hover:opacity-100"
          >
            {t("card.chooseSize")}
          </span>
        </div>
      </div>
    </Link>
  )
}

const SIZES = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"

function CardGallery({ images, alt }: { images: ShopifyImage[]; alt: string }) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const count = images.length

  if (count === 1) {
    return <Image src={images[0].url} alt={images[0].altText || alt} fill sizes={SIZES} />
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
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center border border-border bg-bg/90 text-text cursor-pointer opacity-0 transition duration-[180ms] group-hover:opacity-100 hover:bg-text hover:text-bg ${
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
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((im, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center">
            <Image
              src={im.url}
              alt={im.altText || alt}
              fill
              sizes={SIZES}
              loading={i === 0 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>

      {idx > 0 && <Arrow dir={-1} label={t("rail.prev")} />}
      {idx < count - 1 && <Arrow dir={1} label={t("rail.next")} />}

      {/* Puntos indicadores. Aquí el rounded-full se queda: son círculos de
          verdad, no una caja redondeada. */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-[180ms] ${
              i === idx ? "bg-text" : "bg-text/30"
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
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  )
}
