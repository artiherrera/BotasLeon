"use client"

import { ProductGallery } from "./ProductGallery"
import { usePDPVariant } from "./PDPVariantContext"

/**
 * ProductGalleryConnected — wrapper que lee filteredImages del context y
 * delega a la galería presentacional.
 *
 * Por qué wrapper en vez de modificar ProductGallery: ProductGallery sigue
 * siendo reusable (acepta cualquier array de imágenes) y testable sin
 * provider. La conexión al context vive en este wrapper aislado.
 */

export function ProductGalleryConnected() {
  const { product, filteredImages } = usePDPVariant()
  return <ProductGallery images={filteredImages} title={product.title} />
}
