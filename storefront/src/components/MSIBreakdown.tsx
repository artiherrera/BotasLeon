import { formatMoney } from "@/lib/utils"

/**
 * MSIBreakdown — desglose visual de meses sin intereses.
 *
 * Render solo si el monto cruza el umbral de 999 (debajo no aplica MSI
 * con la mayoría de tarjetas mexicanas). Es un nudge para reducir el
 * sticker shock en compras de boleto alto.
 */

type Props = {
  amount: number
  currency: string
}

const MSI_MONTHS = 9
const MSI_MIN_AMOUNT = 999

export function MSIBreakdown({ amount, currency }: Props) {
  if (!Number.isFinite(amount) || amount < MSI_MIN_AMOUNT) return null
  const perMonth = amount / MSI_MONTHS
  return (
    <p className="text-[11px] text-text-muted">
      o desde{" "}
      <span className="font-medium text-text">
        {formatMoney(perMonth, currency)}
      </span>{" "}
      al mes en {MSI_MONTHS} pagos sin intereses
    </p>
  )
}
