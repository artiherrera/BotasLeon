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

import Link from "next/link"
import { FREE_SHIPPING_THRESHOLD_LABEL } from "@/lib/shipping"

// Último item lleva a la sección de newsletter (reemplaza a la barra de anuncio
// que antes ocupaba una fila propia arriba del header).
const MESSAGES: Array<{ text: string; href?: string }> = [
  { text: "380 años de tradición" },
  { text: "León, capital mundial del cuero" },
  { text: `Envío GRATIS a partir de ${FREE_SHIPPING_THRESHOLD_LABEL}` },
  { text: "3, 6 y 9 meses sin intereses" },
  { text: "Tienda física en León →", href: "/visitanos" },
  { text: "Suscríbete y recibe ofertas antes que nadie →", href: "/#newsletter" },
]

const ITEM_CLS =
  "px-12 text-base md:text-lg font-medium tracking-wide whitespace-nowrap"

export function MarqueeBar() {
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
