"use client"

import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useCart } from "@/components/CartProvider"
import { formatMoney } from "@/lib/utils"

/**
 * /cart — vista full-page del carrito.
 *
 * Duplica funcionalmente al CartDrawer pero a página completa, para
 * usuarios que prefieren ver/editar antes de pagar. El drawer es el
 * UX primario (se abre al agregar producto); /cart existe para que
 * el link del header siempre funcione y como destino directo.
 */

export default function CartPage() {
  const { cart, ready, isPending, updateLine, removeLine } = useCart()
  const lines = cart?.lines ?? []
  const isEmpty = lines.length === 0

  // Mientras hidrata desde localStorage, mostramos un skeleton mínimo
  if (!ready) {
    return (
      <>
        <Header />
        <main className="flex-1">
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
        <main className="flex-1">
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
              className="inline-flex px-8 py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
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
      <main className="flex-1">
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
                const subtitle = v.selectedOptions
                  .filter((o) => o.name.toLowerCase() !== "title")
                  .map((o) => `${o.name}: ${o.value}`)
                  .join(" · ")

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

              <div className="space-y-2 mb-6">
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

              {cart?.checkoutUrl ? (
                <a
                  href={cart.checkoutUrl}
                  className="block w-full text-center py-4 bg-leather text-bg text-sm uppercase tracking-widest hover:bg-text transition-colors"
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
