"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { enPromoPar, PROMO_PAR } from "@/lib/promocion"
import type { Cart } from "@/lib/shopify/types"

/**
 * La promoción del par, en el carrito: el empujón cuando falta uno.
 *
 * El ahorro ya aplicado se pinta en ResumenPago, junto al total y en el acento
 * de la casa. Aquí se queda el empujón porque es de otra naturaleza: no
 * informa de lo que pasó, propone lo siguiente.
 *
 * EL AHORRO NO SE PUEDE CALCULAR RESTANDO. Con un descuento automático,
 * Shopify entrega el subtotal YA rebajado, así que `subtotal − total` da cero
 * y el carrito no decía nada: el cliente veía dos botines idénticos, uno a
 * $3,699 y otro a $1,850, sin una palabra que lo explicara (medido en vivo el
 * 2026-09-24). El ahorro real solo está en los `discountAllocations` de cada
 * línea, y de ahí sale.
 *
 * EL EMPUJÓN es probablemente lo que más vende de todo el carrito: quien lleva
 * UN botín de la promoción no sabe que el segundo va a mitad. Se le dice justo
 * antes de pagar, con el enlace a los tres modelos, porque el descuento se
 * arma combinando —dos botines distintos también cuentan (comprobado contra la
 * Storefront API).
 *
 * Con dos o más ya aplicado no se insiste: con tres piezas Shopify descuenta
 * una sola, así que empujar por una cuarta sería prometer lo que no hay.
 */

/** Lo que Shopify descontó en este carrito, y con qué nombre. */
export function ahorroPromoPar(cart: Cart | null): { monto: number; moneda: string; titulo: string } | null {
  if (!cart) return null
  const todos = [
    ...(cart.discountAllocations ?? []),
    ...cart.lines.flatMap((l) => l.discountAllocations ?? []),
  ]
  const monto = todos.reduce((a, d) => a + parseFloat(d.discountedAmount.amount || "0"), 0)
  if (monto <= 0) return null
  const conNombre = todos.find((d) => d.title && parseFloat(d.discountedAmount.amount) > 0)
  return {
    monto,
    moneda: todos[0]?.discountedAmount.currencyCode ?? cart.cost.totalAmount.currencyCode,
    titulo: conNombre?.title ?? "",
  }
}

/** Cuántas piezas del carrito entran en la promoción. */
export function piezasEnPromo(cart: Cart | null): number {
  if (!cart) return 0
  return cart.lines
    .filter((l) => enPromoPar(l.merchandise.product))
    .reduce((a, l) => a + l.quantity, 0)
}

export function PromoParCarrito({ cart }: { cart: Cart | null }) {
  const t = useT()
  const ahorro = ahorroPromoPar(cart)
  const piezas = piezasEnPromo(cart)

  // El AHORRO ya no se pinta aquí: se mudó al resumen de pago, en grande y
  // con el precio de lista tachado al lado (ver ResumenPago.tsx). Aquí se
  // queda el empujón, que es lo único que puede cambiar lo que se lleva.
  if (ahorro && piezas >= 2) return null
  if (!PROMO_PAR.activa || piezas !== 1) return null

  return (
    <div className="border border-dashed border-leather/50 px-3 py-2">
      <p className="nota text-text">
        <span className="font-medium">{t("promoPar.insignia")}</span>{" "}
        {t("promoPar.carritoEmpuje")}{" "}
        <Link href={PROMO_PAR.href} className="text-leather underline underline-offset-4">
          {t("promoPar.carritoVerlos")}
        </Link>
      </p>
    </div>
  )
}
