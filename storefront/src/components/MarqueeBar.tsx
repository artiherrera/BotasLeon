/**
 * MarqueeBar — cintillo horizontal scrolling con mensajes de trust.
 *
 * Reemplaza el TrustBadges estático. CSS-only animation, sin deps.
 * Para loop seamless duplicamos los items 2x en JSX — cuando el primer
 * set scroll-out, el segundo queda exactamente en la misma posición
 * en que arrancó el primero. Animación define `to: -50%` (la mitad
 * del contenido duplicado = la longitud original).
 *
 * Pause-on-hover para que el lector pueda parar a leer un mensaje.
 */

"use client"

import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { FREE_SHIPPING_THRESHOLD_LABEL } from "@/lib/shipping"
import { useT } from "@/lib/i18n/context"

// Cada item es una LLAVE del diccionario. La versión inglesa (mercado USA) NO
// promete envío gratis ni MSI — son beneficios solo de México; ver dictionary.
const MESSAGE_SPECS: Array<{ key: string; href?: string; vars?: Record<string, string> }> = [
  { key: "marquee.tradition" },
  { key: "marquee.leather" },
  { key: "marquee.shipping", vars: { threshold: FREE_SHIPPING_THRESHOLD_LABEL } },
  { key: "marquee.msi" },
  { key: "marquee.store", href: "/visitanos" },
  { key: "marquee.newsletter", href: "/#newsletter" },
]

const ITEM_CLS =
  "px-12 text-base md:text-lg font-medium tracking-wide whitespace-nowrap"

export function MarqueeBar() {
  const t = useT()
  const MESSAGES = MESSAGE_SPECS.map((spec) => {
    let text = t(spec.key)
    if (spec.vars) {
      for (const [k, v] of Object.entries(spec.vars)) text = text.replace(`{${k}}`, v)
    }
    return { text, href: spec.href }
  })
  return (
    <div className="overflow-hidden bg-leather text-bg border-y border-leather-light/20">
      <div className="marquee-track flex w-max py-5">
        {/* Items duplicados 2x para loop seamless */}
        {[...MESSAGES, ...MESSAGES].map((msg, idx) => {
          const dup = idx >= MESSAGES.length
          return msg.href ? (
            <Link
              key={idx}
              href={msg.href}
              aria-hidden={dup}
              tabIndex={dup ? -1 : undefined}
              className={`${ITEM_CLS} text-gold hover:text-bg transition-colors`}
            >
              {msg.text}
            </Link>
          ) : (
            <span key={idx} className={ITEM_CLS} aria-hidden={dup}>
              {msg.text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
