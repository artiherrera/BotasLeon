/**
 * PaymentBadges — fila de "trust badges" con los métodos de pago que
 * Shopify procesa para MX.
 *
 * No usamos logos oficiales (evita assets, evita lío de licencias, y
 * mantiene el look minimal monocromo del sitio). Texto mono en chips
 * con borde sutil es suficiente como señal de confianza.
 *
 * Cada chip lleva aria-label con el nombre legible — sin esto los
 * screen readers leen "M-C", "S-P-E-I", etc., letra por letra.
 */

const METHODS: Array<{ code: string; label: string }> = [
  { code: "VISA", label: "Visa" },
  { code: "MC", label: "Mastercard" },
  { code: "AMEX", label: "American Express" },
  { code: "MP", label: "Mercado Pago" },
  { code: "OXXO", label: "OXXO" },
  { code: "SPEI", label: "SPEI" },
]

export function PaymentBadges() {
  return (
    <div className="flex flex-col items-center gap-2">
      <ul
        aria-label="Métodos de pago aceptados"
        role="list"
        className="flex flex-wrap items-center justify-center gap-1.5 list-none p-0 m-0"
      >
        {METHODS.map(({ code, label }) => (
          <li key={code}>
            <span
              aria-label={label}
              title={label}
              className="inline-block px-2 py-1 border border-border text-[10px] font-mono text-text-muted leading-none tracking-wider"
            >
              <span aria-hidden="true">{code}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-text-subtle text-center">
        Pago 100% seguro · Procesado por Shopify
      </p>
    </div>
  )
}
