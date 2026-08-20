"use client"

import { useEffect, useRef, useState } from "react"
import { useCart } from "./CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { requiresUsCustoms } from "@/lib/market"

/**
 * Datos de aduana para envíos a EE.UU. (Tax ID + aceptación de aranceles).
 *
 * El carrito headless NO conoce el destino (la dirección se pone en el checkout
 * de Shopify), así que el cliente declara "envío a EE.UU." (marcado por defecto
 * en inglés). Lo declarado se guarda como ATRIBUTO del carrito → llega al pedido.
 *
 * Dos candados (`useCustomsGate`) bloquean "Pagar":
 *  1. ACEPTACIÓN de aranceles/aduana — OBLIGATORIA en TODO envío a EE.UU. El
 *     comprador asume los aranceles e impuestos de importación (no van en el
 *     precio ni el envío). Nos protege de disputas y paquetes rechazados.
 *  2. TAX ID — solo obligatorio en entradas FORMALES (≥ $800 USD, de minimis);
 *     debajo de eso es opcional (no frena la venta).
 *
 * Los casos que se declaran MX pero envían a EE.UU. los atrapa la automatización
 * post-pedido (Flow/Klaviyo).
 */
const TAX_ID_KEY = "Tax ID (aduana EE.UU.)"
const DEST_US_KEY = "Envío a EE.UU."
const CUSTOMS_ACK_KEY = "Acepta aranceles de aduana (EE.UU.)"
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
 * `blocked` = falta algo obligatorio para un envío a EE.UU.
 * `blockReason` = qué falta ("ack" tiene prioridad porque aplica a todo pedido).
 */
export function useCustomsGate() {
  const { cart } = useCart()
  // En el mercado mexicano no hay importación que declarar: ni campo, ni
  // candado. Los hooks de abajo siguen corriendo (no se pueden saltar), pero el
  // resultado se neutraliza al final.
  const { locale } = useLocale()
  const attrs = cart?.attributes ?? []
  const taxId = (attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? "").trim()
  const ack = (attrs.find((a) => a.key === CUSTOMS_ACK_KEY)?.value ?? "") === "sí"
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  const toUsa = destAttr != null ? destAttr === "sí" : true
  const usd = usdEquivalent(cart)
  const needsTaxId = toUsa && usd >= USD_THRESHOLD
  const ackMissing = toUsa && !ack
  const taxIdMissing = needsTaxId && !taxId
  const blockReason: "ack" | "taxId" | null = ackMissing
    ? "ack"
    : taxIdMissing
      ? "taxId"
      : null
  if (!requiresUsCustoms) {
    return {
      toUsa: false,
      taxId: "",
      ack: true,
      needsTaxId: false,
      ackMissing: false,
      blockReason: null,
      blocked: false,
      usd,
    }
  }

  return {
    toUsa,
    taxId,
    ack,
    needsTaxId,
    ackMissing,
    blockReason,
    blocked: blockReason != null,
    usd,
  }
}

export function CustomsTaxIdField() {
  const { cart, updateAttributes, isPending } = useCart()
  const { locale } = useLocale()
  const en = locale === "en"
  const attrs = cart?.attributes ?? []
  const serverTaxId = attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? ""
  const serverAck = (attrs.find((a) => a.key === CUSTOMS_ACK_KEY)?.value ?? "") === "sí"
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  const defaultToUsa = destAttr != null ? destAttr === "sí" : true

  const [toUsa, setToUsa] = useState(defaultToUsa)
  const [taxId, setTaxId] = useState("")
  const [ack, setAck] = useState(false)
  const seeded = useRef(false)

  // Sembrar desde el carrito una sola vez (sobrevive refresh).
  useEffect(() => {
    if (seeded.current) return
    if (serverTaxId || serverAck) {
      if (serverTaxId) setTaxId(serverTaxId)
      if (serverAck) setAck(true)
      setToUsa(true)
      seeded.current = true
    }
  }, [serverTaxId, serverAck])

  const needsTaxId = toUsa && usdEquivalent(cart) >= USD_THRESHOLD
  const taxMissing = needsTaxId && !taxId.trim()
  const ackMissing = toUsa && !ack

  // cartAttributesUpdate reemplaza TODO el set. Un cambio de una sola llave
  // preserva el resto desde `attrs`.
  const setAttr = (key: string, value: string | null) => {
    const others = attrs
      .filter((a) => a.key !== key && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    updateAttributes(value ? [...others, { key, value }] : others)
  }

  // Varias llaves a la vez (evita condiciones de carrera al apagar "EE.UU.").
  const setAttrs = (changes: Record<string, string | null>) => {
    const keys = new Set(Object.keys(changes))
    const others = attrs
      .filter((a) => !keys.has(a.key) && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    const added = Object.entries(changes)
      .filter(([, v]) => v != null)
      .map(([key, value]) => ({ key, value: value as string }))
    updateAttributes([...others, ...added])
  }

  const handleToggle = (checked: boolean) => {
    setToUsa(checked)
    if (checked) {
      setAttr(DEST_US_KEY, "sí") // persistimos YA (lo lee el candado)
    } else {
      // Al desmarcar EE.UU., limpiamos todo lo de aduana de un solo golpe.
      setTaxId("")
      setAck(false)
      setAttrs({ [DEST_US_KEY]: null, [TAX_ID_KEY]: null, [CUSTOMS_ACK_KEY]: null })
    }
  }

  const handleAck = (checked: boolean) => {
    setAck(checked)
    setAttr(CUSTOMS_ACK_KEY, checked ? "sí" : null)
  }

  const handleBlur = () => {
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) setAttr(TAX_ID_KEY, trimmed || null)
  }

  const S = en
    ? {
        toUsa: "Shipping to the United States",
        label: "Tax ID / EIN",
        opt: "(optional, for U.S. customs)",
        req: "(required for orders ≥ $800)",
        ph: "e.g. 12-3456789",
        help: "Only if your carrier requires it to import into the U.S.",
        missing: "Enter your Tax ID to continue to payment (U.S. orders ≥ $800).",
        customsNotice:
          "Any U.S. import duties and customs taxes are the buyer's responsibility. They are not included in the product price or shipping.",
        customsAck: "I understand and accept that these charges are my responsibility.",
      }
    : {
        toUsa: "Mi envío es a Estados Unidos",
        label: "Tax ID / EIN",
        opt: "(opcional, para aduana de EE.UU.)",
        req: "(requerido en pedidos ≥ $800)",
        ph: "Ej. 12-3456789",
        help: "Solo si tu paquetería lo requiere para importar a EE.UU.",
        missing: "Ingresa tu Tax ID para continuar al pago (pedidos ≥ $800 a EE.UU.).",
        customsNotice:
          "Los aranceles e impuestos de importación que cobre la aduana de EE.UU. corren por cuenta del comprador. No están incluidos en el precio del producto ni en el envío.",
        customsAck: "Entiendo y acepto que estos cargos corren por mi cuenta.",
      }

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
            aria-invalid={taxMissing}
            className={`w-full px-3 py-2 bg-bg border text-sm text-text focus:outline-none disabled:opacity-50 ${
              taxMissing ? "border-terracotta focus:border-terracotta" : "border-border focus:border-leather"
            }`}
          />
          <p className={`text-xs mt-1.5 ${taxMissing ? "text-terracotta" : "text-text-subtle"}`}>
            {taxMissing ? S.missing : S.help}
          </p>

          {/* Aceptación OBLIGATORIA de aranceles/aduana (todo envío a EE.UU.). */}
          <div
            className={`mt-3 rounded-md border p-3 transition-colors ${
              ackMissing
                ? "border-terracotta bg-terracotta/5"
                : "border-border bg-bg-alt"
            }`}
          >
            <p className="text-xs text-text-muted leading-relaxed">{S.customsNotice}</p>
            <label className="mt-2.5 flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => handleAck(e.target.checked)}
                aria-invalid={ackMissing}
                className="accent-leather w-4 h-4 mt-0.5 flex-shrink-0"
              />
              <span
                className={`text-xs font-medium ${
                  ackMissing ? "text-terracotta" : "text-text"
                }`}
              >
                {S.customsAck}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
