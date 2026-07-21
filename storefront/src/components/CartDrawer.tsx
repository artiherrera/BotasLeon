"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "./CartProvider"
import { FreeShippingBar } from "./FreeShippingBar"
import { MSIBreakdown } from "./MSIBreakdown"
import { PaymentBadges } from "./PaymentBadges"
import { CustomsTaxIdField } from "./CustomsTaxIdField"
import { formatMoney } from "@/lib/utils"
import { clearPendingDiscount, getPendingDiscount, withDiscount } from "@/lib/discount/client"
import { track } from "@/lib/klaviyo/client"
import { gaEvent } from "@/lib/ga/events"
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
  const {
    cart,
    isOpen,
    isPending,
    closeCart,
    updateLine,
    removeLine,
    applyDiscount,
    removeDiscount,
  } = useCart()
  const [codeInput, setCodeInput] = useState("")
  const [applyingCode, setApplyingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Código(s) de descuento válidos ya aplicados en el carrito.
  const appliedCodes = (cart?.discountCodes ?? []).filter((d) => d.applicable)

  // Auto-aplica un código pendiente (llegó por link mágico /discount?code=CODE)
  // al abrir el carrito, para que también se valide y muestre aquí. Un intento
  // por código (ref) para no repetir en loop.
  const autoTriedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isOpen || !cart) return
    const pend = getPendingDiscount()
    if (!pend) return
    const already = (cart.discountCodes ?? []).some(
      (d) => d.applicable && d.code.toLowerCase() === pend.toLowerCase()
    )
    if (already) {
      clearPendingDiscount()
      return
    }
    // Respeta un código que el cliente ya aplicó a mano: la promo no lo pisa.
    if ((cart.discountCodes ?? []).some((d) => d.applicable)) return
    if (autoTriedRef.current === pend) return
    autoTriedRef.current = pend
    applyDiscount(pend)
  }, [isOpen, cart, applyDiscount])

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = codeInput.trim()
    if (!c || applyingCode) return
    setApplyingCode(true)
    setCodeError(null)
    const r = await applyDiscount(c)
    setApplyingCode(false)
    if (r.ok) setCodeInput("")
    else setCodeError(r.message ?? "No se pudo aplicar el código.")
  }

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
  const totalNum = cart ? parseFloat(cart.cost.totalAmount.amount) : 0
  // Ahorro reflejado en el carrito: subtotal (antes del descuento) − total
  // (después). Pre-checkout no hay envío/impuesto, así que la diferencia es el
  // descuento de un código de orden.
  const discountTotal = Math.max(0, subtotalNum - totalNum)

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

    // GA4 begin_checkout — para el embudo en Google Analytics.
    gaEvent("begin_checkout", {
      currency: subtotalCurrency,
      value: subtotalNum,
      items: cart.lines.map((l) => ({
        item_id: l.merchandise.product.handle,
        item_name: l.merchandise.product.title,
        price: parseFloat(l.merchandise.price.amount),
        quantity: l.quantity,
      })),
    })
    // Nota: InitiateCheckout y Purchase los dispara el canal de Facebook de
    // Shopify (CAPI) en el checkout; no los duplicamos desde aquí.
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
              className="inline-flex px-6 py-3 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {lines.map((line) => {
                const v = line.merchandise
                const subtitle = [
                  ...v.selectedOptions
                    .filter((o) => o.name.toLowerCase() !== "title")
                    .map((o) => `${o.name}: ${o.value}`),
                  ...(line.attributes ?? [])
                    .filter((a) => a.value)
                    .map((a) => `${a.key}: ${a.value}`),
                ].join(" · ")

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
              {/* Código de descuento: chip si ya hay uno aplicado (validado por
                  Shopify), o input para escribirlo. El descuento viaja solo al
                  checkout hospedado porque queda en el carrito. */}
              {appliedCodes.length > 0 ? (
                <div className="mb-3 space-y-2">
                  {appliedCodes.map((d) => (
                    <div
                      key={d.code}
                      className="flex items-center justify-between gap-2 rounded-sm border border-leather/30 bg-leather/10 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-leather">
                        <CheckIcon />
                        {d.code}
                        {discountTotal > 0 && (
                          <span className="font-normal text-text-muted">
                            (−{formatMoney(String(discountTotal), subtotalCurrency)})
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        disabled={isPending}
                        className="text-xs uppercase tracking-wider text-text-subtle hover:text-terracotta disabled:opacity-40 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleApplyCode} className="mb-3">
                  <label htmlFor="promo-code" className="mb-1.5 block text-xs text-text-muted">
                    ¿Tienes un código de descuento?
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-code"
                      type="text"
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value)
                        if (codeError) setCodeError(null)
                      }}
                      placeholder="Ej. BIENVENIDO10"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-sm border border-border bg-bg px-3 py-2 text-sm uppercase focus:border-leather focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={applyingCode || !codeInput.trim()}
                      className="whitespace-nowrap rounded-sm border border-leather px-4 py-2 text-sm uppercase tracking-wider text-leather hover:bg-leather hover:text-bg disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      {applyingCode ? "..." : "Aplicar"}
                    </button>
                  </div>
                  {codeError && (
                    <p className="mt-1.5 text-xs text-terracotta" aria-live="polite">
                      {codeError}
                    </p>
                  )}
                </form>
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
              {discountTotal > 0 && (
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-leather">Descuento</span>
                  <span className="text-sm font-medium text-leather">
                    −{formatMoney(String(discountTotal), subtotalCurrency)}
                  </span>
                </div>
              )}
              <MSIBreakdown amount={subtotalNum} currency={subtotalCurrency} />
              <p className="text-xs text-text-muted mt-1 mb-4">
                Envío e impuestos calculados al pagar
              </p>

              <CustomsTaxIdField />

              <div className="mb-4">
                <PaymentBadges />
              </div>

              {cart?.checkoutUrl ? (
                <a
                  href={withDiscount(cart.checkoutUrl)}
                  onClick={handleCheckoutClick}
                  className="block w-full text-center py-4 rounded-full bg-leather text-bg text-sm uppercase tracking-wider hover:bg-text transition-colors"
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

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
