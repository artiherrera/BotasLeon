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

const MESSAGES = [
  "380 años de experiencia",
  "León, capital mundial del cuero",
  "Envío MX y USA",
  "Cambio de talla",
  "3, 6 y 9 meses sin intereses",
]

export function MarqueeBar() {
  return (
    <div className="overflow-hidden bg-leather text-bg border-y border-leather-light/20">
      <div className="marquee-track flex w-max gap-12 py-3.5">
        {/* Items duplicados 2x para loop seamless */}
        {[...MESSAGES, ...MESSAGES].map((msg, idx) => (
          <span
            key={idx}
            className="flex items-center gap-12 text-sm font-medium tracking-wide whitespace-nowrap"
            aria-hidden={idx >= MESSAGES.length}
          >
            {msg}
            <span className="text-gold/70 select-none" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
