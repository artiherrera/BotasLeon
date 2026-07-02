"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "./CartProvider"
import { FreeShippingBar } from "./FreeShippingBar"
import { MSIBreakdown } from "./MSIBreakdown"
import { PaymentBadges } from "./PaymentBadges"
import { formatMoney } from "@/lib/utils"
import { getPendingDiscount, withDiscount } from "@/lib/discount/client"
import { track } from "@/lib/klaviyo/client"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"
import { useFocusTrap } from "@/lib/useFocusTrap"

/**
 * CartDrawer — sidebar lateral derecho con líneas del cart.
 *
 * - Click en backdrop o ESC cierra.
 * - Bloquea scroll del body cuando está abierto.
 * - "Pagar" hace window.location = checkoutUrl → Shopify hosted
 *   checkout. Toda la lógica de pago/envío/tax la maneja Shopify.
 */
export function CartDrawer() {
  const { cart, isOpen, isPending, closeCart, updateLine, removeLine } = useCart()
  const [pendingDiscount, setPendingDiscountState] = useState<string | null>(null)

  // Lee el código pendiente del localStorage solo cuando se abre el drawer
  // (re-checa por si el cliente acaba de venir de /discount/[code])
  useEffect(() => {
    if (!isOpen) return
    setPendingDiscountState(getPendingDiscount())
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Diálogo accesible: foco atrapado dentro del drawer, restaurado al
  // disparador al cerrar, y Escape para cerrar.
  const drawerRef = useFocusTrap<HTMLElement>(isOpen, closeCart)

  const lines = cart?.lines ?? []
  const isEmpty = lines.length === 0
  const subtotalNum = cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0
  const subtotalCurrency = cart?.cost.subtotalAmount.currencyCode ?? "MXN"

  const handleCheckoutClick = () => {
    if (!cart) return
    track("Started Checkout", {
      $value: subtotalNum,
      currency: subtotalCurrency,
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
  }

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden={!isOpen}
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        inert={!isOpen}
        className={`fixed top-0 right-0 h-full w-full sm:w-[28rem] bg-bg/85 backdrop-blur-2xl backdrop-saturate-150 border-l border-border/40 z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-heading text-xl text-text">
            Tu carrito
            {cart && cart.totalQuantity > 0 && (
              <span className="text-text-muted font-normal ml-2">
                ({cart.totalQuantity})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Cerrar carrito"
            data-autofocus
            className="p-2 -mr-2 hover:bg-bg-alt rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-20 h-20 mb-6 text-text-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p className="font-heading text-lg text-text mb-2">
              Tu carrito está vacío
            </p>
            <p className="text-sm text-text-muted mb-6 max-w-xs">
              Cuando agregues botas las verás aquí.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="inline-flex px-6 py-3 bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {lines.map((line) => {
                const v = line.merchandise
                const subtitle = v.selectedOptions
                  .filter((o) => o.name.toLowerCase() !== "title")
                  .map((o) => `${o.name}: ${o.value}`)
                  .join(" · ")

                return (
                  <div key={line.id} className="py-4 flex gap-3">
                    <Link
                      href={`/products/${v.product.handle}`}
                      onClick={closeCart}
                      className="block w-20 h-20 flex-shrink-0 bg-bg-alt overflow-hidden"
                    >
                      {v.image ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={v.image.url}
                            alt={v.image.altText || v.product.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/products/${v.product.handle}`}
                          onClick={closeCart}
                          className="font-heading text-sm text-text leading-snug hover:text-leather line-clamp-2"
                        >
                          {v.product.title}
                        </Link>
                        <p className="font-medium text-sm text-text whitespace-nowrap">
                          {formatMoney(
                            line.cost.totalAmount.amount,
                            line.cost.totalAmount.currencyCode
                          )}
                        </p>
                      </div>
                      {subtitle && (
                        <p className="text-xs text-text-muted mt-1">{subtitle}</p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateLine(line.id, Math.max(1, line.quantity - 1))
                            }
                            disabled={isPending || line.quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-11 h-11 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, line.quantity + 1)}
                            disabled={isPending}
                            aria-label="Aumentar cantidad"
                            className="w-11 h-11 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={isPending}
                          className="text-xs text-text-subtle hover:text-terracotta uppercase tracking-wider transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer con totales + checkout */}
            <div
              className="border-t border-border px-6 pt-4 bg-bg-alt"
              style={{
                paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
              }}
            >
              {pendingDiscount && (
                <div className="mb-3 p-3 bg-leather text-bg text-xs rounded-sm">
                  <p className="font-medium">Descuento aplicado al pagar</p>
                  <p className="text-bg/80 mt-0.5">{pendingDiscount}</p>
                </div>
              )}

              <FreeShippingBar
                subtotal={subtotalNum}
                threshold={FREE_SHIPPING_THRESHOLD}
                currency={subtotalCurrency}
              />

              <div className="flex justify-between items-baseline mt-2 mb-1">
                <span className="text-sm text-text-muted">Subtotal</span>
                <span className="font-heading text-lg text-text">
                  {cart &&
                    formatMoney(
                      cart.cost.subtotalAmount.amount,
                      cart.cost.subtotalAmount.currencyCode
                    )}
                </span>
              </div>
              <MSIBreakdown amount={subtotalNum} currency={subtotalCurrency} />
              <p className="text-xs text-text-muted mt-1 mb-4">
                Envío e impuestos calculados al pagar
              </p>

              <div className="mb-4">
                <PaymentBadges />
              </div>

              {cart?.checkoutUrl ? (
                <a
                  href={withDiscount(cart.checkoutUrl, pendingDiscount)}
                  onClick={handleCheckoutClick}
                  className="block w-full text-center py-4 bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors"
                >
                  Pagar
                </a>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </>
  )
}
