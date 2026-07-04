"use client"

import { createContext, useContext, useMemo, useState } from "react"
import {
  filterImagesByColor,
  findVariantBySelection,
  getColorOption,
} from "@/lib/pdp/variants"
import type { Image as ShopifyImage, Product } from "@/lib/shopify/types"

/**
 * PDPVariantContext — estado compartido entre ProductGallery y ProductOptions
 * sin restructurar la PDP page.
 *
 * Problema que resuelve: el selector de color vive en ProductOptions (columna
 * derecha) pero las imágenes filtradas las consume ProductGallery (columna
 * izquierda). Levantar el state hasta la página rompería la composición
 * server/client de los demás bloques (TrustBlock, Reviews, Description).
 * Context permite que ambos componentes lean/escriban del mismo state sin
 * que el resto se entere.
 *
 * El provider envuelve SOLO el grid de Gallery+Options. El resto del PDP
 * (RelatedProducts, RecentlyViewed, breadcrumb, etc.) queda fuera.
 */

type Selection = Record<string, string>

type Ctx = {
  product: Product
  selection: Selection
  setOption: (name: string, value: string) => void
  activeVariant: Product["variants"][number] | null
  activeColor: string | null
  filteredImages: ShopifyImage[]
}

const PDPVariantCtx = createContext<Ctx | null>(null)

export function usePDPVariant(): Ctx {
  const ctx = useContext(PDPVariantCtx)
  if (!ctx) {
    throw new Error("usePDPVariant debe usarse dentro de <PDPVariantProvider>")
  }
  return ctx
}

// ¿La opción es "talla"? (para NO pre-seleccionarla).
function isSizeName(name: string): boolean {
  const n = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
  return n === "talla" || n === "talla del calzado" || n === "size" || n.includes("talla")
}

// Pre-selecciona todo MENOS la talla (color, etc. para que la galería muestre
// las imágenes correctas). La talla la debe elegir el cliente activamente.
function getInitialSelection(product: Product): Selection {
  const firstAvailable =
    product.variants.find((v) => v.availableForSale) ?? product.variants[0]
  if (!firstAvailable) return {}
  return Object.fromEntries(
    firstAvailable.selectedOptions
      .filter((o) => !isSizeName(o.name))
      .map((o) => [o.name, o.value])
  )
}

export function PDPVariantProvider({
  product,
  children,
}: {
  product: Product
  children: React.ReactNode
}) {
  const [selection, setSelection] = useState<Selection>(() => getInitialSelection(product))

  const setOption = (name: string, value: string) => {
    setSelection((prev) => ({ ...prev, [name]: value }))
  }

  const activeVariant = useMemo(
    () => findVariantBySelection(product, selection),
    [product, selection]
  )

  const colorOpt = useMemo(() => getColorOption(product), [product])

  const activeColor = useMemo(() => {
    if (!colorOpt) return null
    return selection[colorOpt.name] ?? null
  }, [colorOpt, selection])

  // Las imágenes neutras de la galería son product.images; si está vacío,
  // caemos a featuredImage como única (consistente con lo que la PDP page
  // pasaba antes del lift-up).
  const baseImages = useMemo<ShopifyImage[]>(() => {
    if (product.images.length > 0) return product.images
    if (product.featuredImage) return [product.featuredImage]
    return []
  }, [product])

  const filteredImages = useMemo(
    () => filterImagesByColor({ ...product, images: baseImages }, activeColor),
    [product, baseImages, activeColor]
  )

  const value: Ctx = {
    product,
    selection,
    setOption,
    activeVariant,
    activeColor,
    filteredImages,
  }

  return <PDPVariantCtx.Provider value={value}>{children}</PDPVariantCtx.Provider>
}
