import Image from "next/image"

/**
 * PaymentBadges — fila de logos reales de métodos de pago que Shopify
 * procesa para MX.
 *
 * Mix de estrategias:
 *  - Visa, Mastercard, Amex → SVGs oficiales en /public/payment-logos/
 *    (descargados de aaronfagan/svg-credit-card-payment-icons, MIT).
 *  - Mercado Pago, OXXO, SPEI → SVG inline porque los oficiales requieren
 *    cuenta de merchant en cada portal y no son trivially descargables.
 *    Las inline matches a brand colors recognizables al instante.
 *
 * Cada badge en card blanca con esquinas redondeadas — los logos
 * internacionales ya tienen background propio, las inline también.
 * El frame blanco unifica visualmente.
 */

type Method = {
  code: string
  label: string
  type: "image" | "inline"
  // Para type="image"
  src?: string
  // Para type="inline"
  icon?: React.ReactNode
}

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
  { code: "visa", label: "Visa", type: "image", src: "/payment-logos/visa.svg" },
  { code: "mastercard", label: "Mastercard", type: "image", src: "/payment-logos/mastercard.svg" },
  { code: "amex", label: "American Express", type: "image", src: "/payment-logos/amex.svg" },
  { code: "mercadopago", label: "Mercado Pago", type: "inline", icon: MercadoPagoIcon },
  { code: "oxxo", label: "OXXO", type: "inline", icon: OxxoIcon },
  { code: "spei", label: "SPEI", type: "inline", icon: SpeiIcon },
]

export function PaymentBadges() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ul
        aria-label="Métodos de pago aceptados"
        role="list"
        className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0"
      >
        {METHODS.map((method) => (
          <li key={method.code}>
            <span
              aria-label={method.label}
              title={method.label}
              className="inline-flex items-center justify-center w-12 h-8 bg-white rounded shadow-sm overflow-hidden"
            >
              {method.type === "image" && method.src ? (
                <Image
                  src={method.src}
                  alt={method.label}
                  width={40}
                  height={26}
                  className="w-10 h-6 object-contain"
                  unoptimized
                />
              ) : (
                <span aria-hidden="true" className="w-10 h-6 flex items-center justify-center">
                  {method.icon}
                </span>
              )}
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
