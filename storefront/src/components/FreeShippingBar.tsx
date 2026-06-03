import { formatMoney } from "@/lib/utils"

/**
 * FreeShippingBar — barra compacta con progreso hacia envío gratis.
 *
 * Muestra cuánto falta para alcanzar el threshold de envío gratis, o
 * un mensaje de confirmación si ya se alcanzó. Visualmente vive en el
 * footer del CartDrawer y en el aside del /cart, justo arriba del
 * subtotal — el incentivo más fuerte para subir AOV.
 */

type Props = {
  subtotal: number
  threshold: number
  currency: string
}

export function FreeShippingBar({ subtotal, threshold, currency }: Props) {
  const reached = subtotal >= threshold
  const diff = Math.max(0, threshold - subtotal)
  const progress = Math.min(100, Math.max(0, (subtotal / threshold) * 100))

  if (reached) {
    return (
      <div className="py-2 text-xs text-leather font-medium flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>¡Tienes envío gratis!</span>
      </div>
    )
  }

  return (
    <div className="py-2">
      <p className="text-xs text-leather mb-1.5">
        Te faltan{" "}
        <span className="font-medium">{formatMoney(diff, currency)}</span>{" "}
        para envío gratis
      </p>
      <div
        className="relative h-1.5 w-full bg-leather/15 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 bg-leather transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
