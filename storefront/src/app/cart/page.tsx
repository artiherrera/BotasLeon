"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useCart } from "@/components/CartProvider"
import { FreeShippingBar } from "@/components/FreeShippingBar"
import { MSIBreakdown } from "@/components/MSIBreakdown"
import { PaymentBadges } from "@/components/PaymentBadges"
import { formatMoney } from "@/lib/utils"
import {
  getPendingDiscount,
  setPendingDiscount as savePendingDiscount,
  withDiscount,
} from "@/lib/discount/client"
import { track } from "@/lib/klaviyo/client"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"

/**
 * /cart — vista full-page del carrito.
 *
 * Duplica funcionalmente al CartDrawer pero a página completa, para
 * usuarios que prefieren ver/editar antes de pagar. El drawer es el
 * UX primario (se abre al agregar producto); /cart existe para que
 * el link del header siempre funcione y como destino directo.
 */

export default function CartPage() {
  const { cart, ready, isPending, updateLine, removeLine, showToast } = useCart()
  const [pendingDiscount, setPendingDiscount] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState("")
  const lines = cart?.lines ?? []
  const isEmpty = lines.length === 0
  const subtotalNum = cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0
  const subtotalCurrency = cart?.cost.subtotalAmount.currencyCode ?? "MXN"

  useEffect(() => {
    setPendingDiscount(getPendingDiscount())
  }, [ready])

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    savePendingDiscount(code)
    setPendingDiscount(code)
    setCouponInput("")
    showToast(`Código "${code}" guardado. Se aplica al pagar.`, "success")
  }

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

  // Mientras hidrata desde localStorage, mostramos un skeleton mínimo
  if (!ready) {
    return (
      <>
        <Header />
        <main id="contenido" tabIndex={-1} className="flex-1">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center text-text-muted">
            Cargando…
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (isEmpty) {
    return (
      <>
        <Header />
        <main id="contenido" tabIndex={-1} className="flex-1">
          <div className="mx-auto max-w-2xl px-6 py-20 md:py-28 text-center">
            <div className="w-20 h-20 mx-auto mb-6 text-text-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p className="eyebrow text-leather mb-3">Tu carrito</p>
            <h1 className="font-display text-3xl md:text-4xl text-text mb-3">
              Tu carrito está vacío
            </h1>
            <p className="text-text-muted mb-10 max-w-md mx-auto">
              Cuando agregues botas las verás aquí.
            </p>
            <Link
              href="/products"
              className="inline-flex px-8 py-4 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <p className="eyebrow text-leather mb-2">Carrito</p>
          <h1 className="font-display text-3xl md:text-4xl text-text mb-10">
            Tu carrito
            {cart && cart.totalQuantity > 0 && (
              <span className="text-text-muted font-normal text-2xl ml-2">
                ({cart.totalQuantity})
              </span>
            )}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10">
            {/* Lines */}
            <div className="divide-y divide-border border-y border-border">
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
                  <div key={line.id} className="py-6 flex gap-4">
                    <Link
                      href={`/products/${v.product.handle}`}
                      className="block w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-bg-alt overflow-hidden"
                    >
                      {v.image ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={v.image.url}
                            alt={v.image.altText || v.product.title}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/products/${v.product.handle}`}
                          className="font-heading text-base text-text leading-snug hover:text-leather"
                        >
                          {v.product.title}
                        </Link>
                        <p className="font-medium text-text whitespace-nowrap">
                          {formatMoney(
                            line.cost.totalAmount.amount,
                            line.cost.totalAmount.currencyCode
                          )}
                        </p>
                      </div>
                      {subtitle && (
                        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="inline-flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateLine(line.id, Math.max(1, line.quantity - 1))
                            }
                            disabled={isPending || line.quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-9 h-9 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="w-9 text-center text-sm">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, line.quantity + 1)}
                            disabled={isPending}
                            aria-label="Aumentar cantidad"
                            className="w-9 h-9 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 transition-colors"
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

            {/* Sidebar — resumen + checkout */}
            <aside className="bg-bg-alt p-6 h-fit lg:sticky lg:top-24">
              <h2 className="eyebrow text-leather mb-4">Resumen</h2>

              <FreeShippingBar
                subtotal={subtotalNum}
                threshold={FREE_SHIPPING_THRESHOLD}
                currency={subtotalCurrency}
              />

              <div className="space-y-2 mt-3 mb-6">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-text">
                    {cart &&
                      formatMoney(
                        cart.cost.subtotalAmount.amount,
                        cart.cost.subtotalAmount.currencyCode
                      )}
                  </span>
                </div>
                <MSIBreakdown amount={subtotalNum} currency={subtotalCurrency} />
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Envío</span>
                  <span className="text-text">Calculado al pagar</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t border-border mb-6">
                <span className="font-heading text-text">Total</span>
                <span className="font-display text-2xl text-text">
                  {cart &&
                    formatMoney(
                      cart.cost.subtotalAmount.amount,
                      cart.cost.subtotalAmount.currencyCode
                    )}
                </span>
              </div>

              {/* Cupón manual — desplegable para no añadir ruido visual a quien
                  no trae código */}
              <details className="mb-4 text-sm border-t border-border pt-4">
                <summary className="cursor-pointer text-text-muted hover:text-text transition-colors select-none">
                  ¿Tienes un código de descuento?
                </summary>
                <form onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="CÓDIGO"
                    aria-label="Código de descuento"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 min-w-0 px-3 py-2 bg-bg border border-border text-sm text-text uppercase tracking-wider focus:outline-none focus:border-leather"
                  />
                  <button
                    type="submit"
                    disabled={!couponInput.trim()}
                    className="px-4 py-2 rounded-full bg-leather text-bg text-xs uppercase tracking-wider hover:bg-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Aplicar
                  </button>
                </form>
              </details>

              {pendingDiscount && (
                <div className="mb-3 p-3 bg-leather text-bg text-xs rounded-sm">
                  <p className="font-medium">Descuento aplicado al pagar</p>
                  <p className="text-bg/80 mt-0.5">{pendingDiscount}</p>
                </div>
              )}

              <div className="mb-4">
                <PaymentBadges />
              </div>

              {cart?.checkoutUrl ? (
                <a
                  href={withDiscount(cart.checkoutUrl, pendingDiscount)}
                  onClick={handleCheckoutClick}
                  className="block w-full text-center py-4 rounded-full bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
                >
                  Proceder al pago
                </a>
              ) : null}

              <p className="text-xs text-text-muted text-center mt-3">
                Pago seguro · Cambio de talla 30 días
              </p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
