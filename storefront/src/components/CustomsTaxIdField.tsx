"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useCart } from "./CartProvider"
import { useLocale } from "@/lib/i18n/context"
import { requiresUsCustoms } from "@/lib/market"

/**
 * TAX ID DE ADUANA — OBLIGATORIO EN LA .COM (2026-10-12, pedido del dueño).
 *
 * Un paquete que cruza a Estados Unidos entra a nombre de alguien, y ese
 * alguien es el comprador: desde que se dejó el DDP, él paga el arancel y él
 * es el importador. La paquetería pide un número de contribuyente para
 * liberarlo. Mientras fue opcional casi nadie lo escribía y el dato había que
 * perseguirlo por WhatsApp con el paquete ya detenido.
 *
 * Ahora sin Tax ID no se pasa a pagar. Es fricción deliberada: cuesta algún
 * carrito abandonado y ahorra paquetes varados, que cuestan más —y cuestan
 * dos veces, porque el regreso también se paga—.
 *
 * SOLO EN EL MERCADO DE ESTADOS UNIDOS. En la .mx no hay aduana que declarar y
 * este bloque ni se pinta: `requiresUsCustoms` es false ahí (lib/market.ts).
 *
 * DÓNDE SE VE DESPUÉS. Viaja como atributo del carrito (`cartAttributesUpdate`)
 * y Shopify lo arrastra al pedido: sale en el panel, en el pedido, bajo
 * "Additional details" / "Detalles adicionales", con esta misma etiqueta.
 * Comprobado el 2026-10-12 contra la Storefront API: el atributo queda en el
 * carrito y el checkoutUrl es el de ESE carrito, así que llega al pedido.
 * No se guarda en ningún otro lado: no es dato que queramos almacenar.
 *
 * NUEVE DÍGITOS. EIN, SSN e ITIN tienen nueve; se aceptan con guiones, espacios
 * o sin nada. No se valida contra el SAT gringo —no hay API pública— pero un
 * número de otro largo es basura para la aduana, y dejar pasar basura es tener
 * el campo obligatorio de adorno.
 */
const TAX_ID_KEY = "Tax ID (aduana EE.UU.)"

/** Nueve dígitos, con la puntuación que sea. */
export function taxIdValido(valor: string | null | undefined): boolean {
  return (String(valor ?? "").match(/\d/g) ?? []).length === 9
}

/** Para que el aviso del botón pueda mandar el foco al campo. */
export const TAX_ID_INPUT_ID = "us-tax-id"

/**
 * Estado del candado de aduana — lo comparten el campo y el botón "Pagar".
 * `blocked` = falta el Tax ID de un envío a EE.UU.
 */
export function useCustomsGate() {
  const { cart } = useCart()
  const valor = (cart?.attributes ?? []).find((a) => a.key === TAX_ID_KEY)?.value ?? ""
  return {
    toUsa: requiresUsCustoms,
    blocked: requiresUsCustoms && !taxIdValido(valor),
    blockReason: requiresUsCustoms && !taxIdValido(valor) ? ("tax-id" as const) : null,
  }
}

/** Lleva el foco al campo y lo deja a la vista. Lo usa el aviso del botón. */
export function enfocarTaxId() {
  const el = document.getElementById(TAX_ID_INPUT_ID)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "center" })
  // El scroll suave y el foco se pelean: el foco gana y salta. Primero mueve,
  // después enfoca.
  window.setTimeout(() => el.focus({ preventScroll: true }), 300)
}

export function CustomsTaxIdField() {
  const { cart, updateAttributes, isPending } = useCart()
  const { locale } = useLocale()
  const en = locale === "en"
  // Memorizado: es dependencia de un efecto y un arreglo nuevo en cada
  // render lo dispararía sin que nada haya cambiado.
  const attrs = useMemo(() => cart?.attributes ?? [], [cart])
  const serverTaxId = attrs.find((a) => a.key === TAX_ID_KEY)?.value ?? ""

  const [taxId, setTaxId] = useState("")
  const [tocado, setTocado] = useState(false)
  const seeded = useRef(false)

  // Sembrar el Tax ID guardado una sola vez (sobrevive al refresh).
  useEffect(() => {
    if (seeded.current || !serverTaxId) return
    setTaxId(serverTaxId)
    seeded.current = true
  }, [serverTaxId])

  // cartAttributesUpdate reemplaza TODO el set. Un cambio de una sola llave
  // preserva el resto desde `attrs`.
  // La copia viva de los atributos para el guardado diferido. Se actualiza en
  // un efecto y no durante el render: escribir un ref mientras React pinta es
  // justo lo que prohíbe react-hooks/refs.
  const attrsRef = useRef(attrs)
  useEffect(() => {
    attrsRef.current = attrs
  }, [attrs])
  const setAttr = (key: string, value: string | null) => {
    const others = attrsRef.current
      .filter((a) => a.key !== key && a.value != null)
      .map((a) => ({ key: a.key, value: a.value as string }))
    updateAttributes(value ? [...others, { key, value }] : others)
  }

  // GUARDAR MIENTRAS ESCRIBE, no solo al salir del campo. El botón de pagar se
  // desbloquea con lo que está GUARDADO en el carrito; si solo guardáramos en
  // el blur, quien teclea los nueve dígitos y va directo al botón se lo
  // encuentra bloqueado hasta que la petición vuelve. Medio segundo de calma
  // basta, y el blur sigue guardando de inmediato.
  useEffect(() => {
    const limpio = taxId.trim()
    if (!taxIdValido(limpio) || limpio === serverTaxId) return
    const t = window.setTimeout(() => setAttr(TAX_ID_KEY, limpio), 500)
    return () => window.clearTimeout(t)
    // setAttr lee los atributos por ref, así que no necesita estar en las deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxId, serverTaxId])

  const handleBlur = () => {
    setTocado(true)
    const trimmed = taxId.trim()
    if (trimmed !== serverTaxId) setAttr(TAX_ID_KEY, trimmed || null)
  }

  const vacio = !taxId.trim()
  const invalido = !vacio && !taxIdValido(taxId)
  // El rojo solo después de tocar el campo: estrenarlo en error regaña a quien
  // todavía no ha escrito nada.
  const enError = tocado && (vacio || invalido)

  const S = en
    ? {
        label: "Tax ID / EIN",
        req: "(required — U.S. customs)",
        ph: "e.g. 12-3456789",
        help: "Nine digits. Your EIN if you're buying as a business, your SSN or ITIN if it's in your name. U.S. customs will not release the package without it.",
        vacio: "Enter your Tax ID to continue to payment.",
        malo: "A Tax ID has nine digits (EIN, SSN or ITIN).",
      }
    : {
        label: "Tax ID / EIN",
        req: "(obligatorio — aduana de EE.UU.)",
        ph: "Ej. 12-3456789",
        help: "Nueve dígitos. Es tu EIN si compras a nombre de una empresa, o tu SSN/ITIN si va a tu nombre. La aduana de EE.UU. no libera el paquete sin él.",
        vacio: "Escribe tu Tax ID para continuar al pago.",
        malo: "Un Tax ID tiene nueve dígitos (EIN, SSN o ITIN).",
      }

  // En México no hay aduana que declarar: sin este corte, el envoltorio pintaba
  // igual su border-t y sus 32px de aire, o sea una regla horizontal suelta en
  // medio del carrito de la .mx con nada debajo.
  if (!requiresUsCustoms) return null

  return (
    <div className="mb-4 border border-text/25 bg-bg p-3.5">
      <label htmlFor={TAX_ID_INPUT_ID} className="block cuerpo mb-1.5 text-text">
        <span className="font-medium">{S.label}</span>{" "}
        <span className="text-text-muted">{S.req}</span>
      </label>
      <input
        id={TAX_ID_INPUT_ID}
        type="text"
        inputMode="numeric"
        value={taxId}
        onChange={(e) => setTaxId(e.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
        placeholder={S.ph}
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={enError}
        aria-describedby={`${TAX_ID_INPUT_ID}-ayuda`}
        className={`campo disabled:opacity-50 ${enError ? "border-text" : ""}`}
      />
      <p
        id={`${TAX_ID_INPUT_ID}-ayuda`}
        className={`nota mt-1.5 ${enError ? "font-semibold text-text" : "text-text-subtle"}`}
        aria-live="polite"
      >
        {enError ? (invalido ? S.malo : S.vacio) : S.help}
      </p>
    </div>
  )
}
