import { useId } from "react"

/**
 * JudgemeStars — componente de rating reusable (server component).
 *
 * Render por estado:
 *   - rating null o 0 → texto "Sin reseñas aún" (color text-subtle)
 *   - rating > 0      → 5 estrellas SVG (filled / half / empty) + número + (count)
 *
 * Estrellas en color cuero (#4B2E1F = brand `leather`). Las "filled" usan
 * fill="currentColor", las "empty" stroke. Las "half" usan un linearGradient
 * inline con id único garantizado por React useId (evita colisiones cuando
 * múltiples cards renderizan en la misma página con rating idéntico).
 *
 * Tamaños: sm=14px (cards), md=18px (default), lg=22px (PDP).
 *
 * Fallback graceful: si no hay metafields de Judge.me (porque la tienda
 * aún no recibió la primera reseña), mostramos texto en vez de estrellas
 * vacías — así el UI no parece "roto" o "0/5".
 */

type Size = "sm" | "md" | "lg"

const SIZE_PX: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 22,
}

const SIZE_TEXT: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

type Props = {
  rating: number | null | undefined
  count?: number | null
  size?: Size
}

export function JudgemeStars({ rating, count, size = "md" }: Props) {
  const px = SIZE_PX[size]
  const textClass = SIZE_TEXT[size]
  // useId garantiza ID único por instancia (React 18+). Evita colisiones DOM
  // cuando varios JudgemeStars renderizan con mismo rating en la misma página.
  const uid = useId()

  if (!rating || rating <= 0) {
    return (
      <p className={`text-text-subtle ${textClass}`}>
        Sin reseñas aún
      </p>
    )
  }

  // Round a 1 decimal para display, ej. 4.27 → "4.3"
  const displayRating = Math.round(rating * 10) / 10
  // Solo agregar count al aria-label si hay count > 0 (guard contra count=0
  // y count=null que serían inconsistentes con rating>0 pero defensivo).
  const ariaCount =
    typeof count === "number" && count > 0 ? `, ${count} reseñas` : ""

  return (
    <div
      className={`flex items-center gap-1.5 text-leather ${textClass}`}
      aria-label={`Calificación ${displayRating} de 5${ariaCount}`}
    >
      <span className="flex items-center" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} index={i} rating={rating} size={px} uid={uid} />
        ))}
      </span>
      <span className="text-text font-medium">{displayRating.toFixed(1)}</span>
      {typeof count === "number" && count > 0 && (
        <span className="text-text-muted">({count})</span>
      )}
    </div>
  )
}

function Star({
  index,
  rating,
  size,
  uid,
}: {
  index: number
  rating: number
  size: number
  uid: string
}) {
  // Cuánto rellenar este star: full=1, half=0.5, empty=0
  const diff = rating - index
  const fill: "full" | "half" | "empty" =
    diff >= 0.75 ? "full" : diff >= 0.25 ? "half" : "empty"

  // ID único garantizado vía useId del parent + index local.
  // useId() ya devuelve algo tipo ":r3:" único por instancia.
  const gradId = `jstar-${uid}-${index}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="inline-block"
      fill={fill === "full" ? "currentColor" : fill === "half" ? `url(#${gradId})` : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      {fill === "half" && (
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
