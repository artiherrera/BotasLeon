"use client"

import { useLocale, useT } from "@/lib/i18n/context"

/**
 * Botón "Descargar catálogo". Enlaza al PDF pre-generado que corresponde al
 * idioma activo (catalogo-es.pdf / catalogo-en.pdf en /public, generados en el
 * build por scripts/generate-catalog.mjs). Descarga instantánea.
 */
export function CatalogButton({ className = "" }: { className?: string }) {
  const { locale } = useLocale()
  const t = useT()
  const href = locale === "en" ? "/catalogo-en.pdf" : "/catalogo-es.pdf"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-leather px-6 py-3 text-sm uppercase tracking-wider text-bg hover:bg-text transition-colors ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {t("catalog.download")}
    </a>
  )
}
