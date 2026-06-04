import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/shopify/types"
import { formatMoney } from "@/lib/utils"
import { JudgemeStars } from "./JudgemeStars"

/**
 * Tarjeta de producto para grids (home, listing, marca page).
 * Hover: ligera elevación, foto crece sutil, "vendor" se ilumina.
 * Look minimalista premium — la foto manda, el texto soporta.
 */
export function ProductCard({ product }: { product: Product }) {
  const { handle, title, vendor, featuredImage, priceRange } = product
  const minPrice = priceRange.minVariantPrice

  return (
    <Link
      href={`/products/${handle}`}
      className="group block"
      aria-label={`Ver ${title}`}
    >
      <div className="relative aspect-square overflow-hidden bg-bg-alt rounded-sm mb-3">
        {featuredImage ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.altText || title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <PlaceholderImage />
        )}
        {!product.availableForSale && (
          <div className="absolute top-3 left-3 bg-text/90 text-bg eyebrow text-xs px-2 py-1 rounded">
            Agotado
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
          {title}
        </h3>
        <div className="mb-1">
          <JudgemeStars
            rating={product.judgemeRating ?? null}
            count={product.judgemeReviewCount ?? null}
            size="sm"
          />
        </div>
        <p className="text-text-muted text-sm">
          {formatMoney(minPrice.amount, minPrice.currencyCode)}
        </p>
      </div>
    </Link>
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
