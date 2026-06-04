/**
 * PaymentBadges — fila de logos reales de métodos de pago que Shopify
 * procesa para MX.
 *
 * Cada badge: SVG inline con los colores de marca oficiales sobre
 * tarjeta blanca con esquinas redondeadas. SVG inline (no archivos
 * externos) para LCP rápido + cero dependencias + control total.
 *
 * aria-label en cada item para que screen readers digan el nombre
 * completo de la marca, no las letras.
 */

type Method = {
  code: string
  label: string
  // Width del viewBox del SVG. Heights todos a 24 para alineación.
  width: number
  icon: React.ReactNode
}

const VisaIcon = (
  <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="#1A1F71" fontFamily="Helvetica, Arial, sans-serif" fontWeight="900" fontStyle="italic">
      <text x="2" y="19" fontSize="20" letterSpacing="-0.5">VISA</text>
    </g>
  </svg>
)

const MastercardIcon = (
  <svg viewBox="0 0 48 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="18" cy="15" r="12" fill="#EB001B" />
    <circle cx="30" cy="15" r="12" fill="#F79E1B" />
    <path
      d="M24 6.5a12 12 0 0 0 0 17 12 12 0 0 0 0-17z"
      fill="#FF5F00"
    />
  </svg>
)

const AmexIcon = (
  <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0" y="0" width="64" height="24" rx="2" fill="#2E77BC" />
    <text
      x="32"
      y="16"
      fill="#FFFFFF"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontSize="11"
      textAnchor="middle"
      letterSpacing="1"
    >
      AMEX
    </text>
  </svg>
)

const MercadoPagoIcon = (
  <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0" y="0" width="64" height="24" rx="3" fill="#00B1EA" />
    <text
      x="32"
      y="15"
      fill="#FFFFFF"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="700"
      fontSize="8"
      textAnchor="middle"
      letterSpacing="0.3"
    >
      mercado
    </text>
    <text
      x="32"
      y="22"
      fill="#FFE600"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontSize="6"
      textAnchor="middle"
      letterSpacing="1"
    >
      PAGO
    </text>
  </svg>
)

const OxxoIcon = (
  <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0" y="0" width="64" height="24" rx="2" fill="#E30613" />
    <text
      x="32"
      y="17"
      fill="#FFFFFF"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontSize="13"
      textAnchor="middle"
      letterSpacing="1.5"
    >
      OXXO
    </text>
  </svg>
)

const SpeiIcon = (
  <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0" y="0" width="64" height="24" rx="2" fill="#9C0F2E" />
    <text
      x="32"
      y="17"
      fill="#FFFFFF"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontSize="13"
      textAnchor="middle"
      letterSpacing="1.5"
    >
      SPEI
    </text>
  </svg>
)

const METHODS: Method[] = [
  { code: "visa", label: "Visa", width: 64, icon: VisaIcon },
  { code: "mastercard", label: "Mastercard", width: 48, icon: MastercardIcon },
  { code: "amex", label: "American Express", width: 64, icon: AmexIcon },
  { code: "mercadopago", label: "Mercado Pago", width: 64, icon: MercadoPagoIcon },
  { code: "oxxo", label: "OXXO", width: 64, icon: OxxoIcon },
  { code: "spei", label: "SPEI", width: 64, icon: SpeiIcon },
]

export function PaymentBadges() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ul
        aria-label="Métodos de pago aceptados"
        role="list"
        className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0"
      >
        {METHODS.map(({ code, label, icon }) => (
          <li key={code}>
            <span
              aria-label={label}
              title={label}
              className="inline-flex items-center justify-center w-12 h-8 bg-white rounded shadow-sm overflow-hidden"
            >
              <span aria-hidden="true" className="w-10 h-6 flex items-center justify-center">
                {icon}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-bg-alt/70">
        Pago 100% seguro · Procesado por Shopify
      </p>
    </div>
  )
}
