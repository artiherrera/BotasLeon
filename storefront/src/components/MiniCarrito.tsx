"use client"

import { usePathname } from "next/navigation"
import { useCart } from "@/components/CartProvider"
import { useT } from "@/lib/i18n/context"
import { formatMoney } from "@/lib/utils"
import { checkoutHref } from "@/lib/checkout"
import { withDiscount } from "@/lib/discount/client"
import { missingSizeLines } from "@/lib/cart/line-size"
import { track } from "@/lib/klaviyo/client"
import { gaEvent } from "@/lib/ga/events"
import { useAltoTeaserKlaviyo } from "@/lib/klaviyo/teaser"

/**
 * MiniCarrito — el carrito siempre a un toque, en cualquier página.
 *
 * Aparece en cuanto hay algo agregado y el cajón está cerrado. Antes, fuera
 * de la ficha, la única puerta al carrito era el ícono del navbar; quien
 * seguía viendo botas tenía que acordarse de él.
 *
 * Móvil: barra pegada abajo. Escritorio: pastilla flotante abajo a la derecha.
 *
 * Se esconde donde estorba o sobra:
 *  - en /cart (la página ES el carrito) y en las herramientas internas;
 *  - en la ficha, solo en móvil: ahí ya vive la barra de "Comprar ahora", y
 *    dos barras encimadas en un iPhone es peor que ninguna. En escritorio la
 *    ficha no tiene barra, así que la pastilla sí se muestra.
 *
 * "Pagar" respeta la misma regla que el cajón (ver CartDrawer): si hay un par
 * sin talla no manda al checkout, abre el cajón para que la elija.
 */
export function MiniCarrito() {
  const { cart, ready, itemCount, isOpen, openCart } = useCart()
  const t = useT()
  const pathname = usePathname() ?? ""
  // El teaser de Klaviyo se pega abajo con z-index 90000 y tapaba esta barra
  // entera, botón de Pagar incluido. Se mide y la barra se sube por encima.
  const altoTeaser = useAltoTeaserKlaviyo()
  // Misma limpieza de prefijo de idioma que hace el contexto i18n.
  const ruta = pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/"

  if (!ready || !cart || itemCount === 0 || isOpen) return null
  if (ruta === "/cart" || ruta.startsWith("/notas") || ruta.startsWith("/cotizador")) return null

  const enFicha = ruta.startsWith("/products/")
  const sinTalla = missingSizeLines(cart).length > 0
  const total = formatMoney(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)
  const cuenta = `${itemCount} ${itemCount === 1 ? t("minicart.item") : t("minicart.items")}`
  const pagarHref = withDiscount(checkoutHref(cart.checkoutUrl))

  // Mismos eventos que "Pagar" desde el cajón (CartDrawer.handleCheckoutClick),
  // para que Klaviyo y GA vean este checkout como cualquier otro.
  const rastrearPago = () => {
    const subtotal = parseFloat(cart.cost.subtotalAmount.amount)
    const moneda = cart.cost.subtotalAmount.currencyCode
    track("Started Checkout", {
      $value: subtotal,
      currency: moneda,
      ItemCount: cart.totalQuantity,
      items: cart.lines.map((l) => ({
        ProductName: l.merchandise.product.title,
        ItemId: l.merchandise.id,
        Quantity: l.quantity,
        Price: parseFloat(l.cost.totalAmount.amount),
        ProductCategories: [],
        ProductURL: `/products/${l.merchandise.product.handle}`,
      })),
      CheckoutURL: cart.checkoutUrl,
    })
    gaEvent("begin_checkout", {
      currency: moneda,
      value: subtotal,
      items: cart.lines.map((l) => ({
        item_id: l.merchandise.product.handle,
        item_name: l.merchandise.product.title,
        price: parseFloat(l.merchandise.price.amount),
        quantity: l.quantity,
      })),
    })
  }

  const botonPagar = "btn shrink-0"

  return (
    <div
      role="region"
      aria-label={t("minicart.label")}
      data-minicarrito
      className={`${enFicha ? "hidden md:flex" : "flex"} fixed z-40 items-center gap-3 bg-bg/95 backdrop-blur-xl border-border shadow-[0_-8px_24px_rgba(0,0,0,0.08)]
        inset-x-0 bottom-[var(--kl-teaser,0px)] border-t px-4 py-3
        md:inset-x-auto md:right-6 md:bottom-[calc(1.5rem+var(--kl-teaser,0px))] md:border md:px-5 md:py-3`}
      style={
        {
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          "--kl-teaser": altoTeaser ? `${altoTeaser}px` : undefined,
        } as React.CSSProperties
      }
    >
      <span className="w-5 h-5 shrink-0 text-text" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </span>
      <div className="flex-1 min-w-0 md:flex-none">
        <p className="text-sm font-medium text-text leading-tight truncate">
          {cuenta} · {total}
        </p>
      </div>
      <button
        type="button"
        onClick={openCart}
        className="btn btn-ter min-h-11 text-sm whitespace-nowrap"
      >
        {t("minicart.view")}
      </button>
      {sinTalla ? (
        // Sin talla no se puede surtir: el cajón es donde se elige.
        <button type="button" onClick={openCart} className={botonPagar}>
          {t("cart.checkout")}
        </button>
      ) : (
        <a href={pagarHref} onClick={rastrearPago} className={botonPagar}>
          {t("cart.checkout")}
        </a>
      )}
    </div>
  )
}
