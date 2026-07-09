"use client"

import { useEffect, useRef, useState } from "react"
import { useCart } from "./CartProvider"

/**
 * Campo condicional de Tax ID para envíos a Estados Unidos.
 *
 * En un carrito headless el país se elige en el checkout de Shopify, así que
 * el carrito no conoce el destino todavía. Por eso pedimos al cliente marcar
 * "Envío a EE.UU." y SOLO entonces mostramos el campo de Tax ID.
 *
 * El valor se guarda como ATRIBUTO DEL CARRITO → aparece en el pedido en el
 * Admin de Shopify, listo para la factura comercial / aduana. No es
 * obligatorio: solo relevante si la paquetería lo pide para importar.
 */

const TAX_ID_KEY = "Tax ID (aduana EE.UU.)"

export function CustomsTaxIdField() {
  const { cart, updateAttributes, isPending } = useCart()
  const serverTaxId =
    cart?.attributes?.find((a) => a.key === TAX_ID_KEY)?.value ?? ""

  const [toUsa, setToUsa] = useState(false)
  const [taxId, setTaxId] = useState("")
  const seeded = useRef(false)

  // Sembrar desde el carrito una sola vez (sobrevive refresh / re-hidratación).
  useEffect(() => {
    if (!seeded.current && serverTaxId) {
      setTaxId(serverTaxId)
      setToUsa(true)
      seeded.current = true
    }
  }, [serverTaxId])

  // cartAttributesUpdate reemplaza TODO el set de atributos, así que fusionamos
  // preservando cualquier otro que el carrito ya tuviera. Pasar "" quita el
  // nuestro (se omite del arreglo).
  const persist = (value: string) => {
    const others = (cart?.attributes ?? [])
      .filter((a) => a.key !== TAX_ID_KEY && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    updateAttributes(value ? [...others, { key: TAX_ID_KEY, value }] : others)
  }

  const handleToggle = (checked: boolean) => {
    setToUsa(checked)
    // Si desmarca y había algo guardado, lo limpiamos del pedido.
    if (!checked) {
      setTaxId("")
      if (serverTaxId) persist("")
    }
  }

  const handleBlur = () => {
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) persist(trimmed)
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
        <span>Mi envío es a Estados Unidos</span>
      </label>

      {toUsa && (
        <div className="mt-3">
          <label htmlFor="us-tax-id" className="block text-text-muted mb-1.5 text-xs">
            Tax ID / EIN{" "}
            <span className="text-text-subtle">(opcional, para aduana de EE.UU.)</span>
          </label>
          <input
            id="us-tax-id"
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            onBlur={handleBlur}
            disabled={isPending}
            placeholder="Ej. 12-3456789"
            autoCorrect="off"
            spellCheck={false}
            className="w-full px-3 py-2 bg-bg border border-border text-sm text-text focus:outline-none focus:border-leather disabled:opacity-50"
          />
          <p className="text-xs text-text-subtle mt-1.5">
            Solo si tu paquetería lo requiere para importar a EE.UU.
          </p>
        </div>
      )}
    </div>
  )
}
