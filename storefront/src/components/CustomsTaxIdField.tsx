"use client"

import { useEffect, useRef, useState } from "react"
import { useCart } from "./CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { requiresUsCustoms } from "@/lib/market"

/**
 * Destino del envío + Tax ID opcional.
 *
 * Ya NO se piden aranceles: estos productos no los causan, y la aceptación
 * obligatoria que había antes era una pared en el camino al pago sin proteger
 * nada. Hoy este bloque solo hace dos cosas, y ninguna bloquea la compra:
 *
 *  1. Preguntar a dónde va el envío (EE.UU. o México), porque de eso depende la
 *     leyenda de impuesto: a México el precio va con IVA incluido.
 *  2. Ofrecer el Tax ID / EIN por si la paquetería lo pide al importar. Opcional
 *     siempre.
 */
const TAX_ID_KEY = "Tax ID (aduana EE.UU.)"
const DEST_US_KEY = "Envío a EE.UU."
const MXN_PER_USD = 18 // aprox — solo para ubicar el umbral de $800 si el carrito está en MXN



/**
 * Estado del candado de aduana — lo comparten el campo y el botón "Pagar".
 * `blocked` = falta algo obligatorio para un envío a EE.UU.
 * Ya no bloquea nada: solo dice a dónde va el envío, para la leyenda de IVA.
 */
export function useCustomsGate() {
  // Ya no bloquea nada ni pregunta destino: el mercado del despliegue fija el
  // país del carrito (lib/market.ts), y estos productos no causan aranceles.
  // Se conserva la firma para no romper a quien lo consuma.
  return {
    toUsa: requiresUsCustoms,
    blocked: false as const,
    blockReason: null as null,
  }
}

export function CustomsTaxIdField() {
  const { cart, updateAttributes, isPending } = useCart()
  const { locale } = useLocale()
  const en = locale === "en"
  const attrs = cart?.attributes ?? []
  const serverTaxId = attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? ""

  const [taxId, setTaxId] = useState("")
  const seeded = useRef(false)

  // Sembrar el Tax ID guardado una sola vez (sobrevive al refresh).
  useEffect(() => {
    if (seeded.current || !serverTaxId) return
    setTaxId(serverTaxId)
    seeded.current = true
  }, [serverTaxId])

  const needsTaxId = false // nunca obligatorio: no debe frenar el pago

  const taxMissing = needsTaxId && !taxId.trim()

  // cartAttributesUpdate reemplaza TODO el set. Un cambio de una sola llave
  // preserva el resto desde `attrs`.
  const setAttr = (key: string, value: string | null) => {
    const others = attrs
      .filter((a) => a.key !== key && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    updateAttributes(value ? [...others, { key, value }] : others)
  }




  const handleBlur = () => {
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) setAttr(TAX_ID_KEY, trimmed || null)
  }

  const S = en
    ? {
        label: "Tax ID / EIN",
        opt: "(optional, for U.S. customs)",
        req: "(required for orders ≥ $800)",
        ph: "e.g. 12-3456789",
        help: "Only if your carrier requires it to import into the U.S.",
        missing: "Enter your Tax ID to continue to payment (U.S. orders ≥ $800).",
      }
    : {
        label: "Tax ID / EIN",
        opt: "(opcional, para aduana de EE.UU.)",
        req: "(requerido en pedidos ≥ $800)",
        ph: "Ej. 12-3456789",
        help: "Solo si tu paquetería lo requiere para importar a EE.UU.",
        missing: "Ingresa tu Tax ID para continuar al pago (pedidos ≥ $800 a EE.UU.).",
      }

  return (
    <div className="border-t border-border pt-4 mb-4 text-sm">
      {/* El destino NO se pregunta: el mercado del despliegue ya lo fija
          (lib/market.ts → COUNTRY → buyerIdentity del carrito). Preguntarlo era
          teatro: elegir "México" en un build de EE.UU. no cambiaba el cobro,
          solo apagaba la leyenda correcta de impuesto. La .mx tendrá su propio
          despliegue en pesos. */}
      {requiresUsCustoms && (
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

        </div>
      )}
    </div>
  )
}
