"use client"

import { useT } from "@/lib/i18n/context"

/**
 * Empty state visualmente decente para cuando aún no hay productos
 * (tienda recién creada). Se ve "intencional" no "rota".
 */
export function EmptyProductsState({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const t = useT()
  const resolvedTitle = title ?? t("empty.title")
  const resolvedDescription = description ?? t("empty.desc")
  return (
    <div className="border border-border bg-bg-alt rounded-sm py-20 px-6 text-center">
      <div className="mx-auto w-16 h-16 mb-6 text-leather-light">
        {/* Bota silueta */}
        <svg viewBox="0 0 64 64" fill="currentColor">
          <path d="M20 8h12c2 0 3 1 3 3v28h10c4 0 7 3 7 7v8c0 2-2 4-4 4H14c-2 0-4-2-4-4v-8c0-4 3-7 7-7h2V11c0-2 1-3 3-3zm3 6v24h6V14h-6zm-6 30c-2 0-3 1-3 3v6c0 1 1 1 1 1h32c1 0 1 0 1-1v-6c0-2-1-3-3-3H17z"/>
        </svg>
      </div>
      <h3 className="font-heading text-2xl text-text mb-2">{resolvedTitle}</h3>
      <p className="text-text-muted max-w-md mx-auto">{resolvedDescription}</p>
    </div>
  )
}
