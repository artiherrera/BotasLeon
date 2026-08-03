"use client"

import { useEffect, useRef, useState } from "react"
import { useCart } from "./CartProvider"
import { useLocale } from "@/lib/i18n/context"

/**
 * Tax ID de aduana para envíos a EE.UU.
 *
 * El carrito headless NO conoce el destino (la dirección se pone en el checkout
 * de Shopify), así que el cliente declara "envío a EE.UU." (marcado por defecto
 * en inglés). El Tax ID se guarda como ATRIBUTO del carrito → llega al pedido.
 *
 * Aduana de EE.UU. solo lo exige en entradas FORMALES (> $800 USD, de minimis).
 * Por eso el candado (`useCustomsGate`) OBLIGA el Tax ID —bloqueando "Pagar"—
 * solo cuando el envío es a EE.UU. y el carrito ≥ $800. Debajo de eso es
 * opcional (no frena la venta). Los casos que se declaran MX pero envían a EE.UU.
 * los atrapa la automatización post-pedido (Flow/Klaviyo).
 */
const TAX_ID_KEY = "Tax ID (aduana EE.UU.)"
const DEST_US_KEY = "Envío a EE.UU."
const USD_THRESHOLD = 800
const MXN_PER_USD = 18 // aprox — solo para ubicar el umbral de $800 si el carrito está en MXN

type CartLike = {
  cost?: { totalAmount?: { amount: string; currencyCode: string } }
  attributes?: { key: string; value: string | null }[]
} | null | undefined

function usdEquivalent(cart: CartLike): number {
  const m = cart?.cost?.totalAmount
  if (!m) return 0
  const amt = parseFloat(m.amount) || 0
  return m.currencyCode === "USD" ? amt : amt / MXN_PER_USD
}

/**
 * Estado del candado de aduana — lo comparten el campo y el botón "Pagar".
 * `blocked` = hay que obligar el Tax ID y aún no está.
 */
export function useCustomsGate() {
  const { cart } = useCart()
  const { locale } = useLocale()
  const attrs = cart?.attributes ?? []
  const taxId = (attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? "").trim()
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  const toUsa = destAttr != null ? destAttr === "sí" : locale === "en"
  const usd = usdEquivalent(cart)
  const needsTaxId = toUsa && usd >= USD_THRESHOLD
  return { toUsa, taxId, needsTaxId, blocked: needsTaxId && !taxId, usd }
}

export function CustomsTaxIdField() {
  const { cart, updateAttributes, isPending } = useCart()
  const { locale } = useLocale()
  const en = locale === "en"
  const attrs = cart?.attributes ?? []
  const serverTaxId = attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? ""
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  const defaultToUsa = destAttr != null ? destAttr === "sí" : en

  const [toUsa, setToUsa] = useState(defaultToUsa)
  const [taxId, setTaxId] = useState("")
  const seeded = useRef(false)

  // Sembrar el Tax ID desde el carrito una sola vez (sobrevive refresh).
  useEffect(() => {
    if (!seeded.current && serverTaxId) {
      setTaxId(serverTaxId)
      setToUsa(true)
      seeded.current = true
    }
  }, [serverTaxId])

  const needsTaxId = toUsa && usdEquivalent(cart) >= USD_THRESHOLD
  const missing = needsTaxId && !taxId.trim()

  // cartAttributesUpdate reemplaza TODO el set — fusionamos preservando el resto.
  const setAttr = (key: string, value: string | null) => {
    const others = attrs
      .filter((a) => a.key !== key && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    updateAttributes(value ? [...others, { key, value }] : others)
  }

  const handleToggle = (checked: boolean) => {
    setToUsa(checked)
    setAttr(DEST_US_KEY, checked ? "sí" : null) // persistimos YA (lo lee el candado)
    if (!checked) {
      setTaxId("")
      if (serverTaxId) setAttr(TAX_ID_KEY, null)
    }
  }

  const handleBlur = () => {
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) setAttr(TAX_ID_KEY, trimmed || null)
  }

  const S = en
    ? { toUsa: "Shipping to the United States", label: "Tax ID / EIN", opt: "(optional, for U.S. customs)", req: "(required for orders ≥ $800)", ph: "e.g. 12-3456789", help: "Only if your carrier requires it to import into the U.S.", missing: "Enter your Tax ID to continue to payment (U.S. orders ≥ $800)." }
    : { toUsa: "Mi envío es a Estados Unidos", label: "Tax ID / EIN", opt: "(opcional, para aduana de EE.UU.)", req: "(requerido en pedidos ≥ $800)", ph: "Ej. 12-3456789", help: "Solo si tu paquetería lo requiere para importar a EE.UU.", missing: "Ingresa tu Tax ID para continuar al pago (pedidos ≥ $800 a EE.UU.)." }

  return (
    <div className="border-t border-border pt-4 mb-4 text-sm">
      <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text transition-colors">
        <input
          type="checkbox"
          checked={toUsa}
          onChange={(e) => handleToggle(e.target.checked)}
          className="accent-leather w-4 h-4 flex-shrink-0"
        />
        <span>{S.toUsa}</span>
      </label>

      {toUsa && (
        <div className="mt-3">
          <label htmlFor="us-tax-id" className="block text-text-muted mb-1.5 text-xs">
            {S.label}{" "}
            <span className={needsTaxId ? "text-terracotta" : "text-text-subtle"}>
              {needsTaxId ? S.req : S.opt}
            </span>
          </label>
          <input
            id="us-tax-id"
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            onBlur={handleBlur}
            disabled={isPending}
            placeholder={S.ph}
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={missing}
            className={`w-full px-3 py-2 bg-bg border text-sm text-text focus:outline-none disabled:opacity-50 ${
              missing ? "border-terracotta focus:border-terracotta" : "border-border focus:border-leather"
            }`}
          />
          <p className={`text-xs mt-1.5 ${missing ? "text-terracotta" : "text-text-subtle"}`}>
            {missing ? S.missing : S.help}
          </p>
        </div>
      )}
    </div>
  )
}
