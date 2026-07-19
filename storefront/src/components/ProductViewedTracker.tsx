"use client"

import { useEffect } from "react"
import { track } from "@/lib/klaviyo/client"
import { pixelTrack, toContentId } from "@/lib/meta/pixel"
import { gaEvent } from "@/lib/ga/events"
import type { Product } from "@/lib/shopify/types"

/**
 * ProductViewedTracker — componente invisible que dispara el evento
 * "Viewed Product" en Klaviyo al renderizar la PDP. Habilita el flow
 * de "Browse Abandonment" (cliente vio producto, no agregó al carrito).
 *
 * No bloquea SSR — render server-side OK, evento solo se dispara en
 * cliente vía useEffect.
 */

export function ProductViewedTracker({ product }: { product: Product }) {
  useEffect(() => {
    track("Viewed Product", {
      ProductName: product.title,
      ProductId: product.handle,
      Brand: product.vendor,
      Price: parseFloat(product.priceRange.minVariantPrice.amount),
      Currency: product.priceRange.minVariantPrice.currencyCode,
      ImageURL: product.featuredImage?.url,
      URL: typeof window !== "undefined" ? window.location.href : undefined,
    })

    // Meta ViewContent — content_ids = ID de producto (item_group del
    // catálogo) para que los anuncios dinámicos / retargeting hagan match.
    pixelTrack("ViewContent", {
      content_type: "product_group",
      content_ids: [toContentId(product.id)],
      content_name: product.title,
      value: parseFloat(product.priceRange.minVariantPrice.amount),
      currency: product.priceRange.minVariantPrice.currencyCode,
    })

    // GA4 view_item — para el embudo en Google Analytics.
    gaEvent("view_item", {
      currency: product.priceRange.minVariantPrice.currencyCode,
      value: parseFloat(product.priceRange.minVariantPrice.amount),
      items: [
        {
          item_id: product.handle,
          item_name: product.title,
          item_brand: product.vendor,
          price: parseFloat(product.priceRange.minVariantPrice.amount),
        },
      ],
    })
  }, [product.id, product.handle, product.title, product.vendor, product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode, product.featuredImage?.url])

  return null
}
