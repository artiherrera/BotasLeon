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
 * Ya no bloquea nada: solo dice a dónde va el envío, para la leyenda de IVA.
 */
export function useCustomsGate() {
  const { cart } = useCart()
  const attrs = cart?.attributes ?? []
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  // El destino ya NO bloquea el pago: solo decide qué leyenda de impuesto se
  // muestra (a México el precio va con IVA incluido). La aceptación de
  // aranceles se retiró por completo — estos productos no los causan, así que
  // exigirla solo costaba ventas.
  return {
    destChosen: destAttr === "sí" || destAttr === "no",
    toUsa: destAttr === "sí",
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
  const destAttr = attrs.find((a) => a.key === DEST_US_KEY)?.value
  // null = todavía no elige. Los dos botones salen sin marcar.
  const inicial: boolean | null =
    destAttr === "sí" ? true : destAttr === "no" ? false : null

  const [toUsa, setToUsa] = useState<boolean | null>(inicial)
  const [taxId, setTaxId] = useState("")
  const seeded = useRef(false)

  // Sembrar el Tax ID guardado una sola vez (sobrevive al refresh).
  useEffect(() => {
    if (seeded.current || !serverTaxId) return
    setTaxId(serverTaxId)
    seeded.current = true
  }, [serverTaxId])

  // `toUsa` puede ser null (sin elegir); de aquí para abajo se trabaja en firme.
  const esUsa = toUsa === true
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
      // Se persiste "no" (no se borra) para que el carrito recuerde el destino
      // y la leyenda de IVA sea la correcta al recargar.
      setTaxId("")
      setAttrs({ [DEST_US_KEY]: "no", [TAX_ID_KEY]: null })
    }
  }


  const handleBlur = () => {
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) setAttr(TAX_ID_KEY, trimmed || null)
  }

  const S = en
    ? {
        destQuestion: "Where are we shipping your order?",
        destUsa: "United States",
        destMx: "Mexico",
        destMxNote: "Domestic shipping — no customs paperwork.",
        label: "Tax ID / EIN",
        opt: "(optional, for U.S. customs)",
        req: "(required for orders ≥ $800)",
        ph: "e.g. 12-3456789",
        help: "Only if your carrier requires it to import into the U.S.",
        missing: "Enter your Tax ID to continue to payment (U.S. orders ≥ $800).",
      }
    : {
        destQuestion: "¿A dónde enviamos tu pedido?",
        destUsa: "Estados Unidos",
        destMx: "México",
        destMxNote: "Envío nacional — sin trámite de aduana.",
        label: "Tax ID / EIN",
        opt: "(opcional, para aduana de EE.UU.)",
        req: "(requerido en pedidos ≥ $800)",
        ph: "Ej. 12-3456789",
        help: "Solo si tu paquetería lo requiere para importar a EE.UU.",
        missing: "Ingresa tu Tax ID para continuar al pago (pedidos ≥ $800 a EE.UU.).",
      }

  return (
    <div className="border-t border-border pt-4 mb-4 text-sm">
      {/* Elección explícita de destino. Antes era una casilla marcada por
          defecto: el cliente mexicano tenía que descubrir que debía desmarcarla
          y al mexicano se le exigía aceptar aranceles que no le tocan. */}
      <p className="text-text-muted mb-2">{S.destQuestion}</p>
      <div className="flex gap-2" role="group" aria-label={S.destQuestion}>
        {([true, false] as const).map((isUsa) => (
          <button
            key={String(isUsa)}
            type="button"
            onClick={() => handleToggle(isUsa)}
            aria-pressed={toUsa === isUsa}
            className={`px-4 py-2 rounded-full border text-sm transition-colors ${
              toUsa === isUsa
                ? "border-leather bg-text text-bg"
                : "border-border text-text hover:border-leather"
            }`}
          >
            {isUsa ? S.destUsa : S.destMx}
          </button>
        ))}
      </div>

      {toUsa === false && (
        <p className="mt-2.5 text-xs text-text-subtle">{S.destMxNote}</p>
      )}

      {esUsa && (
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
