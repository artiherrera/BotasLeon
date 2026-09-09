"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useCart } from "@/components/CartProvider"
import { PaymentBadges } from "@/components/PaymentBadges"
import { CustomsTaxIdField } from "@/components/CustomsTaxIdField"
import { useLocale, useT } from "@/lib/i18n/context"
import { isMX } from "@/lib/market"
import { FreeShippingProgress } from "@/components/FreeShippingProgress"
import { checkoutHref } from "@/lib/checkout"
import { CartLineSize } from "@/components/CartLineSize"
import { SIZE_ATTR, isDefaultOption, missingSizeLines } from "@/lib/cart/line-size"
import { formatMoney } from "@/lib/utils"
import {
  getPendingDiscount,
  setPendingDiscount as savePendingDiscount,
  withDiscount,
} from "@/lib/discount/client"
import { track } from "@/lib/klaviyo/client"
import { gaEvent } from "@/lib/ga/events"

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
  const { locale } = useLocale()
  const t = useT()
  const sizeBlocked = missingSizeLines(cart).length > 0 // sin talla no se puede surtir
  // El único candado que queda es la talla: sin ella el pedido no se puede
  // surtir. La aceptación de aranceles se retiró (estos productos no los causan).
  const [pendingDiscount, setPendingDiscount] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState("")
  const lines = cart?.lines ?? []
  const isEmpty = lines.length === 0
  const subtotalNum = cart ? parseFloat(cart.cost.subtotalAmount.amount) : 0
  const subtotalCurrency = cart?.cost.subtotalAmount.currencyCode ?? "USD"

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p className="eyebrow text-text-muted mb-3">{t("cart.title")}</p>
            <h1 className="display-l text-text mb-3">
              {t("cart.empty")}
            </h1>
            <p className="cuerpo-l text-text-muted mb-10 max-w-md mx-auto">
              {t("cart.emptyDesc")}
            </p>
            <Link
              href="/products"
              className="btn"
            >
              {t("cart.viewCatalog")}
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
          <p className="eyebrow text-text-muted mb-2">{t("cart.title")}</p>
          <h1 className="display-l text-text mb-10">
            {t("cart.title")}
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
                    .filter((o) => !isDefaultOption(o.name, o.value))
                    .map((o) => `${o.name}: ${o.value}`),
                  ...(line.attributes ?? [])
                    .filter((a) => a.value && a.key !== SIZE_ATTR)
                    .map((a) => `${a.key}: ${a.value}`),
                ].join(" · ")

                return (
                  <div key={line.id} className="py-6 flex gap-4">
                    <Link
                      href={`/products/${v.product.handle}`}
                      className="plato block w-28 sm:w-32 shrink-0"
                    >
                      {v.image ? (
                        <Image
                          src={v.image.url}
                          alt={v.image.altText || v.product.title}
                          fill
                          sizes="128px"
                        />
                      ) : null}
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/products/${v.product.handle}`}
                          className="nombre-producto text-text leading-snug hover:underline underline-offset-4"
                        >
                          {v.product.title}
                        </Link>
                        <p className="precio text-text whitespace-nowrap">
                          {formatMoney(
                            line.cost.totalAmount.amount,
                            line.cost.totalAmount.currencyCode
                          )}
                        </p>
                      </div>
                      {subtitle && (
                        <p className="cuerpo text-text-muted mt-1">{subtitle}</p>
                      )}

                      <div className="mt-2">
                        <CartLineSize line={line} />
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="inline-flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateLine(line.id, Math.max(1, line.quantity - 1))
                            }
                            disabled={isPending || line.quantity <= 1}
                            aria-label={t("cart.decrease")}
                            className="w-11 h-11 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="w-9 text-center cuerpo">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, line.quantity + 1)}
                            disabled={isPending}
                            aria-label={t("cart.increase")}
                            className="w-11 h-11 flex items-center justify-center hover:bg-bg-alt disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={isPending}
                          className="nota inline-flex h-11 items-center underline underline-offset-4 hover:text-text transition-colors"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sidebar — resumen + checkout */}
            <aside className="bg-bg-alt p-6 h-fit lg:sticky lg:top-[124px]">
              <h2 className="eyebrow text-text-muted mb-4">{t("cart.summary")}</h2>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between cuerpo text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-text">
                    {cart &&
                      formatMoney(
                        cart.cost.subtotalAmount.amount,
                        cart.cost.subtotalAmount.currencyCode
                      )}
                  </span>
                </div>
                <div className="flex justify-between cuerpo text-text-muted">
                  <span>{locale === "en" ? "Shipping" : "Envío"}</span>
                  <span className="text-text">
                    {isMX
                      ? (locale === "en" ? "Free" : "Gratis")
                      : (locale === "en" ? "Across the USA" : "A todo Estados Unidos")}
                  </span>
                </div>
                <div className="flex justify-between cuerpo text-text-muted">
                  <span>{t("cart.deliveryLabel")}</span>
                  <span className="text-text">{t(isMX ? "cart.deliveryMx" : "cart.deliveryUs")}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t border-border mb-6">
                <span className="text-sm font-medium text-text">{isMX ? t("cart.total") : t("cart.subtotal")}</span>
                <span className="precio precio-ficha text-text">
                  {cart &&
                    formatMoney(
                      cart.cost.subtotalAmount.amount,
                      cart.cost.subtotalAmount.currencyCode
                    )}
                </span>
              </div>

              {/* Cupón manual — desplegable para no añadir ruido visual a quien
                  no trae código */}
              <details className="mb-4 cuerpo border-t border-border pt-4">
                <summary className="cursor-pointer py-3 text-text-muted hover:text-text transition-colors select-none">
                  {t("cart.promoToggle")}
                </summary>
                <form onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t("cart.promoPlaceholder")}
                    aria-label="Código de descuento"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="campo flex-1 min-w-0 uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={!couponInput.trim()}
                    className="btn btn-sec shrink-0"
                  >
                    {t("cart.apply")}
                  </button>
                </form>
              </details>

              {pendingDiscount && (
                <div className="mb-3 border border-border bg-bg p-3">
                  <p className="text-sm font-medium text-text">Descuento aplicado al pagar</p>
                  <p className="nota mt-0.5">{pendingDiscount}</p>
                </div>
              )}

              <FreeShippingProgress amount={subtotalNum} currency={subtotalCurrency} />

              <CustomsTaxIdField />

              <div className="mb-4">
                <PaymentBadges />
              </div>

              {cart?.checkoutUrl ? (
                sizeBlocked ? (
                  <>
                    <button
                      type="button"
                      disabled
                      aria-disabled
                      // En contorno, no en tinta: con solo la opacidad al 50%
                      // el botón bloqueado seguía leyéndose como el que sí
                      // paga, y el comprador lo picaba sin entender por qué no
                      // pasaba nada.
                      className="btn btn-sec w-full"
                    >
                      {t("cart.checkout")}
                    </button>
                    <p className="nota font-semibold text-text text-center mt-2">{t("cart.sizeBlocked")}</p>
                  </>
                ) : (
                  <a
                    href={withDiscount(checkoutHref(cart.checkoutUrl), pendingDiscount)}
                    onClick={handleCheckoutClick}
                    className="btn w-full"
                  >
                    {t("cart.checkout")}
                  </a>
                )
              ) : null}
              <Link
                href="/products"
                className="btn btn-ter mt-2 block w-full text-center py-3 text-sm text-text-muted hover:text-text transition-colors"
              >
                {t("cart.keepShopping")}
              </Link>

              <p className="nota text-center mt-3">
                {t("trust.securePayment")} · {t(isMX ? "cart.shippingTax" : "cart.shippingTaxUs")} · {t("trust.exchange30")}
              </p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
