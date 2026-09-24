"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { enPromoPar, PROMO_PAR } from "@/lib/promocion"
import type { Product } from "@/lib/shopify/types"

/**
 * "El segundo, a mitad de precio", junto al precio.
 *
 * Va DEBAJO DEL PRECIO y encima del selector de talla, que es el orden en el
 * que se decide: cuánto cuesta → cuánto me ahorro si llevo dos → qué talla.
 * Más abajo nadie lo vería: el botón de compra ya está a la vista y la
 * decisión está tomada.
 *
 * Se pinta solo si el producto trae la etiqueta de la promoción en Shopify
 * (ver lib/promocion.ts): el dueño la enciende y la apaga desde el panel.
 *
 * Enlace a la marca porque ahí están exactamente los tres botines de la
 * promoción, y porque el descuento se arma combinando modelos: quien llega
 * aquí por el negro tiene que poder ver el café sin buscarlo.
 *
 * En cuero y con borde punteado, no en un bloque de color: es una nota que
 * suma, no una etiqueta de rebaja. El sitio no tiene bloques de color y
 * meterle uno aquí lo abarataría.
 */
export function PDPPromoPar({ product }: { product: Product }) {
  const t = useT()
  if (!enPromoPar(product)) return null

  return (
    <div className="mb-6 border border-dashed border-leather/50 px-4 py-3">
      <p className="cuerpo text-text">
        <span className="font-medium">{t("promoPar.insignia")}</span>{" "}
        <span className="text-text-muted">{t("promoPar.ficha")}</span>{" "}
        <Link
          href={PROMO_PAR.href}
          className="text-leather underline underline-offset-4"
        >
          {t("promoPar.carritoVerlos")}
        </Link>
      </p>
    </div>
  )
}
