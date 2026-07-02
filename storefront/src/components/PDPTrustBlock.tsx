import type { Product } from "@/lib/shopify/types"
import { formatMoney } from "@/lib/utils"

/**
 * PDPTrustBlock — strip de confianza bajo el CTA del PDP.
 *
 * Tres módulos compactos apilados:
 *   1. Strip de 4 íconos: materiales, origen, devoluciones, pago seguro
 *   2. Banner MSI (solo si price >= 999) con cálculo de mensualidad a 9 meses
 *   3. Bloque "Taller" con vendor en font-heading
 *
 * Server component — no necesita interactividad. Mostrarlo en el column
 * derecho del PDP, debajo de ProductOptions y arriba de la descripción.
 *
 * Inspiración: trust strip de Tecovas, donde reforzar confianza justo
 * después del CTA reduce fricción de compra en categorías premium.
 */

type Props = {
  product: Product
}

export function PDPTrustBlock({ product }: Props) {
  const price = product.priceRange.minVariantPrice
  const priceNum = parseFloat(price.amount)
  const showMsi = priceNum >= 999
  const monthly = priceNum / 9

  return (
    <div className="mt-8 border border-border rounded-sm overflow-hidden bg-bg-alt/40">
      {/* 1. Íconos de garantía */}
      <ul className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <TrustItem
          label="Cuero 100%"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
        <TrustItem
          label="Hecho en León"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" />
              <path d="M3 10l9-6 9 6" />
              <path d="M5 21V10" />
              <path d="M19 21V10" />
              <path d="M9 21v-7h6v7" />
            </svg>
          }
        />
        <TrustItem
          label="Cambio 30 días"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          }
        />
        <TrustItem
          label="Pago seguro"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          }
        />
      </ul>

      {/* 2. Banner MSI */}
      {showMsi && (
        <div className="border-t border-border px-4 py-3 bg-bg">
          <p className="text-sm text-text">
            <span className="font-medium text-leather">3, 6 y 9 meses sin intereses</span>
            <span className="text-text-muted">
              {" "}
              · o desde {formatMoney(monthly, price.currencyCode, 2)} al mes en 9 pagos
            </span>
          </p>
        </div>
      )}

      {/* 3. Hecho por: vendor */}
      {product.vendor && (
        <div className="border-t border-border px-4 py-3">
          <p className="eyebrow text-leather text-xs mb-0.5">Taller</p>
          <p className="font-heading text-base text-text leading-tight">
            {product.vendor}
          </p>
        </div>
      )}
    </div>
  )
}

function TrustItem({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <li className="flex flex-col items-center justify-center text-center gap-2 px-3 py-4">
      <span className="w-5 h-5 text-leather" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs text-text-muted leading-tight">{label}</span>
    </li>
  )
}
