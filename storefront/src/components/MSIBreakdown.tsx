"use client"

import { formatMoney } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/context"

/**
 * MSIBreakdown — desglose visual de meses sin intereses.
 *
 * Render solo si el monto cruza el umbral de 999 (debajo no aplica MSI
 * con la mayoría de tarjetas mexicanas). Es un nudge para reducir el
 * sticker shock en compras de boleto alto.
 *
 * MSI es un beneficio SOLO de México. En inglés (mercado USA) este
 * componente no renderiza nada (return null cuando locale === "en").
 */

type Props = {
  amount: number
  currency: string
}

const MSI_MONTHS = 9
const MSI_MIN_AMOUNT = 999

export function MSIBreakdown({ amount, currency }: Props) {
  const { locale } = useLocale()
  if (locale === "en") return null
  if (!Number.isFinite(amount) || amount < MSI_MIN_AMOUNT) return null
  const perMonth = amount / MSI_MONTHS
  return (
    <p className="text-[11px] text-text-muted">
      o desde{" "}
      <span className="font-medium text-text">
        {formatMoney(perMonth, currency, 2)}
      </span>{" "}
      al mes en {MSI_MONTHS} pagos sin intereses
    </p>
  )
}
