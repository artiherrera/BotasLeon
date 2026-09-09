"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useCart } from "./CartProvider"
import { PaymentBadges } from "./PaymentBadges"
import { CustomsTaxIdField, useCustomsGate } from "./CustomsTaxIdField"
import { formatMoney } from "@/lib/utils"
import { FreeShippingProgress } from "@/components/FreeShippingProgress"
import { clearPendingDiscount, getPendingDiscount, withDiscount } from "@/lib/discount/client"
import { track } from "@/lib/klaviyo/client"
import { gaEvent } from "@/lib/ga/events"
import { useFocusTrap } from "@/lib/useFocusTrap"
import { useT } from "@/lib/i18n/context"
import { checkoutHref } from "@/lib/checkout"
import { isMX } from "@/lib/market"
import { CartLineSize } from "@/components/CartLineSize"
import { SIZE_ATTR, isDefaultOption, missingSizeLines } from "@/lib/cart/line-size"

/**
 * CartDrawer — sidebar lateral derecho con líneas del cart.
 *
 * - Click en backdrop o ESC cierra.
 * - Bloquea scroll del body cuando está abierto.
 * - "Pagar" hace window.location = checkoutUrl → Shopify hosted
 *   checkout. Toda la lógica de pago/envío/tax la maneja Shopify.
 */
// Nombres de opción/atributo que llegan en español desde Shopify → llave i18n
// (para mostrar "Size" en vez de "Talla" en inglés). El valor no se traduce.
const OPT_LABEL_KEY: Record<string, string> = {
  talla: "filters.size",
  color: "filters.color",
  material: "filters.material",
}

export function CartDrawer() {
  const {
    cart,
    isOpen,
    isPending,
    lastAdded,
    closeCart,
    updateLine,
    removeLine,
    applyDiscount,
    removeDiscount,
  } = useCart()
  const t = useT()
  const sizeBlocked = missingSizeLines(cart).length > 0 // sin talla no se puede surtir
  // Traduce el NOMBRE de la opción/atributo (Talla/Color/Material vienen en
  // español desde Shopify) sin tocar el valor. Si no lo conocemos, lo deja igual.
  const optLabel = (name: string): string => {
    const key = OPT_LABEL_KEY[name.trim().toLowerCase()]
    return key ? t(key) : name
  }
  const [codeInput, setCodeInput] = useState("")
  const [applyingCode, setApplyingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  // Escondido por defecto: mostrarlo sube el abandono — quien no trae código
  // se va a buscar uno y no vuelve (Baymard). Quien sí lo trae, lo despliega.
  const [mostrarCupon, setMostrarCupon] = useState(false)

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
    else setCodeError(r.message ?? t("cart.codeError"))
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
  const subtotalCurrency = cart?.cost.subtotalAmount.currencyCode ?? "USD"
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
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-[180ms] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.ariaLabel")}
        inert={!isOpen}
        className={`fixed top-0 right-0 h-full w-full sm:w-[28rem] bg-bg border-l border-border z-50 transition-transform duration-[180ms] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-body text-base font-medium text-text">
            {t("cart.title")}
            {cart && cart.totalQuantity > 0 && (
              <span className="text-text-muted font-normal ml-2">
                ({cart.totalQuantity})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            aria-label={t("cart.close")}
            data-autofocus
            className="p-3 -mr-3 hover:bg-bg-alt rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Se acaba de agregar algo: dilo. Antes el cajón abría titulado
            "Tu carrito" y el comprador tenía que deducir que había funcionado. */}
        {lastAdded && !isEmpty && (
          <div role="status" className="flex items-start gap-3 px-6 py-3 bg-bg-alt border-b border-border cuerpo">
            <span className="mt-0.5 text-text"><CheckIcon /></span>
            <p className="text-text leading-snug">
              <span className="text-text-muted">{t("cart.addedBanner")}</span>{" "}
              <span className="font-medium">{lastAdded}</span>
            </p>
          </div>
        )}

        {/* Empty state */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-20 h-20 mb-6 text-text-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p className="cuerpo-l text-text mb-2">
              {t("cart.empty")}
            </p>
            <p className="cuerpo text-text-muted mb-6 max-w-xs">
              {t("cart.emptyDesc")}
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="btn"
            >
              {t("cart.viewCatalog")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {lines.map((line) => {
                const v = line.merchandise
                const subtitle = [
                  ...v.selectedOptions
                    .filter((o) => !isDefaultOption(o.name, o.value))
                    .map((o) => `${optLabel(o.name)}: ${o.value}`),
                  ...(line.attributes ?? [])
                    .filter((a) => a.value && a.key !== SIZE_ATTR)
                    .map((a) => `${optLabel(a.key)}: ${a.value}`),
                ].join(" · ")

                return (
                  <div key={line.id} className="py-4 flex gap-3">
                    <Link
                      href={`/products/${v.product.handle}`}
                      onClick={closeCart}
                      className="plato block w-[100px] shrink-0 self-start"
                    >
                      {v.image ? (
                        <Image
                          src={v.image.url}
                          alt={v.image.altText || v.product.title}
                          fill
                          sizes="100px"
                        />
                      ) : null}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/products/${v.product.handle}`}
                          onClick={closeCart}
                          className="nombre-producto text-sm text-text leading-snug hover:underline underline-offset-4 line-clamp-2"
                        >
                          {v.product.title}
                        </Link>
                        <p className="precio text-sm text-text whitespace-nowrap">
                          {formatMoney(
                            line.cost.totalAmount.amount,
                            line.cost.totalAmount.currencyCode
                          )}
                        </p>
                      </div>
                      {subtitle && (
                        <p className="nota mt-1">{subtitle}</p>
                      )}

                      <div className="mt-2">
                        <CartLineSize line={line} compact />
                      </div>

                      <div className="flex items-center justify-between mt-3">
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
                          <span className="w-8 text-center text-sm">
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

            {/* Footer con totales + checkout */}
            <div
              className="shrink-0 border-t border-border px-6 pt-4 bg-bg-alt"
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
                      className="flex items-center justify-between gap-2 border border-border bg-bg px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-text">
                        <CheckIcon />
                        {d.code}
                        {discountTotal > 0 && (
                          <span className="nota">
                            (−{formatMoney(String(discountTotal), subtotalCurrency)})
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        disabled={isPending}
                        className="nota underline underline-offset-4 hover:text-text disabled:opacity-40 transition-colors"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : !mostrarCupon ? (
                <button
                  type="button"
                  onClick={() => setMostrarCupon(true)}
                  className="mb-3 nota underline underline-offset-4 hover:text-text transition-colors"
                >
                  {t("cart.promoToggle")}
                </button>
              ) : (
                <form onSubmit={handleApplyCode} className="mb-3">
                  <label htmlFor="promo-code" className="mb-1.5 block nota">
                    {t("cart.promoLabel")}
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
                      placeholder={t("cart.promoPlaceholder")}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="campo min-w-0 flex-1 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={applyingCode || !codeInput.trim()}
                      className="btn btn-sec whitespace-nowrap"
                    >
                      {applyingCode ? "..." : t("cart.apply")}
                    </button>
                  </div>
                  {codeError && (
                    <p className="mt-1.5 nota font-semibold text-text" aria-live="polite">
                      {codeError}
                    </p>
                  )}
                </form>
              )}

              <div className="flex justify-between items-baseline mt-2 mb-1">
                <span className="cuerpo text-text-muted">{t("cart.subtotal")}</span>
                <span className="precio text-text">
                  {cart &&
                    formatMoney(
                      cart.cost.subtotalAmount.amount,
                      cart.cost.subtotalAmount.currencyCode
                    )}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between items-baseline mb-1">
                  <span className="cuerpo text-text-muted">{t("cart.discount")}</span>
                  <span className="precio text-sm text-text">
                    −{formatMoney(String(discountTotal), subtotalCurrency)}
                  </span>
                </div>
              )}
              <p className="nota mt-1">
                {t(isMX ? "cart.shippingTax" : "cart.shippingTaxUs")}
              </p>
              {/* Entrega estimada: no saber cuándo llega es motivo de abandono
                  (Baymard). Cifras de /envios de cada mercado. */}
              <p className="nota mt-1 mb-4">
                {t("cart.deliveryLabel")}: {t(isMX ? "cart.deliveryMx" : "cart.deliveryUs")}
              </p>

              {/* Solo renderiza en el despliegue de México; en el de EE.UU. no
                  hay envío gratis y el componente devuelve null. */}
              <FreeShippingProgress amount={totalNum} currency={subtotalCurrency} />

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
                    {/* La talla manda: sin ella el pedido no se puede surtir. */}
                    <p className="nota font-semibold text-text text-center mt-2">{t("cart.sizeBlocked")}</p>
                  </>
                ) : (
                  <a
                    href={withDiscount(checkoutHref(cart.checkoutUrl))}
                    onClick={handleCheckoutClick}
                    className="btn w-full"
                  >
                    {t("cart.checkout")}
                  </a>
                )
              ) : null}
              {/* La otra salida. Sin esto, la única forma de "no pagar aún" era
                  la X, y cerrar con la X se siente como cancelar. */}
              <button
                type="button"
                onClick={closeCart}
                className="btn btn-ter mt-2 block w-full text-center py-3 text-sm text-text-muted hover:text-text transition-colors"
              >
                {t("cart.keepShopping")}
              </button>
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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
