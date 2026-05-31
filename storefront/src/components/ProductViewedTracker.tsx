"use client"

import { useEffect } from "react"
import { track } from "@/lib/klaviyo/client"
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
  }, [product.id, product.handle, product.title, product.vendor, product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode, product.featuredImage?.url])

  return null
}
