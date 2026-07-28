"use client"

import Image from "next/image"
import { useT } from "@/lib/i18n/context"

/**
 * PaymentBadges — fila de logos oficiales de tarjetas aceptadas.
 *
 * Solo los 3 internacionales con SVG oficial (Visa, Mastercard, Amex)
 * descargados de aaronfagan/svg-credit-card-payment-icons (MIT license).
 *
 * Mercado Pago / OXXO / SPEI omitidos hasta tener los SVGs oficiales
 * de cada uno — preferimos ausencia clean a aproximaciones que digan
 * "es brand asset hecho por mi sobrino".
 */

type Method = {
  code: string
  label: string
  src: string
}

const METHODS: Method[] = [
  { code: "visa", label: "Visa", src: "/payment-logos/visa.svg" },
  { code: "mastercard", label: "Mastercard", src: "/payment-logos/mastercard.svg" },
  { code: "amex", label: "American Express", src: "/payment-logos/amex.svg" },
]

export function PaymentBadges() {
  const t = useT()
  return (
    <div className="flex flex-col items-center gap-3">
      <ul
        aria-label={t("pay.methodsLabel")}
        role="list"
        className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0"
      >
        {METHODS.map(({ code, label, src }) => (
          <li key={code}>
            <span
              aria-label={label}
              title={label}
              className="inline-flex items-center justify-center w-12 h-8 bg-white rounded shadow-sm overflow-hidden"
            >
              <Image
                src={src}
                alt={label}
                width={40}
                height={26}
                className="w-10 h-6 object-contain"
                unoptimized
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-bg-alt/70">
        {t("pay.secureNote")}
      </p>
    </div>
  )
}
